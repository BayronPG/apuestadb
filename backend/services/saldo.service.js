'use strict';

/**
 * Servicio de SALDO y RECARGAS.
 * Agrega el saldo por tipo y delega la aplicacion de movimientos al
 * procedimiento almacenado correspondiente (la atomicidad vive en la BD).
 */

const saldoRepository = require('../repositories/saldo.repository');

/**
 * Saldo del usuario por tipo de saldo + total consolidado.
 *
 * Fase 10.1: usp_Saldo_Consultar devuelve el nombre del tipo pero no su id, y
 * el frontend necesita `idTipoSaldo` (obligatorio en POST /api/apuestas). Se
 * conserva la llamada al procedimiento y se completa cada fila con una consulta
 * parametrizada sobre SaldoCuenta/TipoSaldo por `id_saldo_cuenta`. Ambas
 * consultas se lanzan en paralelo; si el usuario no existe, el procedimiento
 * responde 50030 y el mapeo lo convierte en 404.
 *
 * Se conservan los campos snake_case originales y se AÑADEN los camelCase
 * (idSaldoCuenta, idTipoSaldo, nombreTipoSaldo, saldoActual,
 * fechaUltimaActualizacion) para no romper a los consumidores actuales.
 */
async function consultarSaldo(idUsuario) {
  const [filas, tipos] = await Promise.all([
    saldoRepository.consultarSaldo(idUsuario),
    saldoRepository.tiposSaldoPorCuenta(idUsuario),
  ]);

  const tipoPorCuenta = new Map(tipos.map((tipo) => [tipo.id_saldo_cuenta, tipo]));

  const cuentas = filas.map((fila) => {
    const tipo = tipoPorCuenta.get(fila.id_saldo_cuenta) || {};
    return {
      ...fila,
      idSaldoCuenta: fila.id_saldo_cuenta,
      idTipoSaldo: tipo.id_tipo_saldo === undefined ? null : tipo.id_tipo_saldo,
      nombreTipoSaldo: tipo.nombre_tipo_saldo || fila.tipo_saldo || null,
      saldoActual: fila.saldo_actual,
      fechaUltimaActualizacion: fila.fecha_ultima_actualizacion,
    };
  });

  const saldoTotal = cuentas.reduce((acumulado, cuenta) => {
    const valor = Number(cuenta.saldo_actual);
    return acumulado + (Number.isFinite(valor) ? valor : 0);
  }, 0);

  return { cuentas, saldoTotal: Number(saldoTotal.toFixed(2)) };
}

/** Historial de movimientos del usuario con filtros opcionales. */
async function historialMovimientos({ idUsuario, idTipoSaldo = null, desde = null, hasta = null }) {
  const movimientos = await saldoRepository.historialMovimientos({
    idUsuario,
    idTipoSaldo,
    desde,
    hasta,
  });
  return { movimientos, total: movimientos.length };
}

/**
 * Crea una recarga ficticia de saldo (operacion de administrador).
 * No hay dinero real ni pasarela de pago: el abono es simulado (RN-02).
 */
async function crearRecarga({ idUsuario, idTipoSaldo, monto, idAdministrador = null, observacion = null }) {
  const resultado = await saldoRepository.crearRecarga({
    idUsuario,
    idTipoSaldo,
    monto,
    idAdministrador,
    observacion,
  });

  return {
    idRecarga: resultado.idRecarga,
    mensaje: resultado.mensaje || 'Recarga aplicada correctamente.',
  };
}

module.exports = { consultarSaldo, historialMovimientos, crearRecarga };
