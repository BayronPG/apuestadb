'use strict';

/**
 * Controlador de AUTENTICACION (rutas publicas).
 * Solo traduce HTTP <-> servicio: no contiene SQL ni reglas de negocio.
 */

const { manejarAsync } = require('../utils/asyncHandler');
const authService = require('../services/auth.service');
const googleService = require('../services/google-auth.service');
const config = require('../config');
const { errores } = require('../utils/errors');

/** Direccion de origen (auditoria). Se recorta a 45 caracteres (VARCHAR(45)). */
function direccionOrigen(req) {
  const valor = req.ip || (req.socket && req.socket.remoteAddress) || null;
  return valor ? String(valor).slice(0, 45) : null;
}

/** POST /api/auth/registro */
const registrar = manejarAsync(async (req, res) => {
  const { nombres, apellidos, correo, contrasena, telefono } = req.body;

  const datos = await authService.registrar({
    nombres,
    apellidos,
    correo,
    contrasena,
    telefono: telefono || null,
  });

  return res.status(201).json({ ok: true, data: datos });
});

/** POST /api/auth/login */
const iniciarSesion = manejarAsync(async (req, res) => {
  const { correo, contrasena } = req.body;

  const datos = await authService.iniciarSesion(
    { correo, contrasena },
    { direccionOrigen: direccionOrigen(req) },
  );

  return res.status(200).json({ ok: true, data: datos });
});

/** POST /api/auth/recuperar */
const solicitarRecuperacion = manejarAsync(async (req, res) => {
  const { correo } = req.body;
  const datos = await authService.solicitarRecuperacion({ correo });
  return res.status(200).json({ ok: true, data: datos });
});

/** POST /api/auth/restablecer */
const restablecerContrasena = manejarAsync(async (req, res) => {
  const { correo, valorToken, nuevaContrasena } = req.body;

  const datos = await authService.restablecerContrasena({
    correo,
    valorToken,
    nuevaContrasena,
  });

  return res.status(200).json({ ok: true, data: datos });
});

const iniciarGoogle = manejarAsync(async (_req, res) => {
  if (!googleService.habilitado()) return res.status(404).json({ ok: false, error: { codigo: 'GOOGLE_DESHABILITADO', mensaje: 'Inicio con Google no configurado.' } });
  const state = googleService.crearState();
  res.setHeader('Set-Cookie', `google_oauth_state=${encodeURIComponent(state)}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/api/auth/google`);
  return res.redirect(302, googleService.urlAutorizacion(state));
});

const callbackGoogle = manejarAsync(async (req, res) => {
  if (!googleService.habilitado()) return res.status(404).json({ ok: false, error: { codigo: 'GOOGLE_DESHABILITADO', mensaje: 'Inicio con Google no configurado.' } });
  const cookies = String(req.headers.cookie || '').split(';').map((item) => item.trim().split('='));
  let esperado = '';
  try {
    esperado = decodeURIComponent((cookies.find(([nombre]) => nombre === 'google_oauth_state') || [])[1] || '');
  } catch (_error) {
    esperado = '';
  }
  if (!googleService.validarState(req.query.state, esperado)) {
    throw errores.solicitudInvalida('La validacion de seguridad de Google fallo.', 'GOOGLE_STATE_INVALIDO');
  }
  res.setHeader('Set-Cookie', 'google_oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/api/auth/google');
  const datos = await googleService.autenticarGoogle(req.query.code);
  const destino = `${config.google.frontendOrigin}/login#google_token=${encodeURIComponent(datos.token)}`;
  return res.redirect(302, destino);
});

module.exports = { registrar, iniciarSesion, solicitarRecuperacion, restablecerContrasena, iniciarGoogle, callbackGoogle };
