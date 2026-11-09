'use strict';

/**
 * Configuracion central del backend ApuestaDB.
 * Lee las variables de entorno (.env) y expone valores ya tipados.
 *
 * Este archivo es la unica puerta de entrada a process.env: el resto de las
 * capas importa `config` y nunca lee variables de entorno directamente.
 */

const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
  override: process.env.NODE_ENV !== 'production',
});

function aEntero(valor, porDefecto) {
  const numero = Number.parseInt(valor, 10);
  return Number.isFinite(numero) ? numero : porDefecto;
}

function aBooleano(valor, porDefecto) {
  if (valor === undefined || valor === null || valor === '') return porDefecto;
  return ['true', '1', 'si', 'yes'].includes(String(valor).trim().toLowerCase());
}

function aLista(valor, porDefecto) {
  if (!valor) return porDefecto;
  const elementos = String(valor)
    .split(',')
    .map((elemento) => elemento.trim())
    .filter(Boolean);
  return elementos.length > 0 ? elementos : porDefecto;
}

const config = {
  entorno: process.env.NODE_ENV || 'development',
  puerto: aEntero(process.env.PORT, 4000),
  apiPrefijo: process.env.API_PREFIX || '/api',

  cors: {
    origenes: aLista(process.env.CORS_ORIGINS, ['http://localhost:5173']),
  },

  jwt: {
    secreto: process.env.JWT_SECRET || '',
    expiracion: process.env.JWT_EXPIRES_IN || '2h',
    emisor: process.env.JWT_ISSUER || 'apuestadb-api',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
    stateSecret:
      process.env.GOOGLE_STATE_SECRET ||
      process.env.JWT_SECRET ||
      crypto.randomBytes(32).toString('hex'),
    frontendOrigin: (aLista(process.env.CORS_ORIGINS, ['http://localhost:5173']).find((origen) =>
      /^https?:\/\/[^*]+$/i.test(origen),
    ) || 'http://localhost:5173').replace(/\/$/, ''),
  },

  bcrypt: {
    rondas: aEntero(process.env.BCRYPT_ROUNDS, 10),
  },

  bd: {
    servidor: process.env.DB_SERVER || 'localhost',
    puerto: aEntero(process.env.DB_PORT, 1433),
    baseDatos: process.env.DB_NAME || 'ApuestaDB',
    usuario: process.env.DB_USER || '',
    contrasena: process.env.DB_PASSWORD || '',
    modoAutenticacion: (process.env.DB_AUTH_MODE || 'sql').toLowerCase(),
    cifrar: aBooleano(process.env.DB_ENCRYPT, true),
    confiarCertificadoServidor: aBooleano(process.env.DB_TRUST_SERVER_CERTIFICATE, true),
    poolMax: aEntero(process.env.DB_POOL_MAX, 10),
    poolMin: aEntero(process.env.DB_POOL_MIN, 0),
    tiempoConexion: aEntero(process.env.DB_CONNECT_TIMEOUT, 15000),
    tiempoPeticion: aEntero(process.env.DB_REQUEST_TIMEOUT, 30000),
  },

  // Motores auxiliares (Fase 14.5). SQL Server sigue siendo el motor funcional.
  mysql: {
    host: process.env.MYSQL_HOST || '',
    puerto: aEntero(process.env.MYSQL_PORT, 3307),
    baseDatos: process.env.MYSQL_DATABASE || '',
    usuario: process.env.MYSQL_USER || '',
    contrasena: process.env.MYSQL_PASSWORD || '',
    tiempoConexion: aEntero(process.env.MYSQL_CONNECT_TIMEOUT, 5000),
  },

  postgresql: {
    host: process.env.POSTGRES_HOST || '',
    puerto: aEntero(process.env.POSTGRES_PORT, 5433),
    baseDatos: process.env.POSTGRES_DB || '',
    usuario: process.env.POSTGRES_USER || '',
    contrasena: process.env.POSTGRES_PASSWORD || '',
    tiempoConexion: aEntero(process.env.POSTGRES_CONNECT_TIMEOUT, 5000),
  },

  mongodb: {
    uri: process.env.MONGO_URI || '',
    baseDatos: process.env.MONGO_DATABASE || '',
    tiempoConexion: aEntero(process.env.MONGO_CONNECT_TIMEOUT, 5000),
  },

  // Motor que resuelve las consultas de catalogo y eventos (Fase 15).
  catalogo: {
    motor: (process.env.CATALOGO_MOTOR || 'sqlserver').toLowerCase(),
  },

  // Motor del dominio documental de apuestas (Fase 17).
  apuestas: {
    motor: (process.env.APUESTAS_MOTOR || 'sqlserver').toLowerCase(),
  },

  // Motor de liquidaciones, notificaciones y auditoria (Fase 17.1).
  documentos: {
    motor: (process.env.DOCUMENTOS_MOTOR || 'sqlserver').toLowerCase(),
  },

  // Motor que resuelve las LECTURAS del dominio financiero (Fase 16).
  saldo: {
    motor: (process.env.SALDO_MOTOR || 'sqlserver').toLowerCase(),
  },

  auditoria: {
    registrarAccesos: aBooleano(process.env.AUDIT_ACCESS, true),
  },

  log: {
    nivel: process.env.LOG_LEVEL || 'info',
  },
};

/**
 * Devuelve la lista de problemas de configuracion detectados (texto legible).
 * No lanza excepciones: server.js decide si son advertencias o errores fatales.
 */
function validarConfiguracion() {
  const problemas = [];

  if (!config.jwt.secreto) {
    problemas.push('JWT_SECRET no esta definido.');
  } else if (config.jwt.secreto.length < 32) {
    problemas.push('JWT_SECRET debe tener 32 caracteres o mas.');
  }

  if (!config.bd.baseDatos) problemas.push('DB_NAME no esta definido.');

  if (config.entorno === 'production' && config.cors.origenes.includes('*')) {
    problemas.push('CORS_ORIGINS no debe incluir * en produccion.');
  }

  if (!['sqlserver', 'mysql'].includes(config.catalogo.motor)) {
    problemas.push("CATALOGO_MOTOR debe ser 'sqlserver' o 'mysql'.");
  }

  if (!['sqlserver', 'postgresql'].includes(config.saldo.motor)) {
    problemas.push("SALDO_MOTOR debe ser 'sqlserver' o 'postgresql'.");
  }

  if (!['sqlserver', 'mongodb'].includes(config.apuestas.motor)) {
    problemas.push("APUESTAS_MOTOR debe ser 'sqlserver' o 'mongodb'.");
  }

  if (!['sqlserver', 'mongodb'].includes(config.documentos.motor)) {
    problemas.push("DOCUMENTOS_MOTOR debe ser 'sqlserver' o 'mongodb'.");
  }

  if (config.bd.modoAutenticacion === 'windows') {
    problemas.push(
      'DB_AUTH_MODE=windows requiere el driver opcional msnodesqlv8 (no incluido en el stack obligatorio).',
    );
  } else {
    if (!config.bd.usuario) problemas.push('DB_USER no esta definido.');
    if (!config.bd.contrasena) problemas.push('DB_PASSWORD no esta definido.');
  }

  return problemas;
}

module.exports = { ...config, validarConfiguracion };
