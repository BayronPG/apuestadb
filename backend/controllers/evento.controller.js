'use strict';

/**
 * Controlador de EVENTOS.
 * La cartelera es publica para usuarios autenticados; el registro de
 * resultados es exclusivo del administrador.
 */

const { manejarAsync } = require('../utils/asyncHandler');
const eventoService = require('../services/evento.service');

/** GET /api/eventos/activos */
const activos = manejarAsync(async (_req, res) => {
  const datos = await eventoService.listarActivos();
  return res.status(200).json({ ok: true, data: datos });
});

/** GET /api/eventos/finalizados */
const finalizados = manejarAsync(async (_req, res) => {
  const datos = await eventoService.listarFinalizados();
  return res.status(200).json({ ok: true, data: datos });
});

/**
 * GET /api/eventos/:id/opciones
 * Catalogo de mercados, opciones y cuotas del evento (pantalla Crear apuesta).
 * `monto` es opcional: si llega un valor positivo, cada opcion incluye
 * `premioPotencial`.
 */
const opciones = manejarAsync(async (req, res) => {
  const idEvento = Number.parseInt(req.params.id, 10);
  const { monto = null } = req.query;

  const montoNumerico = monto === null || monto === '' ? null : Number(monto);
  const montoValido = Number.isFinite(montoNumerico) && montoNumerico > 0 ? montoNumerico : null;

  const datos = await eventoService.obtenerOpciones(idEvento, { monto: montoValido });
  return res.status(200).json({ ok: true, data: datos });
});

/** POST /api/eventos/:id/resultado */
const registrarResultado = manejarAsync(async (req, res) => {
  const idEvento = Number.parseInt(req.params.id, 10);
  const { marcadorLocal, marcadorVisitante, estado } = req.body;

  const datos = await eventoService.registrarResultado({
    idEvento,
    marcadorLocal,
    marcadorVisitante,
    estado: estado || 'oficial',
    idAdministrador: req.usuario.id,
  });

  return res.status(201).json({ ok: true, data: datos });
});

module.exports = { activos, finalizados, opciones, registrarResultado };
