'use strict';

const crypto = require('crypto');
const { google } = require('googleapis');
const config = require('../config');
const equipoRepository = require('../repositories/equipo.repository');
const { actualizarVariable } = require('../utils/envFile');
const { errores } = require('../utils/errors');

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const STATE_TTL_MS = 10 * 60 * 1000;
const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSIONES = /\.(jpe?g|png|webp)$/i;
const DECORATIVOS = new Set(['logo', 'escudo', 'footylogos']);

function habilitado() {
  return Boolean(
    config.google.clientId &&
      config.google.clientSecret &&
      config.google.callbackUrl &&
        config.google.driveCallbackUrl &&
        config.google.driveFolderId,
  );
}

function crearCliente() {
  const cliente = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.driveCallbackUrl,
  );
  if (config.google.driveRefreshToken) cliente.setCredentials({ refresh_token: config.google.driveRefreshToken });
  return cliente;
}

function crearState(now = Date.now()) {
  const payload = `${now}.${crypto.randomBytes(32).toString('base64url')}`;
  const firma = crypto
    .createHmac('sha256', config.google.stateSecret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${firma}`;
}

function validarState(state, esperado, now = Date.now()) {
  if (!state || !esperado || state !== esperado) return false;
  const partes = state.split('.');
  if (partes.length !== 3 || !/^\d+$/.test(partes[0])) return false;
  if (now - Number(partes[0]) > STATE_TTL_MS || Number(partes[0]) > now + 30_000) return false;
  const firma = crypto
    .createHmac('sha256', config.google.stateSecret)
    .update(partes.slice(0, 2).join('.'))
    .digest('base64url');
  const recibida = Buffer.from(partes[2]);
  const esperada = Buffer.from(firma);
  return recibida.length === esperada.length && crypto.timingSafeEqual(esperada, recibida);
}

function normalizarNombre(valor) {
  return String(valor || '')
    .replace(EXTENSIONES, '')
    .replace(/[-_]+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter((parte) => parte && !DECORATIVOS.has(parte))
    .join(' ')
    .trim();
}

function urlAutorizacion(state) {
  const cliente = crearCliente();
  return cliente.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [DRIVE_SCOPE],
    state,
  });
}

async function completarAutorizacion(code, { oauthClient = crearCliente(), rutaEnv } = {}) {
  if (!code) throw errores.solicitudInvalida('El codigo de Drive es obligatorio.', 'DRIVE_CODE_INVALIDO');
  try {
    const respuesta = await oauthClient.getToken(code);
    const refreshToken = respuesta && respuesta.tokens && respuesta.tokens.refresh_token;
    if (refreshToken) {
      // Persistencia local: sin URL, sin logs y sin pasar por Git.
      actualizarVariable(
        rutaEnv || require('path').resolve(__dirname, '..', '.env'),
        'GOOGLE_DRIVE_REFRESH_TOKEN',
        refreshToken,
      );
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN = refreshToken;
      config.google.driveRefreshToken = refreshToken;
    }
    return true;
  } catch (error) {
    if (error && error.codigo) throw error;
    throw errores.noDisponible('Google Drive no esta disponible.', 'DRIVE_PROVEEDOR_NO_DISPONIBLE');
  }
}

function validarArchivo(file) {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw errores.solicitudInvalida('Debe adjuntar un logo.', 'LOGO_REQUERIDO');
  }
  if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
    throw errores.solicitudInvalida('El logo debe ser JPG, PNG o WebP.', 'LOGO_FORMATO_INVALIDO');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw errores.solicitudInvalida('El logo no puede superar 5 MB.', 'LOGO_TAMANO_EXCEDIDO');
  }
}

async function subirLogo(idEquipo, file, { driveApi, repository = equipoRepository } = {}) {
  validarArchivo(file);
  if (!habilitado() || !config.google.driveRefreshToken) {
    throw errores.noDisponible('Google Drive no esta configurado.', 'DRIVE_NO_CONFIGURADO');
  }
  const drive = driveApi || google.drive({ version: 'v3', auth: crearCliente() });
  const nombre = `${crypto.randomUUID()}${file.mimetype === 'image/jpeg' ? '.jpg' : file.mimetype === 'image/png' ? '.png' : '.webp'}`;
  let respuesta;
  try {
    respuesta = await drive.files.create({
      requestBody: {
        name: nombre,
        parents: [config.google.driveFolderId],
        mimeType: file.mimetype,
      },
      media: { mimeType: file.mimetype, body: require('stream').Readable.from(file.buffer) },
      fields: 'id',
    });
  } catch (_error) {
    throw errores.noDisponible('Google Drive no esta disponible.', 'DRIVE_PROVEEDOR_NO_DISPONIBLE');
  }
  const fileId = respuesta.data.id;
  const url = `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;
  const equipo = await repository.actualizarLogo(idEquipo, { fileId, url });
  if (!equipo) throw errores.noEncontrado('El equipo no existe.', 'EQUIPO_NO_ENCONTRADO');
  return { idEquipo: equipo.id_equipo, nombre: equipo.nombre, url: equipo.logo_url };
}

function logoUrl(equipo) {
  return (equipo && equipo.logo_url) || config.google.defaultTeamLogoUrl;
}

async function asociarLogos({ driveApi, repository = equipoRepository } = {}) {
  if (!habilitado() || !config.google.driveRefreshToken) {
    throw errores.noDisponible('Google Drive no esta configurado.', 'DRIVE_NO_CONFIGURADO');
  }
  const drive = driveApi || google.drive({ version: 'v3', auth: crearCliente() });
  let respuesta;
  try {
    respuesta = await drive.files.list({
      q: `'${config.google.driveFolderId}' in parents and trashed = false`,
      fields: 'files(id,name,mimeType,webViewLink,webContentLink)',
      pageSize: 1000,
    });
  } catch (_error) {
    throw errores.noDisponible('Google Drive no esta disponible.', 'DRIVE_PROVEEDOR_NO_DISPONIBLE');
  }
  const equipos = await repository.listarParaAsociar();
  const porNombre = new Map();
  for (const equipo of equipos) {
    const clave = normalizarNombre(equipo.nombre);
    if (!clave) continue;
    const lista = porNombre.get(clave) || [];
    lista.push(equipo);
    porNombre.set(clave, lista);
  }
  const reporte = { asociados: 0, omitidos: [] };
  for (const archivoDrive of respuesta.data.files || []) {
    if (!TIPOS_PERMITIDOS.has(archivoDrive.mimeType)) continue;
    const clave = normalizarNombre(archivoDrive.name);
    const candidatos = porNombre.get(clave) || [];
    if (candidatos.length !== 1) {
      reporte.omitidos.push({
        archivo: archivoDrive.name,
        razon: candidatos.length === 0 ? 'SIN_COINCIDENCIA' : 'COINCIDENCIA_AMBIGUA',
      });
      continue;
    }
    const url = archivoDrive.webViewLink || archivoDrive.webContentLink;
    if (!url) {
      reporte.omitidos.push({ archivo: archivoDrive.name, razon: 'SIN_URL_PUBLICA' });
      continue;
    }
    await repository.actualizarLogo(candidatos[0].id_equipo, {
      fileId: archivoDrive.id,
      url,
    });
    reporte.asociados += 1;
  }
  return reporte;
}

module.exports = {
  habilitado,
  crearState,
  validarState,
  urlAutorizacion,
  completarAutorizacion,
  validarArchivo,
  normalizarNombre,
  subirLogo,
  asociarLogos,
  logoUrl,
};
