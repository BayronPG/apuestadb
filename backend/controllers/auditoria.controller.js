'use strict';

/**
 * Controlador de AUDITORIA (rutas de administrador).
 */

const { manejarAsync } = require('../utils/asyncHandler');
const auditoriaService = require('../services/auditoria.service');

/** GET /api/auditoria */
const consultar = manejarAsync(async (req, res) => {
  const { idUsuario = null, operacion = null, desde = null, hasta = null, top = 100 } = req.query;

  const registros = await auditoriaService.consultar({
    idUsuario: idUsuario ? Number.parseInt(idUsuario, 10) : null,
    operacion: operacion || null,
    desde: desde || null,
    hasta: hasta || null,
    top: Number.parseInt(top, 10) || 100,
  });

  return res.status(200).json({ ok: true, data: { registros, total: registros.length } });
});

module.exports = { consultar };
