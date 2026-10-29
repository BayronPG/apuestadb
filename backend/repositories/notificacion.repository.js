'use strict';

/**
 * Repositorio del agregado NOTIFICACION.
 *
 * Nota de diseño: los scripts de database/ solo incluyen
 * usp_Notificacion_Crear (escritura). Para la lectura se usa una consulta
 * parametrizada directa sobre dbo.Notificacion; si en una fase posterior se
 * agrega dbo.usp_Notificacion_Consultar, basta con sustituir este metodo.
 */

const { sql, p, consultar } = require('../config/database');

/**
 * Lista las notificaciones del usuario.
 * @param {{idUsuario:number, estado?:string|null, limite?:number}} filtros
 */
async function listar({ idUsuario, estado = null, limite = 100 }) {
  const resultado = await consultar(
    `SELECT TOP (@limite)
            n.id_notificacion,
            n.id_usuario,
            n.mensaje,
            n.tipo,
            n.fecha_hora,
            n.estado
       FROM dbo.Notificacion n
      WHERE n.id_usuario = @id_usuario
        AND (@estado IS NULL OR n.estado = @estado)
      ORDER BY n.fecha_hora DESC`,
    {
      limite: p(sql.Int, limite),
      id_usuario: p(sql.Int, idUsuario),
      estado: p(sql.VarChar(20), estado),
    },
  );

  return resultado.registros;
}

module.exports = { listar };
