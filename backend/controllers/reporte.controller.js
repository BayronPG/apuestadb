'use strict';

/**
 * Controlador de REPORTES (rutas de administrador).
 */

const { manejarAsync } = require('../utils/asyncHandler');
const reporteService = require('../services/reporte.service');

/** GET /api/reportes/administrativo */
const administrativo = manejarAsync(async (_req, res) => {
  const datos = await reporteService.administrativo();
  return res.status(200).json({ ok: true, data: datos });
});

/** GET /api/reportes/financiero */
const financiero = manejarAsync(async (_req, res) => {
  const datos = await reporteService.financiero();
  return res.status(200).json({ ok: true, data: datos });
});

/** GET /api/reportes/ranking */
const ranking = manejarAsync(async (_req, res) => {
  const datos = await reporteService.ranking();
  return res.status(200).json({ ok: true, data: datos });
});

module.exports = { administrativo, financiero, ranking };
