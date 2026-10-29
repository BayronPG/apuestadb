'use strict';

/**
 * Servicio de REPORTES (solo lectura, rutas de administrador).
 * Se apoyan en las vistas vw_ReporteAdministrativo, vw_ReporteFinanciero y
 * vw_RankingUsuarios.
 */

const reporteRepository = require('../repositories/reporte.repository');

/** Reporte administrativo por evento. */
async function administrativo() {
  const filas = await reporteRepository.administrativo();
  return { filas, total: filas.length };
}

/** Reporte financiero por tipo de saldo. */
async function financiero() {
  const filas = await reporteRepository.financiero();
  return { filas, total: filas.length };
}

/** Ranking de usuarios por ganancia neta. */
async function ranking() {
  const filas = await reporteRepository.ranking();
  return { filas, total: filas.length };
}

module.exports = { administrativo, financiero, ranking };
