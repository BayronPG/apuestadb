'use strict';

/**
 * Middleware para rutas no encontradas.
 * Mantiene el formato uniforme de la API: { ok: false, error: { codigo, mensaje } }
 */

function noEncontrado(req, res) {
  return res.status(404).json({
    ok: false,
    error: {
      codigo: 'RUTA_NO_ENCONTRADA',
      mensaje: `No existe el recurso ${req.method} ${req.originalUrl}.`,
    },
  });
}

module.exports = { noEncontrado };
