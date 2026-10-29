'use strict';

/**
 * Rutas de EVENTOS.
 * GET  /api/eventos/activos | /finalizados       (usuario autenticado)
 * GET  /api/eventos/:id/opciones                 (usuario autenticado)
 * POST /api/eventos/:id/resultado                (administrador)
 */

const express = require('express');
const { body, param, query } = require('express-validator');

const { autenticar } = require('../middlewares/auth');
const { roles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validate');
const eventoController = require('../controllers/evento.controller');

const router = express.Router();

router.get('/activos', autenticar, eventoController.activos);
router.get('/finalizados', autenticar, eventoController.finalizados);

router.get(
  '/:id/opciones',
  autenticar,
  [
    param('id').isInt({ min: 1 }).withMessage('El identificador del evento no es valido.'),
    query('monto')
      .optional({ values: 'falsy' })
      .isFloat({ gt: 0 })
      .withMessage('El monto debe ser un numero mayor que cero.'),
  ],
  validar,
  eventoController.opciones,
);

router.post(
  '/:id/resultado',
  autenticar,
  roles('administrador'),
  [
    param('id').isInt({ min: 1 }).withMessage('El identificador del evento no es valido.'),
    body('marcadorLocal')
      .isInt({ min: 0, max: 32767 })
      .withMessage('marcadorLocal debe ser un entero entre 0 y 32767.'),
    body('marcadorVisitante')
      .isInt({ min: 0, max: 32767 })
      .withMessage('marcadorVisitante debe ser un entero entre 0 y 32767.'),
    body('estado')
      .optional()
      .isIn(['oficial', 'provisional'])
      .withMessage("estado debe ser 'oficial' o 'provisional'."),
  ],
  validar,
  eventoController.registrarResultado,
);

module.exports = router;
