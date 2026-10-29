'use strict';

/**
 * Controlador de LIQUIDACIONES (rutas de administrador).
 */

const { manejarAsync } = require('../utils/asyncHandler');
const apuestaService = require('../services/apuesta.service');

/** POST /api/liquidaciones */
const liquidar = manejarAsync(async (req, res) => {
  const { idApuesta = null, idEvento = null } = req.body;

  const datos = await apuestaService.liquidar({
    idApuesta: idApuesta === undefined ? null : idApuesta,
    idEvento: idEvento === undefined ? null : idEvento,
    idAdministrador: req.usuario.id,
  });

  return res.status(200).json({ ok: true, data: datos });
});

module.exports = { liquidar };
