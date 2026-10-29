'use strict';

/**
 * Rutas de USUARIOS (administrador).
 * GET /api/usuarios
 */

const express = require('express');

const { autenticar } = require('../middlewares/auth');
const { roles } = require('../middlewares/roles');
const usuarioController = require('../controllers/usuario.controller');

const router = express.Router();

router.get('/', autenticar, roles('administrador'), usuarioController.listar);

module.exports = router;
