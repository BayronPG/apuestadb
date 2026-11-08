'use strict';

/**
 * Controlador de JUGADOR (catalogo MySQL, Fase 15).
 */

const { manejarAsync } = require('../utils/asyncHandler');
const jugadorService = require('../services/jugador.service');

/** GET /api/jugadores */
const listar = manejarAsync(async (req, res) => {
  const idEquipo = req.query.idEquipo ? Number.parseInt(req.query.idEquipo, 10) : null;
  const datos = await jugadorService.listar({ idEquipo });
  return res.status(200).json({ ok: true, data: datos });
});

/** GET /api/equipos/:id/jugadores */
const listarPorEquipo = manejarAsync(async (req, res) => {
  const idEquipo = Number.parseInt(req.params.id, 10);
  const datos = await jugadorService.listarPorEquipo(idEquipo);
  return res.status(200).json({ ok: true, data: datos });
});

/** POST /api/jugadores */
const crear = manejarAsync(async (req, res) => {
  const jugador = await jugadorService.crear(req.body);
  return res.status(201).json({ ok: true, data: { jugador } });
});

module.exports = { listar, listarPorEquipo, crear };
