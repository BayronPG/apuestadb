'use strict';

const { manejarAsync } = require('../utils/asyncHandler');
const { errores } = require('../utils/errors');
const config = require('../config');
const driveService = require('../services/drive.service');

function cookieState(req) {
  const valor = String(req.headers.cookie || '')
    .split(';')
    .map((item) => item.trim().split('='))
    .find(([nombre]) => nombre === 'drive_oauth_state');
  try {
    return decodeURIComponent(valor ? valor[1] : '');
  } catch (_error) {
    return '';
  }
}

const autorizar = manejarAsync(async (_req, res) => {
  if (!driveService.habilitado()) {
    throw errores.noDisponible('Google Drive no esta configurado.', 'DRIVE_NO_CONFIGURADO');
  }
  const state = driveService.crearState();
  res.setHeader(
    'Set-Cookie',
    `drive_oauth_state=${encodeURIComponent(state)}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/api/integraciones/drive`,
  );
  return res.status(200).json({ ok: true, data: { authorizationUrl: driveService.urlAutorizacion(state) } });
});

const callback = manejarAsync(async (req, res) => {
  if (!driveService.validarState(req.query.state, cookieState(req))) {
    throw errores.solicitudInvalida('La validacion de seguridad de Drive fallo.', 'DRIVE_STATE_INVALIDO');
  }
  res.setHeader(
    'Set-Cookie',
    'drive_oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/api/integraciones/drive',
  );
  await driveService.completarAutorizacion(req.query.code);
  return res.redirect(302, `${config.google.frontendOrigin}/admin?drive=ok`);
});

module.exports = { autorizar, callback };
