'use strict';

/**
 * Controlador de AUTENTICACION (rutas publicas).
 * Solo traduce HTTP <-> servicio: no contiene SQL ni reglas de negocio.
 */

const { manejarAsync } = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

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

module.exports = { registrar, iniciarSesion, solicitarRecuperacion, restablecerContrasena };
