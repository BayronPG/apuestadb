'use strict';

/**
 * Controlador de RECARGAS (rutas de administrador).
 * El administrador que ejecuta la recarga se toma del token.
 */

const { manejarAsync } = require('../utils/asyncHandler');
const saldoService = require('../services/saldo.service');

/** POST /api/recargas */
const crear = manejarAsync(async (req, res) => {
  const { idUsuario, idTipoSaldo, monto, observacion } = req.body;

  const datos = await saldoService.crearRecarga({
    idUsuario,
    idTipoSaldo,
    monto,
    idAdministrador: req.usuario.id,
    observacion: observacion || null,
  });

  return res.status(201).json({ ok: true, data: datos });
});

module.exports = { crear };
