'use strict';

/**
 * Rutas de JUGADOR (catalogo MySQL, Fase 15).
 * GET  /api/jugadores                (usuario autenticado)
 * POST /api/jugadores                (administrador)
 */

const express = require('express');
const { body, query } = require('express-validator');

const { autenticar } = require('../middlewares/auth');
const { roles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validate');
const jugadorController = require('../controllers/jugador.controller');

const router = express.Router();

router.get(
  '/',
  autenticar,
  [
    query('idEquipo')
      .optional({ values: 'falsy' })
      .isInt({ min: 1 })
      .withMessage('idEquipo debe ser un entero positivo.'),
  ],
  validar,
  jugadorController.listar,
);

router.post(
  '/',
  autenticar,
  roles('administrador'),
  [
    body('idEquipo').isInt({ min: 1 }).withMessage('idEquipo es obligatorio.'),
    body('nombres').trim().isLength({ min: 1, max: 100 }).withMessage('nombres es obligatorio.'),
    body('apellidos').trim().isLength({ min: 1, max: 100 }).withMessage('apellidos es obligatorio.'),
    body('numeroCamiseta')
      .optional({ values: 'null' })
      .isInt({ min: 1, max: 99 })
      .withMessage('numeroCamiseta debe estar entre 1 y 99.'),
    body('estado')
      .optional()
      .isIn(['activo', 'inactivo'])
      .withMessage("estado debe ser 'activo' o 'inactivo'."),
  ],
  validar,
  jugadorController.crear,
);

module.exports = router;
