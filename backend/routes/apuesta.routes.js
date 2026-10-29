'use strict';

/**
 * Rutas de APUESTAS (usuario autenticado).
 * POST /api/apuestas
 * GET  /api/apuestas?estado= | /pendientes | /ganadas | /perdidas
 */

const express = require('express');
const { body } = require('express-validator');

const { autenticar } = require('../middlewares/auth');
const { validar } = require('../middlewares/validate');
const apuestaController = require('../controllers/apuesta.controller');

const router = express.Router();

router.post(
  '/',
  autenticar,
  [
    body('idOpcion').isInt({ min: 1 }).withMessage('idOpcion debe ser un entero positivo.'),
    body('idTipoSaldo')
      .isInt({ min: 1 })
      .withMessage('idTipoSaldo debe ser un entero positivo.'),
    body('monto').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor que cero.'),
  ],
  validar,
  apuestaController.registrar,
);

router.get('/', autenticar, apuestaController.listar);
router.get('/pendientes', autenticar, apuestaController.pendientes);
router.get('/ganadas', autenticar, apuestaController.ganadas);
router.get('/perdidas', autenticar, apuestaController.perdidas);

module.exports = router;
