'use strict';

/**
 * Repositorio del agregado SALDO (incluye recargas y movimientos).
 * Usa los procedimientos usp_Saldo_Consultar, usp_MovimientoSaldo_Historial,
 * usp_MovimientoSaldo_Registrar y usp_Recarga_Crear. Tambien una consulta
 * parametrizada de apoyo sobre SaldoCuenta/TipoSaldo (ver tiposSaldoPorCuenta).
 */

const { sql, p, ejecutar, consultar } = require('../config/database');

/** Saldo del usuario por tipo (dbo.usp_Saldo_Consultar). */
async function consultarSaldo(idUsuario) {
  const resultado = await ejecutar('dbo.usp_Saldo_Consultar', {
    id_usuario: p(sql.Int, idUsuario),
  });
  return resultado.registros;
}

/**
 * Identificador y nombre del tipo de saldo de cada cuenta del usuario.
 * usp_Saldo_Consultar devuelve el NOMBRE del tipo pero no su id; esta consulta
 * parametrizada lo completa sin modificar el procedimiento (Fase 10.1).
 */
async function tiposSaldoPorCuenta(idUsuario) {
  const resultado = await consultar(
    `SELECT sc.id_saldo_cuenta,
            sc.id_tipo_saldo,
            ts.nombre AS nombre_tipo_saldo
       FROM dbo.SaldoCuenta sc
       JOIN dbo.TipoSaldo ts ON ts.id_tipo_saldo = sc.id_tipo_saldo
      WHERE sc.id_usuario = @id_usuario`,
    { id_usuario: p(sql.Int, idUsuario) },
  );
  return resultado.registros;
}

/** Historial de movimientos del usuario (dbo.usp_MovimientoSaldo_Historial). */
async function historialMovimientos({ idUsuario, idTipoSaldo = null, desde = null, hasta = null }) {
  const resultado = await ejecutar('dbo.usp_MovimientoSaldo_Historial', {
    id_usuario: p(sql.Int, idUsuario),
    id_tipo_saldo: p(sql.Int, idTipoSaldo),
    desde: p(sql.DateTime2, desde),
    hasta: p(sql.DateTime2, hasta),
  });
  return resultado.registros;
}

/**
 * Registra un movimiento de saldo (dbo.usp_MovimientoSaldo_Registrar).
 * Primitiva usada por recargas y apuestas; `nombreMovimiento` debe existir en
 * dbo.TipoMovimientoSaldo ('apuesta' | 'premio' | 'recarga' | 'ajuste').
 */
async function registrarMovimiento({
  idSaldoCuenta,
  nombreMovimiento,
  monto,
  idApuesta = null,
  idRecarga = null,
  referencia = null,
}) {
  const resultado = await ejecutar(
    'dbo.usp_MovimientoSaldo_Registrar',
    {
      id_saldo_cuenta: p(sql.Int, idSaldoCuenta),
      nombre_movimiento: p(sql.VarChar(20), nombreMovimiento),
      monto: p(sql.Decimal(18, 2), monto),
      id_apuesta: p(sql.Int, idApuesta),
      id_recarga: p(sql.Int, idRecarga),
      referencia: p(sql.NVarChar(100), referencia),
    },
    { id_movimiento: sql.BigInt },
  );

  const fila = resultado.registros[0] || {};
  return {
    idMovimiento: resultado.salidas.id_movimiento,
    saldoResultante: fila.saldo_resultante,
  };
}

/** Crea y aplica una recarga ficticia (dbo.usp_Recarga_Crear). */
async function crearRecarga({ idUsuario, idTipoSaldo, monto, idAdministrador = null, observacion = null }) {
  const resultado = await ejecutar(
    'dbo.usp_Recarga_Crear',
    {
      id_usuario: p(sql.Int, idUsuario),
      id_tipo_saldo: p(sql.Int, idTipoSaldo),
      monto: p(sql.Decimal(18, 2), monto),
      id_administrador: p(sql.Int, idAdministrador),
      observacion: p(sql.NVarChar(255), observacion),
    },
    { id_recarga: sql.Int },
  );

  const fila = resultado.registros[0] || {};
  return {
    idRecarga: resultado.salidas.id_recarga,
    mensaje: fila.mensaje || null,
  };
}

module.exports = {
  consultarSaldo,
  tiposSaldoPorCuenta,
  historialMovimientos,
  registrarMovimiento,
  crearRecarga,
};
