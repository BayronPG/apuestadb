'use strict';

/**
 * Middleware de autorizacion por rol.
 * Uso: router.post('/', autenticar, roles('administrador'), controlador)
 */

const { errores } = require('../utils/errors');

/**
 * @param {...string} permitidos Roles autorizados ('usuario' | 'administrador').
 */
function roles(...permitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(errores.noAutenticado('Debe iniciar sesion para continuar.', 'NO_AUTENTICADO'));
    }
    if (!permitidos.includes(req.usuario.rol)) {
      return next(
        errores.prohibido(
          `Se requiere el rol: ${permitidos.join(' o ')}.`,
          'ROL_NO_AUTORIZADO',
        ),
      );
    }
    return next();
  };
}

module.exports = { roles };
