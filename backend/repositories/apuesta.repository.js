'use strict';

/**
 * Repositorio del agregado APUESTA.
 * Escritura: usp_Apuesta_Registrar y usp_Apuesta_Liquidar.
 * Lectura: usp_Apuesta_Historial y las vistas vw_Apuestas{Pendientes,Ganadas,Perdidas}.
 */

const { sql, p, ejecutar, consultar } = require('../config/database');

/**
 * Registra una apuesta simple con cuota congelada y descuento de saldo.
 * Invoca dbo.usp_Apuesta_Registrar.
 */
async function registrar({ idUsuario, idOpcion, idTipoSaldo, monto }) {
  const resultado = await ejecutar(
    'dbo.usp_Apuesta_Registrar',
    {
      id_usuario: p(sql.Int, idUsuario),
      id_opcion: p(sql.Int, idOpcion),
      id_tipo_saldo: p(sql.Int, idTipoSaldo),
      monto: p(sql.Decimal(18, 2), monto),
    },
    { id_apuesta: sql.Int },
  );

  return {
    idApuesta: resultado.salidas.id_apuesta,
    mensaje: resultado.registros.length > 0 ? resultado.registros[0].mensaje : null,
  };
}

/**
 * Liquida una apuesta o todas las pendientes de un evento.
 * Invoca dbo.usp_Apuesta_Liquidar (exactamente uno de los dos criterios).
 */
async function liquidar({ idApuesta = null, idEvento = null, idAdministrador = null }) {
  const resultado = await ejecutar(
    'dbo.usp_Apuesta_Liquidar',
    {
      id_apuesta: p(sql.Int, idApuesta),
      id_evento: p(sql.Int, idEvento),
      id_administrador: p(sql.Int, idAdministrador),
    },
  );

  const fila = resultado.registros[0] || {};
  return {
    apuestasLiquidadas: fila.apuestas_liquidadas,
    mensaje: fila.mensaje || null,
  };
}

/** Historial de apuestas del usuario (dbo.usp_Apuesta_Historial). */
async function historial({ idUsuario, estado = null }) {
  const resultado = await ejecutar('dbo.usp_Apuesta_Historial', {
    id_usuario: p(sql.Int, idUsuario),
    estado: p(sql.VarChar(20), estado),
  });
  return resultado.registros;
}

/** Apuestas pendientes del usuario (vista vw_ApuestasPendientes). */
async function pendientes(idUsuario) {
  const resultado = await consultar(
    `SELECT * FROM dbo.vw_ApuestasPendientes
      WHERE id_usuario = @id_usuario
      ORDER BY fecha_hora_registro DESC`,
    { id_usuario: p(sql.Int, idUsuario) },
  );
  return resultado.registros;
}

/** Apuestas ganadas del usuario (vista vw_ApuestasGanadas). */
async function ganadas(idUsuario) {
  const resultado = await consultar(
    `SELECT * FROM dbo.vw_ApuestasGanadas
      WHERE id_usuario = @id_usuario
      ORDER BY fecha_hora_registro DESC`,
    { id_usuario: p(sql.Int, idUsuario) },
  );
  return resultado.registros;
}

/** Apuestas perdidas del usuario (vista vw_ApuestasPerdidas). */
async function perdidas(idUsuario) {
  const resultado = await consultar(
    `SELECT * FROM dbo.vw_ApuestasPerdidas
      WHERE id_usuario = @id_usuario
      ORDER BY fecha_hora_registro DESC`,
    { id_usuario: p(sql.Int, idUsuario) },
  );
  return resultado.registros;
}

module.exports = { registrar, liquidar, historial, pendientes, ganadas, perdidas };
