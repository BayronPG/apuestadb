'use strict';

const express = require('express');
const { body } = require('express-validator');

const { autenticar } = require('../middlewares/auth');
const { validar } = require('../middlewares/validate');
const twofactorController = require('../controllers/twofactor.controller');

const router = express.Router();

router.get('/estado', autenticar, twofactorController.estado);
router.post('/configurar', autenticar, twofactorController.configurar);

router.post(
  '/activar',
  autenticar,
  [body('codigo').matches(/^\d{6}$/).withMessage('El codigo debe tener 6 digitos.')],
  validar,
  twofactorController.activar,
);

router.post(
  '/desactivar',
  autenticar,
  [
    body('contrasena').isString().notEmpty().withMessage('La contrasena es obligatoria.'),
    body('codigo').matches(/^\d{6}$/).withMessage('El codigo debe tener 6 digitos.'),
  ],
  validar,
  twofactorController.desactivar,
);

module.exports = router;
