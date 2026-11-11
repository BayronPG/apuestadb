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
const path = require('path');
const fs = require('fs');

const config = require('./config');
const rutas = require('./routes');
const { noEncontrado } = require('./middlewares/notFound');
const { manejadorErrores } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Cabeceras de seguridad HTTP. CSP permite los dominios de reCAPTCHA v3.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://www.google.com', 'https://www.gstatic.com'],
        frameSrc: ["'self'", 'https://www.google.com', 'https://recaptcha.google.com'],
        connectSrc: ["'self'", 'https://www.google.com'],
        imgSrc: ["'self'", 'data:', 'https://www.gstatic.com'],
      },
    },
  }),
);

// CORS configurable por lista CSV; el wildcard se limita a entornos no productivos.
app.use(
  cors({
    origin: (origen, callback) => {
      if (!origen || (config.entorno !== 'production' && config.cors.origenes.includes('*'))) {
        return callback(null, true);
      }

      return callback(null, config.cors.origenes.includes(origen));
    },
    credentials: true,
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

// Frontend compilado (App Service: backend/public; local: ../frontend/dist).
const candidatosDist = [
  path.join(__dirname, 'public'),
  path.join(__dirname, '..', 'frontend', 'dist'),
];
const carpetaDist = candidatosDist.find((carpeta) =>
  fs.existsSync(path.join(carpeta, 'index.html')),
);

if (carpetaDist) {
  app.use(express.static(carpetaDist));
  // Fallback SPA: cualquier ruta que no sea /api devuelve index.html.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith(config.apiPrefijo)) return next();
    return res.sendFile(path.join(carpetaDist, 'index.html'));
  });
}

// 404 y manejador central de errores (siempre al final).
app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;
