'use strict';

/**
 * Servicio de EVENTOS.
 * Lectura de cartelera y resultados; registro del resultado oficial
 * (operacion de administrador) que habilita la liquidacion (RN-15).
 */

const eventoRepository = require('../repositories/evento.repository');
const { errores } = require('../utils/errors');

/** Cartelera: eventos programados o en curso. */
async function listarActivos() {
  const eventos = await eventoRepository.listarActivos();
  return { eventos, total: eventos.length };
}

/** Eventos finalizados con marcador y opcion ganadora derivada. */
async function listarFinalizados() {
  const eventos = await eventoRepository.listarFinalizados();
  return { eventos, total: eventos.length };
}

/**
 * Catalogo para la pantalla "Crear apuesta": evento + mercados + opciones + cuotas.
 * Responde con nombres en camelCase (contrato del frontend React).
 * @param {number} idEvento
 * @param {{monto?:number|null}} opciones Si se recibe un monto valido, cada
 *   opcion incluye `premioPotencial` (= monto x cuotaVigente, misma formula de
 *   dbo.fn_PremioPotencial); si no, el campo se omite.
 */
async function obtenerOpciones(idEvento, { monto = null } = {}) {
  const evento = await eventoRepository.obtenerPorId(idEvento);
  if (!evento) {
    throw errores.noEncontrado('El evento no existe.', 'EVENTO_NO_ENCONTRADO');
  }

  const filas = await eventoRepository.listarMercadosConOpciones(idEvento);

  const mercados = [];
  const porIdMercado = new Map();

  for (const fila of filas) {
    let mercado = porIdMercado.get(fila.id_mercado);
    if (!mercado) {
      mercado = {
        idMercado: fila.id_mercado,
        nombre: fila.nombre,
        descripcion: fila.descripcion === undefined ? null : fila.descripcion,
        fechaApertura: fila.fecha_apertura,
        fechaCierre: fila.fecha_cierre,
        estado: fila.estado,
        opciones: [],
      };
      porIdMercado.set(fila.id_mercado, mercado);
      mercados.push(mercado);
    }

    if (fila.id_opcion === null || fila.id_opcion === undefined) continue;

    const cuota = fila.cuota_vigente === null ? null : Number(fila.cuota_vigente);
    const opcion = {
      idOpcion: fila.id_opcion,
      etiqueta: fila.etiqueta,
      cuotaVigente: cuota,
      estado: fila.estado_opcion,
    };

    if (Number.isFinite(monto) && monto > 0 && Number.isFinite(cuota)) {
      opcion.premioPotencial = Number((monto * cuota).toFixed(2));
    }

    mercado.opciones.push(opcion);
  }

  return {
    evento: {
      idEvento: evento.id_evento,
      deporte: evento.deporte,
      liga: evento.liga,
      temporada: evento.temporada,
      equipoLocal: evento.equipo_local,
      equipoVisitante: evento.equipo_visitante,
      estadio: evento.estadio,
      fechaHoraInicio: evento.fecha_hora_inicio,
      estado: evento.estado,
    },
    mercados,
  };
}

/** Registra el resultado de un evento (administrador). */
async function registrarResultado({
  idEvento,
  marcadorLocal,
  marcadorVisitante,
  estado = 'oficial',
  idAdministrador = null,
}) {
  const resultado = await eventoRepository.registrarResultado({
    idEvento,
    marcadorLocal,
    marcadorVisitante,
    estado,
    idAdministrador,
  });

  return {
    idResultado: resultado.idResultado,
    mensaje: resultado.mensaje || 'Resultado registrado correctamente.',
  };
}

module.exports = { listarActivos, listarFinalizados, obtenerOpciones, registrarResultado };
