'use strict';

/**
 * Middleware de autenticacion.
 * Valida el encabezado "Authorization: Bearer <token>" y deja la sesion en
 * `req.usuario` = { id, rol }.
 */

const { verificarToken, extraerToken } = require('../utils/jwt');
const { errores } = require('../utils/errors');

function autenticar(req, res, next) {
  const token = extraerToken(req.headers.authorization);

  if (!token) {
    return next(
      errores.noAutenticado(
        'Se requiere el encabezado Authorization: Bearer <token>.',
        'TOKEN_REQUERIDO',
      ),
    );
  }

  try {
    const sesion = verificarToken(token);
    req.usuario = { id: sesion.idUsuario, rol: sesion.rol };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { autenticar };
