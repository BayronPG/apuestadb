import api, { desenvolver } from './api.js';

/**
 * Servicio de SALDO y MOVIMIENTOS (usuario autenticado).
 *   GET /api/saldo
 *   GET /api/saldo/movimientos
 *
 * GET /api/saldo (Fase 10.1) devuelve cada cuenta con AMBAS formas de nombre:
 *   snake_case (compatibilidad): id_saldo_cuenta, tipo_saldo, saldo_actual,
 *                                fecha_ultima_actualizacion
 *   camelCase  (contrato nuevo): idSaldoCuenta, idTipoSaldo, nombreTipoSaldo,
 *                                saldoActual, fechaUltimaActualizacion
 * El frontend usa la forma camelCase (incluye el id del tipo de saldo, que es
 * obligatorio en POST /api/apuestas y POST /api/recargas). `normalizarCuenta`
 * resuelve el caso de una respuesta antigua (solo snake_case) sin fabricar datos.
 *
 * GET /api/saldo/movimientos sigue devolviendo filas snake_case:
 *   { id_movimiento, tipo_saldo, concepto, naturaleza, monto, saldo_resultante,
 *     fecha_hora, referencia, id_apuesta, id_recarga }
 */

/** GET /api/saldo -> { cuentas, saldoTotal } */
export async function consultarSaldo() {
  const respuesta = await api.get('/saldo');
  return desenvolver(respuesta);
}

/**
 * Normaliza una cuenta de saldo a la forma camelCase del contrato.
 * `idTipoSaldo` puede ser null si la API no lo entrega: en ese caso la pantalla
 * debe deshabilitar las acciones que lo requieren (no se inventa un valor).
 * @param {object} cuenta
 */
export function normalizarCuenta(cuenta) {
  if (!cuenta) return null;
  return {
    idSaldoCuenta: cuenta.idSaldoCuenta ?? cuenta.id_saldo_cuenta ?? null,
    idTipoSaldo: cuenta.idTipoSaldo ?? null,
    nombreTipoSaldo: cuenta.nombreTipoSaldo ?? cuenta.tipo_saldo ?? null,
    saldoActual: cuenta.saldoActual ?? cuenta.saldo_actual ?? null,
    fechaUltimaActualizacion:
      cuenta.fechaUltimaActualizacion ?? cuenta.fecha_ultima_actualizacion ?? null,
  };
}

/** Devuelve las cuentas de saldo normalizadas. */
export function cuentasNormalizadas(datos) {
  return (datos?.cuentas || []).map(normalizarCuenta).filter(Boolean);
}

/**
 * GET /api/saldo/movimientos -> { movimientos, total }
 * @param {{idTipoSaldo?:number, desde?:string, hasta?:string}} filtros
 * `idTipoSaldo` se obtiene de GET /api/saldo (campo idTipoSaldo).
 */
export async function consultarMovimientos(filtros = {}) {
  const parametros = {};
  if (filtros.idTipoSaldo) parametros.idTipoSaldo = filtros.idTipoSaldo;
  if (filtros.desde) parametros.desde = filtros.desde;
  if (filtros.hasta) parametros.hasta = filtros.hasta;

  const respuesta = await api.get('/saldo/movimientos', { params: parametros });
  return desenvolver(respuesta);
}
