'use strict';

/**
 * Punto unico de acceso a los cuatro motores.
 *
 * - SQL Server sigue siendo el motor funcional obligatorio.
 * - MySQL, PostgreSQL y MongoDB son auxiliares: su indisponibilidad no impide
 *   arrancar Express ni responder /api/health.
 */

const sqlserver = require('./sqlserver');
const mysql = require('./mysql');
const postgresql = require('./postgresql');
const mongodb = require('./mongodb');

const motores = { sqlserver, mysql, postgresql, mongodb };

/** Ejecuta el ping de un motor con timeout y devuelve 'conectada' | 'no_disponible'. */
async function estadoMotor(nombre, ms) {
  const motor = motores[nombre];
  if (!motor) return 'no_disponible';
  let temporizador;
  const limite = new Promise((_resolver, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error('tiempo de espera agotado')), ms);
  });
  try {
    await Promise.race([motor.ping(), limite]);
    return 'conectada';
  } catch (_error) {
    return 'no_disponible';
  } finally {
    clearTimeout(temporizador);
  }
}

/** Cierra los cuatro motores (usado en el apagado ordenado). */
async function cerrarTodos() {
  await Promise.allSettled(Object.values(motores).map((motor) => motor.cerrar()));
}

module.exports = { motores, estadoMotor, cerrarTodos };
