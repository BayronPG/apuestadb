'use strict';

/**
 * Servicio de APUESTAS y LIQUIDACIONES.
 * Las validaciones fuertes del negocio (mercado abierto, evento no iniciado,
 * saldo suficiente, cuota congelada) viven en los procedimientos almacenados;
 * este servicio solo transporta datos y normaliza la respuesta.
 */

const apuestaRepository = require('../repositories/apuesta.repository');

const ESTADOS_VALIDOS = ['pendiente', 'ganada', 'perdida', 'anulada'];

/** Registra una apuesta simple del usuario autenticado. */
async function registrarApuesta({ idUsuario, idOpcion, idTipoSaldo, monto }) {
  const resultado = await apuestaRepository.registrar({
    idUsuario,
    idOpcion,
    idTipoSaldo,
    monto,
  });

  return {
    idApuesta: resultado.idApuesta,
    mensaje: resultado.mensaje || 'Apuesta registrada correctamente.',
  };
}

/**
 * Historial de apuestas del usuario autenticado.
 * @param {{estado?:string|null}} filtros
 */
async function listarApuestas({ idUsuario, estado = null }) {
  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    return { apuestas: [], total: 0 };
  }
  const apuestas = await apuestaRepository.historial({ idUsuario, estado });
  return { apuestas, total: apuestas.length };
}

/** Apuestas pendientes del usuario. */
async function listarPendientes(idUsuario) {
  const apuestas = await apuestaRepository.pendientes(idUsuario);
  return { apuestas, total: apuestas.length };
}

/** Apuestas ganadas del usuario. */
async function listarGanadas(idUsuario) {
  const apuestas = await apuestaRepository.ganadas(idUsuario);
  return { apuestas, total: apuestas.length };
}

/** Apuestas perdidas del usuario. */
async function listarPerdidas(idUsuario) {
  const apuestas = await apuestaRepository.perdidas(idUsuario);
  return { apuestas, total: apuestas.length };
}

/**
 * Liquida apuestas (operacion de administrador).
 * Exactamente uno de { idApuesta, idEvento } debe venir informado.
 */
async function liquidar({ idApuesta = null, idEvento = null, idAdministrador = null }) {
  const resultado = await apuestaRepository.liquidar({
    idApuesta,
    idEvento,
    idAdministrador,
  });

  return {
    apuestasLiquidadas: resultado.apuestasLiquidadas || 0,
    mensaje: resultado.mensaje || 'Liquidacion finalizada.',
  };
}

module.exports = {
  ESTADOS_VALIDOS,
  registrarApuesta,
  listarApuestas,
  listarPendientes,
  listarGanadas,
  listarPerdidas,
  liquidar,
};
