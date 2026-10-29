'use strict';

/**
 * Envuelve un controlador asincrono para que cualquier rechazo llegue al
 * manejador central de errores (evita try/catch repetidos en cada controlador).
 *
 * @param {Function} controlador Funcion (req, res, next).
 * @returns {Function} Manejador de Express.
 */
function manejarAsync(controlador) {
  return (req, res, next) => {
    Promise.resolve(controlador(req, res, next)).catch(next);
  };
}

module.exports = { manejarAsync };
