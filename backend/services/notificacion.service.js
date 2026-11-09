'use strict';

/**
 * Servicio de NOTIFICACIONES (lectura del usuario autenticado).
 */

const notificacionRepository = require('../repositories/notificacion.repository');
const { errores } = require('../utils/errors');

/**
 * Lista las notificaciones del usuario.
 * @param {{idUsuario:number, estado?:string|null, limite?:number}} filtros
 */
async function listar({ idUsuario, estado = null, limite = 100 }) {
  const notificaciones = await notificacionRepository.listar({ idUsuario, estado, limite });
  return { notificaciones, total: notificaciones.length };
}

/**
 * Cambia el estado de una notificacion del usuario autenticado.
 * Una notificacion ajena o inexistente responde igual: 404.
 * @param {{idNotificacion:number, idUsuario:number, estado:string}} datos
 */
async function actualizarEstado({ idNotificacion, idUsuario, estado }) {
  const actualizada = await notificacionRepository.actualizarEstado({
    idNotificacion,
    idUsuario,
    estado,
  });

  if (!actualizada) {
    throw errores.noEncontrado(
      'La notificacion no existe o no pertenece al usuario autenticado.',
      'NOTIFICACION_NO_ENCONTRADA',
    );
  }

  return { idNotificacion, estado, mensaje: 'Notificacion actualizada.' };
}

module.exports = { listar, actualizarEstado };
