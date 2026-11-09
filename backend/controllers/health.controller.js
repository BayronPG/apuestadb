'use strict';

/**
 * Controlador de ESTADO DEL SISTEMA.
 * GET /api/health
 *
 * Responde siempre 200 mientras la API este viva. Informa el estado de los
 * cuatro motores sin exponer host, puerto, base, usuario, URI ni errores.
 *
 * Contrato anterior conservado:
 *   data.baseDatos.estado  -> SQL Server ('conectada' | 'no_disponible')
 * Contrato nuevo:
 *   data.estado            -> 'operativo' | 'degradado'
 *   data.motores.{motor}.estado
 */

const config = require('../config');
const { estadoMotor } = require('../config/db');
const { manejarAsync } = require('../utils/asyncHandler');
const paquete = require('../package.json');

const TIEMPO_MAXIMO = 5000;

const estado = manejarAsync(async (_req, res) => {
  const nombres = ['sqlserver', 'mysql', 'postgresql', 'mongodb'];
  const resultados = await Promise.allSettled(
    nombres.map((nombre) => estadoMotor(nombre, TIEMPO_MAXIMO)),
  );

  const motores = {};
  nombres.forEach((nombre, indice) => {
    const resultado = resultados[indice];
    motores[nombre] = {
      estado: resultado.status === 'fulfilled' ? resultado.value : 'no_disponible',
    };
  });

  const sqlserverConectado = motores.sqlserver.estado === 'conectada';
  const todosConectados = nombres.every((nombre) => motores[nombre].estado === 'conectada');

  const datos = {
    servicio: paquete.name,
    version: paquete.version,
    entorno: config.entorno,
    hora: new Date().toISOString(),
    uptimeSegundos: Math.round(process.uptime()),
    estado: todosConectados ? 'operativo' : 'degradado',
    baseDatos: {
      estado: sqlserverConectado ? 'conectada' : 'no_disponible',
    },
    motores,
  };

  return res.status(200).json({ ok: true, data: datos });
});

module.exports = { estado };
