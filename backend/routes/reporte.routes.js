'use strict';

/**
 * Rutas de REPORTES (administrador).
 * GET /api/reportes/administrativo | /financiero | /ranking
 */

const express = require('express');

const { autenticar } = require('../middlewares/auth');
const { roles } = require('../middlewares/roles');
const reporteController = require('../controllers/reporte.controller');

const router = express.Router();

router.get('/administrativo', autenticar, roles('administrador'), reporteController.administrativo);
router.get('/financiero', autenticar, roles('administrador'), reporteController.financiero);
router.get('/ranking', autenticar, roles('administrador'), reporteController.ranking);

module.exports = router;
