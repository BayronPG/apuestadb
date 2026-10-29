'use strict';

/**
 * Servicio de AUDITORIA.
 * Concentra el registro de trazas usado por los demas servicios.
 * `registrarSeguro` nunca propaga el error: la auditoria es un efecto
 * secundario y su fallo no debe tumbar la operacion de negocio.
 */

const auditoriaRepository = require('../repositories/auditoria.repository');

/**
 * Registra una traza de auditoria sin propagar errores.
 * @param {{operacion:string, entidadAfectada:string, resultado:string,
 *          idUsuario?:number|null, descripcion?:string|null,
 *          direccionOrigen?:string|null}} datos
 */
async function registrarSeguro(datos) {
  try {
    await auditoriaRepository.registrar(datos);
  } catch (error) {
    console.warn('[auditoria] No se pudo registrar la traza:', error.message);
  }
}

/** Consulta la auditoria con filtros (ruta de administrador). */
async function consultar(filtros) {
  return auditoriaRepository.consultar(filtros);
}

module.exports = { registrarSeguro, consultar };
