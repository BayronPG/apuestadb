'use strict';

/**
 * Rutas de AUDITORIA (administrador).
 * GET /api/auditoria
 */

const express = require('express');

const { autenticar } = require('../middlewares/auth');
const { roles } = require('../middlewares/roles');
const auditoriaController = require('../controllers/auditoria.controller');

const router = express.Router();

router.get('/', autenticar, roles('administrador'), auditoriaController.consultar);

module.exports = router;
