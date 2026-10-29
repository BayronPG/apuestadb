'use strict';

/**
 * Rutas de NOTIFICACIONES (usuario autenticado).
 * GET /api/notificaciones
 */

const express = require('express');

const { autenticar } = require('../middlewares/auth');
const notificacionController = require('../controllers/notificacion.controller');

const router = express.Router();

router.get('/', autenticar, notificacionController.listar);

module.exports = router;
