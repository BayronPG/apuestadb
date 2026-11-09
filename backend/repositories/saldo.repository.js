'use strict';

/**
 * Repositorio del agregado SALDO (incluye recargas y movimientos).
 * Usa los procedimientos usp_Saldo_Consultar, usp_MovimientoSaldo_Historial,
 * usp_MovimientoSaldo_Registrar y usp_Recarga_Crear. Tambien una consulta
 * parametrizada de apoyo sobre SaldoCuenta/TipoSaldo (ver tiposSaldoPorCuenta).
 */

const { sql, p, ejecutar, consultar } = require('../config/database');
const config = require('../config');
const postgresql = require('../config/db/postgresql');
const { errores } = require('../utils/errors');

/** Con SALDO_MOTOR=postgresql las LECTURAS financieras salen de PostgreSQL. */
function usaPostgresql() {
  return config.saldo.motor === 'postgresql';
}

async function consultarPg(texto, parametros = []) {
  const pool = await postgresql.obtenerPool();
  const resultado = await pool.query(texto, parametros);
  return resultado.rows;
}

async function existeUsuario(idUsuario) {
  const r = await consultar('SELECT 1 AS existe FROM dbo.Usuario WHERE id_usuario = @id_usuario', {
    id_usuario: p(sql.Int, idUsuario),
  });
  return r.registros.length > 0;
}

async function usuarioActivo(idUsuario) {
  const r = await consultar(
    "SELECT 1 AS existe FROM dbo.Usuario WHERE id_usuario = @id_usuario AND estado = 'activo'",
    { id_usuario: p(sql.Int, idUsuario) },
  );
  return r.registros.length > 0;
}

async function esAdministrador(idUsuario) {
  const r = await consultar(
    `SELECT 1 AS es FROM dbo.Usuario u JOIN dbo.Rol r ON r.id_rol = u.id_rol
      WHERE u.id_usuario = @id_usuario AND r.nombre = 'administrador'`,
    { id_usuario: p(sql.Int, idUsuario) },
  );
  return r.registros.length > 0;
}

/** Traduce los errores de las funciones PL/pgSQL al contrato HTTP actual. */
function mapearErrorPg(error) {
  const codigo = String(error && error.message ? error.message : '').trim();
  switch (codigo) {
    case 'MONTO_INVALIDO':
      return errores.solicitudInvalida('El monto debe ser mayor que cero.', 'MONTO_INVALIDO');
    case 'ORIGEN_EXCLUYENTE':
      return errores.solicitudInvalida(
        'El movimiento no puede originarse en apuesta y recarga a la vez.',
        'ORIGEN_EXCLUYENTE',
      );
    case 'TIPO_MOVIMIENTO_INVALIDO':
      return errores.solicitudInvalida('Tipo de movimiento no valido.', 'TIPO_MOVIMIENTO_INVALIDO');
    case 'TIPO_SALDO_INVALIDO':
      return errores.solicitudInvalida('El tipo de saldo no es valido.', 'TIPO_SALDO_INVALIDO');
    case 'CUENTA_NO_ENCONTRADA':
      return errores.noEncontrado('La cuenta de saldo no existe.', 'CUENTA_NO_ENCONTRADA');
    case 'SALDO_INSUFICIENTE':
      return errores.conflicto('Saldo insuficiente para completar la operacion.', 'SALDO_INSUFICIENTE');
    default:
      return null;
  }
}

/** Cuenta de saldo del usuario y tipo (solo PostgreSQL, usada por la saga). */
async function obtenerCuenta(idUsuario, idTipoSaldo) {
  const filas = await consultarPg(
    `SELECT sc.id_saldo_cuenta, sc.id_usuario, sc.id_tipo_saldo, sc.saldo_actual
       FROM SaldoCuenta sc
      WHERE sc.id_usuario = $1 AND sc.id_tipo_saldo = $2`,
    [idUsuario, idTipoSaldo],
  );
  return filas[0] || null;
}

/** Saldo del usuario por tipo (dbo.usp_Saldo_Consultar). */
async function consultarSaldo(idUsuario) {
  if (usaPostgresql()) {
    const filas = await consultarPg(
      `SELECT sc.id_saldo_cuenta,
              ts.nombre AS tipo_saldo,
              sc.saldo_actual,
              sc.fecha_ultima_actualizacion
         FROM SaldoCuenta sc
         JOIN TipoSaldo ts ON ts.id_tipo_saldo = sc.id_tipo_saldo
        WHERE sc.id_usuario = $1
        ORDER BY ts.nombre`,
      [idUsuario],
    );
    if (filas.length === 0 && !(await existeUsuario(idUsuario))) {
      throw errores.noEncontrado('El usuario no existe.', 'USUARIO_NO_ENCONTRADO');
    }
    return filas;
  }

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
  if (usaPostgresql()) {
    return consultarPg(
      `SELECT sc.id_saldo_cuenta,
              sc.id_tipo_saldo,
              ts.nombre AS nombre_tipo_saldo
         FROM SaldoCuenta sc
         JOIN TipoSaldo ts ON ts.id_tipo_saldo = sc.id_tipo_saldo
        WHERE sc.id_usuario = $1`,
      [idUsuario],
    );
  }

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
  if (usaPostgresql()) {
    if (desde && hasta && new Date(desde) > new Date(hasta)) {
      throw errores.solicitudInvalida('El rango de fechas no es valido.', 'RANGO_FECHAS_INVALIDO');
    }
    if (!(await existeUsuario(idUsuario))) {
      throw errores.noEncontrado('El usuario no existe.', 'USUARIO_NO_ENCONTRADO');
    }
    return consultarPg(
      `SELECT ms.id_movimiento,
              ts.nombre AS tipo_saldo,
              tm.nombre AS concepto,
              tm.naturaleza,
              ms.monto,
              ms.saldo_resultante,
              ms.fecha_hora,
              ms.referencia,
              ms.id_apuesta,
              ms.id_recarga
         FROM MovimientoSaldo ms
         JOIN SaldoCuenta sc         ON sc.id_saldo_cuenta = ms.id_saldo_cuenta
         JOIN TipoSaldo ts           ON ts.id_tipo_saldo = sc.id_tipo_saldo
         JOIN TipoMovimientoSaldo tm ON tm.id_tipo_movimiento = ms.id_tipo_movimiento
        WHERE sc.id_usuario = $1
          AND ($2::int IS NULL OR sc.id_tipo_saldo = $2)
          AND ($3::timestamp IS NULL OR ms.fecha_hora >= $3)
          AND ($4::timestamp IS NULL OR ms.fecha_hora <= $4)
        ORDER BY ms.fecha_hora DESC, ms.id_movimiento DESC`,
      [idUsuario, idTipoSaldo, desde, hasta],
    );
  }

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
  claveIdempotencia = null,
}) {
  if (usaPostgresql()) {
    try {
      const filas = await consultarPg(
        'SELECT * FROM fn_movimiento_saldo($1, $2, $3, $4, $5, $6, $7)',
        [idSaldoCuenta, nombreMovimiento, monto, idApuesta, idRecarga, referencia, claveIdempotencia],
      );
      const fila = filas[0] || {};
      return {
        idMovimiento: fila.id_movimiento,
        saldoResultante: fila.saldo_resultante,
        idempotente: fila.idempotente === true,
      };
    } catch (error) {
      const mapeado = mapearErrorPg(error);
      if (mapeado) throw mapeado;
      throw error;
    }
  }

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
  if (usaPostgresql()) {
    if (!(await usuarioActivo(idUsuario))) {
      throw errores.noEncontrado('El usuario no existe o no esta activo.', 'USUARIO_NO_ACTIVO');
    }
    if (idAdministrador !== null && !(await esAdministrador(idAdministrador))) {
      throw errores.prohibido('El administrador indicado no es valido.', 'ADMINISTRADOR_INVALIDO');
    }
    try {
      const filas = await consultarPg('SELECT * FROM fn_recarga_crear($1, $2, $3, $4, $5, $6)', [
        idUsuario,
        idTipoSaldo,
        monto,
        idAdministrador,
        observacion,
        null,
      ]);
      const fila = filas[0] || {};
      return { idRecarga: fila.id_recarga, mensaje: fila.mensaje || null };
    } catch (error) {
      const mapeado = mapearErrorPg(error);
      if (mapeado) throw mapeado;
      throw error;
    }
  }

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

/** Catalogo de tipos de saldo vigentes (dbo.TipoSaldo). */
async function listarTipos() {
  if (usaPostgresql()) {
    return consultarPg(
      `SELECT ts.id_tipo_saldo,
              ts.nombre,
              ts.descripcion
         FROM TipoSaldo ts
        WHERE ts.estado = 'vigente'
        ORDER BY ts.id_tipo_saldo`,
    );
  }

  const resultado = await consultar(
    `SELECT ts.id_tipo_saldo,
            ts.nombre,
            ts.descripcion
       FROM dbo.TipoSaldo ts
      WHERE ts.estado = 'vigente'
      ORDER BY ts.id_tipo_saldo`,
  );
  return resultado.registros;
}

module.exports = {
  obtenerCuenta,
  consultarSaldo,
  tiposSaldoPorCuenta,
  listarTipos,
  historialMovimientos,
  registrarMovimiento,
  crearRecarga,
};
