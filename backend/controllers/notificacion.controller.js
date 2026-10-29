'use strict';

/**
 * Controlador de NOTIFICACIONES (rutas del usuario autenticado).
 */

const { manejarAsync } = require('../utils/asyncHandler');
const notificacionService = require('../services/notificacion.service');

/** GET /api/notificaciones */
const listar = manejarAsync(async (req, res) => {
  const { estado = null, limite = 100 } = req.query;

  const datos = await notificacionService.listar({
    idUsuario: req.usuario.id,
    estado: estado || null,
    limite: Number.parseInt(limite, 10) || 100,
  });

  return res.status(200).json({ ok: true, data: datos });
});

module.exports = { listar };
