'use strict';

/**
 * Servicio de JUGADOR (catalogo MySQL, Fase 15).
 * Validaciones de negocio y contrato camelCase para la API.
 */

const jugadorRepository = require('../repositories/jugador.repository');
const { errores } = require('../utils/errors');

const CAMPOS_PERMITIDOS = [
  'idEquipo',
  'nombres',
  'apellidos',
  'numeroCamiseta',
  'posicion',
  'fechaNacimiento',
  'nacionalidad',
  'estado',
];

function aJugador(fila) {
  return {
    idJugador: fila.id_jugador,
    idEquipo: fila.id_equipo,
    equipo: fila.equipo,
    nombres: fila.nombres,
    apellidos: fila.apellidos,
    numeroCamiseta: fila.numero_camiseta,
    posicion: fila.posicion,
    fechaNacimiento: fila.fecha_nacimiento,
    nacionalidad: fila.nacionalidad,
    estado: fila.estado,
    fechaCreacion: fila.fecha_creacion,
  };
}

async function listar({ idEquipo = null } = {}) {
  const filas = await jugadorRepository.listar({ idEquipo });
  return { jugadores: filas.map(aJugador), total: filas.length };
}

async function listarPorEquipo(idEquipo) {
  if (!(await jugadorRepository.existeEquipo(idEquipo))) {
    throw errores.noEncontrado('El equipo no existe.', 'EQUIPO_NO_ENCONTRADO');
  }
  return listar({ idEquipo });
}

function validarCuerpo(cuerpo) {
  const desconocidos = Object.keys(cuerpo || {}).filter((c) => !CAMPOS_PERMITIDOS.includes(c));
  if (desconocidos.length > 0) {
    throw errores.solicitudInvalida(
      `Campos no permitidos: ${desconocidos.join(', ')}.`,
      'CAMPOS_NO_PERMITIDOS',
    );
  }

  const nombres = String(cuerpo.nombres || '').trim();
  const apellidos = String(cuerpo.apellidos || '').trim();
  if (!nombres || !apellidos) {
    throw errores.solicitudInvalida(
      'nombres y apellidos son obligatorios.',
      'DATOS_INCOMPLETOS',
    );
  }

  const camiseta = cuerpo.numeroCamiseta === undefined || cuerpo.numeroCamiseta === null
    ? null
    : Number(cuerpo.numeroCamiseta);
  if (camiseta !== null && (!Number.isInteger(camiseta) || camiseta < 1 || camiseta > 99)) {
    throw errores.solicitudInvalida(
      'numeroCamiseta debe ser un entero entre 1 y 99.',
      'CAMISETA_INVALIDA',
    );
  }

  const estado = cuerpo.estado === undefined ? 'activo' : String(cuerpo.estado);
  if (!['activo', 'inactivo'].includes(estado)) {
    throw errores.solicitudInvalida(
      "estado debe ser 'activo' o 'inactivo'.",
      'ESTADO_INVALIDO',
    );
  }

  return {
    idEquipo: Number(cuerpo.idEquipo),
    nombres,
    apellidos,
    numeroCamiseta: camiseta,
    posicion: cuerpo.posicion ? String(cuerpo.posicion).trim() : null,
    fechaNacimiento: cuerpo.fechaNacimiento ? String(cuerpo.fechaNacimiento) : null,
    nacionalidad: cuerpo.nacionalidad ? String(cuerpo.nacionalidad).trim() : null,
    estado,
  };
}

async function crear(cuerpo) {
  const datos = validarCuerpo(cuerpo);

  if (!Number.isInteger(datos.idEquipo) || datos.idEquipo < 1) {
    throw errores.solicitudInvalida('idEquipo es obligatorio.', 'EQUIPO_INVALIDO');
  }
  if (!(await jugadorRepository.existeEquipo(datos.idEquipo))) {
    throw errores.noEncontrado('El equipo no existe.', 'EQUIPO_NO_ENCONTRADO');
  }
  if (await jugadorRepository.existeCamiseta(datos.idEquipo, datos.numeroCamiseta)) {
    throw errores.conflicto(
      'El numero de camiseta ya esta ocupado en ese equipo.',
      'CAMISETA_DUPLICADA',
    );
  }

  const fila = await jugadorRepository.crear(datos);
  return aJugador(fila);
}

module.exports = { listar, listarPorEquipo, crear };
