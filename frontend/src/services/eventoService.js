import api, { desenvolver } from './api.js';

/**
 * Servicio de EVENTOS.
 *   GET  /api/eventos/activos        (usuario autenticado)
 *   GET  /api/eventos/finalizados    (usuario autenticado)
 *   GET  /api/eventos/:id/opciones   (usuario autenticado)  <- Fase 10.1
 *   POST /api/eventos/:id/resultado  (administrador)
 *
 * Formatos de fila (ver docs/backend/INTEGRACION_FRONTEND.md):
 *   activos[]     : snake_case -> { id_evento, deporte, liga, temporada, equipo_local,
 *                     equipo_visitante, estadio, fecha_hora_inicio, estado, mercados_abiertos }
 *   finalizados[] : snake_case -> { id_evento, deporte, liga, equipo_local, equipo_visitante,
 *                     fecha_hora_inicio, marcador_local, marcador_visitante,
 *                     opcion_ganadora, estado_resultado, fecha_registro }
 *   opciones      : camelCase  -> { evento: {...}, mercados: [{ idMercado, nombre,
 *                     descripcion, fechaApertura, fechaCierre, estado, opciones: [
 *                     { idOpcion, etiqueta, cuotaVigente, estado, premioPotencial? } ] }] }
 */

/** GET /api/eventos/activos -> { eventos, total } */
export async function listarEventosActivos() {
  const respuesta = await api.get('/eventos/activos');
  return desenvolver(respuesta);
}

/** GET /api/eventos/finalizados -> { eventos, total } */
export async function listarEventosFinalizados() {
  const respuesta = await api.get('/eventos/finalizados');
  return desenvolver(respuesta);
}

/**
 * GET /api/eventos/:id/opciones?monto= -> { evento, mercados[] }
 *
 * Catalogo real de mercados, opciones y cuotas vigentes del evento. Es la fuente
 * de `idOpcion` y `cuotaVigente` para POST /api/apuestas.
 *
 * `monto` es opcional: si se envia un numero mayor que cero, cada opcion incluye
 * `premioPotencial` (= monto x cuotaVigente, misma formula que
 * dbo.fn_PremioPotencial). Si no se envia, el campo se omite. La API valida
 * `monto > 0`, por eso solo se agrega el parametro cuando es valido.
 *
 * @param {number|string} idEvento
 * @param {{monto?: number|string|null}} opciones
 */
export async function obtenerOpcionesEvento(idEvento, { monto = null } = {}) {
  const parametros = {};
  const numeroMonto = Number(monto);
  if (monto !== null && monto !== '' && Number.isFinite(numeroMonto) && numeroMonto > 0) {
    parametros.monto = numeroMonto;
  }

  const respuesta = await api.get(`/eventos/${idEvento}/opciones`, { params: parametros });
  return desenvolver(respuesta);
}

/**
 * POST /api/eventos/:id/resultado -> { idResultado, mensaje } (201)
 * @param {{idEvento:number, marcadorLocal:number, marcadorVisitante:number, estado?:string}} datos
 */
export async function registrarResultado({ idEvento, marcadorLocal, marcadorVisitante, estado }) {
  const cuerpo = { marcadorLocal, marcadorVisitante };
  if (estado) cuerpo.estado = estado;
  const respuesta = await api.post(`/eventos/${idEvento}/resultado`, cuerpo);
  return desenvolver(respuesta);
}
