'use strict';

/**
 * Repositorio del agregado EVENTO.
 * Lectura: vistas vw_EventosActivos y vw_EventosFinalizados.
 * Escritura: usp_Evento_RegistrarResultado.
 */

const { sql, p, ejecutar, consultar } = require('../config/database');

/** Eventos programados o en curso (vista vw_EventosActivos). */
async function listarActivos() {
  const resultado = await consultar(
    `SELECT * FROM dbo.vw_EventosActivos ORDER BY fecha_hora_inicio ASC`,
  );
  return resultado.registros;
}

/** Eventos finalizados con su resultado (vista vw_EventosFinalizados). */
async function listarFinalizados() {
  const resultado = await consultar(
    `SELECT * FROM dbo.vw_EventosFinalizados ORDER BY fecha_hora_inicio DESC`,
  );
  return resultado.registros;
}

/**
 * Detalle de un evento por identificador (consulta parametrizada sobre Evento
 * y sus catalogos). Equivale a una fila de vw_EventosActivos pero sin filtrar
 * por estado: el frontend necesita ver tambien los eventos cerrados/cancelados
 * para deshabilitarlos. Devuelve null si el evento no existe.
 */
async function obtenerPorId(idEvento) {
  const resultado = await consultar(
    `SELECT e.id_evento,
            d.nombre   AS deporte,
            l.nombre   AS liga,
            t.etiqueta AS temporada,
            el.nombre  AS equipo_local,
            ev.nombre  AS equipo_visitante,
            es.nombre  AS estadio,
            e.fecha_hora_inicio,
            e.estado
       FROM dbo.Evento e
       JOIN dbo.Temporada t ON t.id_temporada = e.id_temporada
       JOIN dbo.Liga l      ON l.id_liga = t.id_liga
       JOIN dbo.Deporte d   ON d.id_deporte = l.id_deporte
       JOIN dbo.Equipo el   ON el.id_equipo = e.id_equipo_local
       JOIN dbo.Equipo ev   ON ev.id_equipo = e.id_equipo_visitante
       JOIN dbo.Estadio es  ON es.id_estadio = e.id_estadio
      WHERE e.id_evento = @id_evento`,
    { id_evento: p(sql.Int, idEvento) },
  );
  return resultado.registros[0] || null;
}

/**
 * Mercados de un evento con sus opciones y cuotas vigentes.
 * Se usa una consulta parametrizada (precedente de notificacion.repository.js)
 * porque database/ no se modifica: no existen vista ni procedimiento de lectura
 * del catalogo de mercados/opciones.
 * Devuelve filas planas (una por opcion; los mercados sin opciones llegan con
 * las columnas de opcion en NULL); el agrupamiento se hace en el servicio.
 */
async function listarMercadosConOpciones(idEvento) {
  const resultado = await consultar(
    `SELECT m.id_mercado,
            m.nombre,
            m.descripcion,
            m.fecha_apertura,
            m.fecha_cierre,
            m.estado,
            o.id_opcion,
            o.etiqueta,
            o.cuota_vigente,
            o.estado AS estado_opcion
       FROM dbo.Mercado m
       LEFT JOIN dbo.OpcionApuesta o ON o.id_mercado = m.id_mercado
      WHERE m.id_evento = @id_evento
      ORDER BY m.fecha_cierre ASC, m.id_mercado ASC, o.id_opcion ASC`,
    { id_evento: p(sql.Int, idEvento) },
  );
  return resultado.registros;
}

/**
 * Registra el resultado (marcador) de un evento.
 * Invoca dbo.usp_Evento_RegistrarResultado; con estado 'oficial' el evento
 * pasa a 'finalizado' y queda habilitada la liquidacion (RN-15).
 */
async function registrarResultado({
  idEvento,
  marcadorLocal,
  marcadorVisitante,
  estado = 'oficial',
  idAdministrador = null,
}) {
  const resultado = await ejecutar(
    'dbo.usp_Evento_RegistrarResultado',
    {
      id_evento: p(sql.Int, idEvento),
      marcador_local: p(sql.SmallInt, marcadorLocal),
      marcador_visitante: p(sql.SmallInt, marcadorVisitante),
      estado: p(sql.VarChar(20), estado),
      id_administrador: p(sql.Int, idAdministrador),
    },
    { id_resultado: sql.Int },
  );

  const fila = resultado.registros[0] || {};
  return {
    idResultado: resultado.salidas.id_resultado,
    mensaje: fila.mensaje || null,
  };
}

module.exports = {
  listarActivos,
  listarFinalizados,
  obtenerPorId,
  listarMercadosConOpciones,
  registrarResultado,
};
