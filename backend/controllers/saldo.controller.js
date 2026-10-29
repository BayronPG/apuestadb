'use strict';

/**
 * Controlador de SALDO y MOVIMIENTOS (rutas del usuario autenticado).
 * El id_usuario siempre proviene del token, nunca del cuerpo o de la URL.
 */

const { manejarAsync } = require('../utils/asyncHandler');
const saldoService = require('../services/saldo.service');

/** GET /api/saldo */
const consultar = manejarAsync(async (req, res) => {
  const datos = await saldoService.consultarSaldo(req.usuario.id);
  return res.status(200).json({ ok: true, data: datos });
});

/** GET /api/saldo/movimientos */
const historialMovimientos = manejarAsync(async (req, res) => {
  const { idTipoSaldo = null, desde = null, hasta = null } = req.query;

  const datos = await saldoService.historialMovimientos({
    idUsuario: req.usuario.id,
    idTipoSaldo: idTipoSaldo === null || idTipoSaldo === '' ? null : Number.parseInt(idTipoSaldo, 10),
    desde: desde || null,
    hasta: hasta || null,
  });

  return res.status(200).json({ ok: true, data: datos });
});

module.exports = { consultar, historialMovimientos };
