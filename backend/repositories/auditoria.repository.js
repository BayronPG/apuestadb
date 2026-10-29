'use strict';

/**
 * Repositorio del agregado AUDITORIA.
 * Usa usp_Auditoria_Registrar (escritura) y usp_Auditoria_Consultar (lectura).
 */

const { sql, p, ejecutar } = require('../config/database');

/**
 * Inserta un registro de auditoria (dbo.usp_Auditoria_Registrar).
 * @param {{operacion:string, entidadAfectada:string, resultado:'exito'|'fallo',
 *          idUsuario?:number|null, descripcion?:string|null, direccionOrigen?:string|null}} datos
 */
async function registrar({
  operacion,
  entidadAfectada,
  resultado,
  idUsuario = null,
  descripcion = null,
  direccionOrigen = null,
}) {
  await ejecutar('dbo.usp_Auditoria_Registrar', {
    operacion: p(sql.NVarChar(50), operacion),
    entidad_afectada: p(sql.NVarChar(50), entidadAfectada),
    resultado: p(sql.VarChar(20), resultado),
    id_usuario: p(sql.Int, idUsuario),
    descripcion: p(sql.NVarChar(500), descripcion),
    direccion_origen: p(sql.VarChar(45), direccionOrigen),
  });
}

/**
 * Consulta la auditoria con filtros (dbo.usp_Auditoria_Consultar).
 * `top` se limita a 1000 dentro del procedimiento.
 */
async function consultar({ idUsuario = null, operacion = null, desde = null, hasta = null, top = 100 }) {
  const resultado = await ejecutar('dbo.usp_Auditoria_Consultar', {
    id_usuario: p(sql.Int, idUsuario),
    operacion: p(sql.NVarChar(50), operacion),
    desde: p(sql.DateTime2, desde),
    hasta: p(sql.DateTime2, hasta),
    top: p(sql.Int, top),
  });
  return resultado.registros;
}

module.exports = { registrar, consultar };
