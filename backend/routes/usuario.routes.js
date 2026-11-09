'use strict';

/**
 * Rutas de USUARIOS.
 * GET /api/usuarios/perfil | PUT /api/usuarios/perfil | GET /api/usuarios
 */

const express = require('express');
const { body } = require('express-validator');

const { autenticar } = require('../middlewares/auth');
const { roles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validate');
const usuarioController = require('../controllers/usuario.controller');

const router = express.Router();

router.get('/perfil', autenticar, usuarioController.obtenerPerfil);
router.put(
  '/perfil',
  autenticar,
  [
    body('nombres')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Los nombres no pueden estar vacios.')
      .isLength({ max: 100 })
      .withMessage('Los nombres exceden 100 caracteres.'),
    body('apellidos')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Los apellidos no pueden estar vacios.')
      .isLength({ max: 100 })
      .withMessage('Los apellidos exceden 100 caracteres.'),
    body('telefono')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 20 })
      .withMessage('El telefono excede 20 caracteres.'),
    body().custom((valor) => {
      const permitidos = ['nombres', 'apellidos', 'telefono'];
      const campos = Object.keys(valor || {});
      const noPermitidos = campos.filter((campo) => !permitidos.includes(campo));
      if (noPermitidos.length > 0) {
        throw new Error(`Campos no permitidos: ${noPermitidos.join(', ')}.`);
      }
      if (campos.length === 0) {
        throw new Error('Debe indicar al menos un campo para actualizar.');
      }
      return true;
    }),
  ],
  validar,
  usuarioController.actualizarPerfil,
);
router.get('/', autenticar, roles('administrador'), usuarioController.listar);

module.exports = router;
