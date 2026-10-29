'use strict';

/**
 * Rutas de RECARGAS (administrador).
 * POST /api/recargas
 */

const express = require('express');
const { body } = require('express-validator');

const { autenticar } = require('../middlewares/auth');
const { roles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validate');
const recargaController = require('../controllers/recarga.controller');

const router = express.Router();

router.post(
  '/',
  autenticar,
  roles('administrador'),
  [
    body('idUsuario').isInt({ min: 1 }).withMessage('idUsuario debe ser un entero positivo.'),
    body('idTipoSaldo').isInt({ min: 1 }).withMessage('idTipoSaldo debe ser un entero positivo.'),
    body('monto')
      .isFloat({ gt: 0 })
      .withMessage('El monto debe ser numerico y mayor que cero.'),
    body('observacion')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('La observacion excede 255 caracteres.'),
  ],
  validar,
  recargaController.crear,
);

module.exports = router;
