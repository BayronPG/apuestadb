'use strict';

/**
 * Manejador central de errores.
 * Todo error termina aqui y se serializa como:
 *   { ok: false, error: { codigo, mensaje [, detalles] } }
 * Los detalles tecnicos se registran en consola, nunca se envian al cliente.
 */

const config = require('../config');
const { ErrorApi, errores } = require('../utils/errors');
const { mapearErrorSql } = require('../utils/sqlErrorMapper');

// eslint-disable-next-line no-unused-vars
function manejadorErrores(error, req, res, next) {
  let errorFinal = error instanceof ErrorApi ? error : null;

  if (!errorFinal) {
    errorFinal = mapearErrorSql(error);
  }

  if (!errorFinal) {
    if (error && error.name === 'SyntaxError' && 'body' in error) {
      errorFinal = errores.solicitudInvalida('El cuerpo de la peticion no es un JSON valido.', 'JSON_INVALIDO');
    } else {
      errorFinal = errores.interno('Error interno del servidor.', 'ERROR_INTERNO');
    }
  }

  if (errorFinal.estadoHttp >= 500) {
    console.error('[error]', req.method, req.originalUrl, '-', error && (error.stack || error.message));
  } else if (config.entorno !== 'test') {
    console.warn('[aviso]', req.method, req.originalUrl, '-', errorFinal.codigo, errorFinal.mensaje);
  }

  const cuerpo = {
    ok: false,
    error: {
      codigo: errorFinal.codigo,
      mensaje: errorFinal.mensaje,
    },
  };
  if (errorFinal.detalles) cuerpo.error.detalles = errorFinal.detalles;

  return res.status(errorFinal.estadoHttp).json(cuerpo);
}

module.exports = { manejadorErrores };
