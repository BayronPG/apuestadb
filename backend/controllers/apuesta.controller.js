'use strict';

/**
 * Controlador de APUESTAS (rutas del usuario autenticado).
 */

const { manejarAsync } = require('../utils/asyncHandler');
const apuestaService = require('../services/apuesta.service');

/** POST /api/apuestas */
const registrar = manejarAsync(async (req, res) => {
  const { idOpcion, idTipoSaldo, monto } = req.body;

  const datos = await apuestaService.registrarApuesta({
    idUsuario: req.usuario.id,
    idOpcion,
    idTipoSaldo,
    monto,
  });

  return res.status(201).json({ ok: true, data: datos });
});

/** GET /api/apuestas?estado= */
const listar = manejarAsync(async (req, res) => {
  const { estado = null } = req.query;

  const datos = await apuestaService.listarApuestas({
    idUsuario: req.usuario.id,
    estado: estado || null,
  });

  return res.status(200).json({ ok: true, data: datos });
});

/** GET /api/apuestas/pendientes */
const pendientes = manejarAsync(async (req, res) => {
  const datos = await apuestaService.listarPendientes(req.usuario.id);
  return res.status(200).json({ ok: true, data: datos });
});

/** GET /api/apuestas/ganadas */
const ganadas = manejarAsync(async (req, res) => {
  const datos = await apuestaService.listarGanadas(req.usuario.id);
  return res.status(200).json({ ok: true, data: datos });
});

/** GET /api/apuestas/perdidas */
const perdidas = manejarAsync(async (req, res) => {
  const datos = await apuestaService.listarPerdidas(req.usuario.id);
  return res.status(200).json({ ok: true, data: datos });
});

module.exports = { registrar, listar, pendientes, ganadas, perdidas };
