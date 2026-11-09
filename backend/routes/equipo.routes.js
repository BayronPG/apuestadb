'use strict';

/**
 * Rutas de EQUIPO (catalogo MySQL, Fase 15).
 * GET /api/equipos/:id/jugadores (usuario autenticado)
 */

const express = require('express');
const { param } = require('express-validator');

const { autenticar } = require('../middlewares/auth');
const { validar } = require('../middlewares/validate');
const jugadorController = require('../controllers/jugador.controller');

const router = express.Router();

router.get(
  '/:id/jugadores',
  autenticar,
  [param('id').isInt({ min: 1 }).withMessage('El identificador del equipo no es valido.')],
  validar,
  jugadorController.listarPorEquipo,
);

module.exports = router;
