'use strict';

/**
 * Middleware de validacion de express-validator.
 * Se coloca despues de las cadenas de validacion y antes del controlador.
 */

const { validationResult } = require('express-validator');
const { errores } = require('../utils/errors');

function validar(req, res, next) {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return next();

  const detalles = resultado.array().map((item) => ({
    campo: item.path,
    mensaje: item.msg,
  }));

  const primerMensaje = detalles.length > 0 ? detalles[0].mensaje : 'Datos de entrada invalidos.';
  return next(errores.solicitudInvalida(primerMensaje, 'VALIDACION', detalles));
}

module.exports = { validar };
