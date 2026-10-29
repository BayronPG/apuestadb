import api, { desenvolver } from './api.js';

/**
 * Servicio de REPORTES (solo administrador).
 *   GET /api/reportes/administrativo
 *   GET /api/reportes/financiero
 *   GET /api/reportes/ranking
 *
 * Respuesta uniforme -> { filas, total }
 * Columnas reales por vista:
 *   vw_ReporteAdministrativo : id_evento, deporte, liga, equipo_local,
 *       equipo_visitante, fecha_hora_inicio, estado, marcador_local,
 *       marcador_visitante, apuestas, monto_apostado, premios_pagados, margen
 *   vw_ReporteFinanciero     : id_tipo_saldo, tipo_saldo, total_recargado,
 *       total_apostado, total_premios, saldo_en_cuentas
 *   vw_RankingUsuarios       : posicion, id_usuario, correo, total_apuestas,
 *       apuestas_ganadas, apuestas_perdidas, total_apostado, total_premios,
 *       ganancia_neta
 */

/** GET /api/reportes/administrativo -> { filas, total } */
export async function reporteAdministrativo() {
  const respuesta = await api.get('/reportes/administrativo');
  return desenvolver(respuesta);
}

/** GET /api/reportes/financiero -> { filas, total } */
export async function reporteFinanciero() {
  const respuesta = await api.get('/reportes/financiero');
  return desenvolver(respuesta);
}

/** GET /api/reportes/ranking -> { filas, total } */
export async function reporteRanking() {
  const respuesta = await api.get('/reportes/ranking');
  return desenvolver(respuesta);
}
