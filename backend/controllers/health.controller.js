'use strict';

/**
 * Controlador de ESTADO DEL SISTEMA.
 * GET /api/health responde siempre 200 para poder distinguir "API viva" de
 * "API caida"; el estado de la base de datos se informa en data.baseDatos.
 */

const config = require('../config');
const { probarConexion } = require('../config/database');
const { manejarAsync } = require('../utils/asyncHandler');
const paquete = require('../package.json');

const estado = manejarAsync(async (_req, res) => {
  const datos = {
    servicio: paquete.name,
    version: paquete.version,
    entorno: config.entorno,
    hora: new Date().toISOString(),
    uptimeSegundos: Math.round(process.uptime()),
    baseDatos: {
      servidor: config.bd.servidor,
      nombre: config.bd.baseDatos,
      estado: 'desconocida',
    },
  };

  try {
    const conectada = await probarConexion();
    datos.baseDatos.estado = conectada ? 'conectada' : 'sin_respuesta';
  } catch (error) {
    datos.baseDatos.estado = 'no_disponible';
    datos.baseDatos.detalle = error.message;
  }

  return res.status(200).json({ ok: true, data: datos });
});

module.exports = { estado };
