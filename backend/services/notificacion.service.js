'use strict';

/**
 * Servicio de NOTIFICACIONES (lectura del usuario autenticado).
 */

const notificacionRepository = require('../repositories/notificacion.repository');

/**
 * Lista las notificaciones del usuario.
 * @param {{idUsuario:number, estado?:string|null, limite?:number}} filtros
 */
async function listar({ idUsuario, estado = null, limite = 100 }) {
  const notificaciones = await notificacionRepository.listar({ idUsuario, estado, limite });
  return { notificaciones, total: notificaciones.length };
}

module.exports = { listar };
