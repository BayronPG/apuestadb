import api, { desenvolver } from './api.js';

/**
 * Servicio de NOTIFICACIONES (usuario autenticado).
 *   GET /api/notificaciones?estado=&limite=
 *
 * Filas (snake_case): { id_notificacion, id_usuario, mensaje, tipo, fecha_hora, estado }
 *
 * Nota: la API solo expone lectura. No existe endpoint para marcar una
 * notificacion como leida (ver docs/frontend/INTEGRACION_API.md).
 */

/** GET /api/notificaciones -> { notificaciones, total } */
export async function listarNotificaciones({ estado, limite } = {}) {
  const parametros = {};
  if (estado) parametros.estado = estado;
  if (limite) parametros.limite = limite;

  const respuesta = await api.get('/notificaciones', { params: parametros });
  return desenvolver(respuesta);
}
