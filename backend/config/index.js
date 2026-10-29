'use strict';

/**
 * Configuracion central del backend ApuestaDB.
 * Lee las variables de entorno (.env) y expone valores ya tipados.
 *
 * Este archivo es la unica puerta de entrada a process.env: el resto de las
 * capas importa `config` y nunca lee variables de entorno directamente.
 */

require('dotenv').config();

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
    origenes: aLista(process.env.CORS_ORIGIN, ['http://localhost:5173']),
  },

  jwt: {
    secreto: process.env.JWT_SECRET || '',
    expiracion: process.env.JWT_EXPIRES_IN || '2h',
    emisor: process.env.JWT_ISSUER || 'apuestadb-api',
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
