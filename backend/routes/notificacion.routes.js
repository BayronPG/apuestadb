'use strict';

/**
 * Rutas de NOTIFICACIONES (usuario autenticado).
 * GET /api/notificaciones | PATCH /api/notificaciones/:id
 */

const express = require('express');
const { param, body } = require('express-validator');

const { autenticar } = require('../middlewares/auth');
const { validar } = require('../middlewares/validate');
const notificacionController = require('../controllers/notificacion.controller');

const router = express.Router();

// Estados reales de dbo.Notificacion.estado (y ESTADOS_NOTIFICACION del frontend).
const ESTADOS_NOTIFICACION = ['no_leida', 'leida'];

router.get('/', autenticar, notificacionController.listar);

router.patch(
  '/:id',
  autenticar,
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El id de la notificacion debe ser un entero positivo.'),
    body('estado')
      .isString()
      .withMessage('El estado debe ser texto.')
      .isIn(ESTADOS_NOTIFICACION)
      .withMessage(`Estado no permitido. Valores validos: ${ESTADOS_NOTIFICACION.join(', ')}.`),
    body().custom((valor) => {
      const permitidos = ['estado'];
      const noPermitidos = Object.keys(valor || {}).filter((campo) => !permitidos.includes(campo));
      if (noPermitidos.length > 0) {
        throw new Error(`Campos no permitidos: ${noPermitidos.join(', ')}.`);
      }
      return true;
    }),
  ],
  validar,
  notificacionController.actualizar,
);

module.exports = router;
