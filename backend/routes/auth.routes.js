'use strict';

/**
 * Rutas de AUTENTICACION (publicas).
 * POST /api/auth/registro | /login | /recuperar | /restablecer
 */

const express = require('express');
const { body } = require('express-validator');

const { validar } = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');

const router = express.Router();

const cadenaCorreo = body('correo')
  .trim()
  .notEmpty()
  .withMessage('El correo es obligatorio.')
  .isEmail()
  .withMessage('El correo no es valido.')
  .isLength({ max: 150 })
  .withMessage('El correo excede 150 caracteres.');

const cadenaContrasena = body('contrasena')
  .isString()
  .withMessage('La contrasena debe ser texto.')
  .isLength({ min: 8, max: 72 })
  .withMessage('La contrasena debe tener entre 8 y 72 caracteres.');

router.post(
  '/registro',
  [
    body('nombres')
      .trim()
      .notEmpty()
      .withMessage('El nombre es obligatorio.')
      .isLength({ max: 100 })
      .withMessage('El nombre excede 100 caracteres.'),
    body('apellidos')
      .trim()
      .notEmpty()
      .withMessage('El apellido es obligatorio.')
      .isLength({ max: 100 })
      .withMessage('El apellido excede 100 caracteres.'),
    cadenaCorreo,
    cadenaContrasena,
    body('telefono')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('El telefono excede 20 caracteres.'),
  ],
  validar,
  authController.registrar,
);

router.post(
  '/login',
  [
    cadenaCorreo,
    body('contrasena').isString().notEmpty().withMessage('La contrasena es obligatoria.'),
  ],
  validar,
  authController.iniciarSesion,
);

router.post('/recuperar', [cadenaCorreo], validar, authController.solicitarRecuperacion);

router.post(
  '/restablecer',
  [
    cadenaCorreo,
    body('valorToken')
      .trim()
      .notEmpty()
      .withMessage('El token es obligatorio.')
      .isLength({ max: 128 })
      .withMessage('El token excede 128 caracteres.'),
    body('nuevaContrasena')
      .isString()
      .isLength({ min: 8, max: 72 })
      .withMessage('La nueva contrasena debe tener entre 8 y 72 caracteres.'),
  ],
  validar,
  authController.restablecerContrasena,
);

module.exports = router;
