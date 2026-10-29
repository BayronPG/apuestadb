'use strict';

/**
 * Servicio de USUARIOS (consultas administrativas).
 */

const usuarioRepository = require('../repositories/usuario.repository');

/**
 * Lista usuarios con rol y saldo consolidado.
 * @param {{estado?:string|null, rol?:string|null, limite?:number}} filtros
 */
async function listar({ estado = null, rol = null, limite = 200 } = {}) {
  return usuarioRepository.listar({ estado, rol, limite });
}

module.exports = { listar };
