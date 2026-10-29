'use strict';

/**
 * Aplicacion Express de ApuestaDB.
 *
 * Orden del pipeline:
 *   seguridad (helmet, cors) -> parseo de cuerpo -> rutas /api -> 404 -> errores.
 *
 * Este archivo no abre el puerto: de eso se encarga server.js, lo que permite
 * importar `app` desde pruebas automatizadas sin levantar el servidor real.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const config = require('./config');
const rutas = require('./routes');
const { noEncontrado } = require('./middlewares/notFound');
const { manejadorErrores } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');

// Cabeceras de seguridad HTTP (helmet con sus valores por defecto).
app.use(helmet());

// CORS para el frontend React. Con "*" se permite cualquier origen (solo local).
app.use(
  cors({
    origin: config.cors.origenes.includes('*') ? true : config.cors.origenes,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Cuerpo JSON/URL-encoded con limite defensivo.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Las respuestas de datos no deben quedar en cache (saldo, historial, etc.).
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Rutas de la API.
app.use(config.apiPrefijo, rutas);

// 404 y manejador central de errores (siempre al final).
app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;
