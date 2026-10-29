'use strict';

/**
 * Repositorio del agregado REPORTE (solo lectura, sobre vistas).
 * No modifica datos: consulta vw_ReporteAdministrativo, vw_ReporteFinanciero
 * y vw_RankingUsuarios.
 */

const { consultar } = require('../config/database');

/** Resumen por evento: apuestas, monto apostado, premios y margen. */
async function administrativo() {
  const resultado = await consultar(
    `SELECT * FROM dbo.vw_ReporteAdministrativo ORDER BY fecha_hora_inicio DESC`,
  );
  return resultado.registros;
}

/** Resumen por tipo de saldo: recargado, apostado, premios y saldo en cuentas. */
async function financiero() {
  const resultado = await consultar(
    `SELECT * FROM dbo.vw_ReporteFinanciero ORDER BY tipo_saldo ASC`,
  );
  return resultado.registros;
}

/** Ranking de usuarios por ganancia neta (incluye columna `posicion`). */
async function ranking() {
  const resultado = await consultar(
    `SELECT * FROM dbo.vw_RankingUsuarios ORDER BY posicion ASC`,
  );
  return resultado.registros;
}

module.exports = { administrativo, financiero, ranking };
