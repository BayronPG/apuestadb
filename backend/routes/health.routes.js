'use strict';

/**
 * Rutas de ESTADO DEL SISTEMA (publicas).
 * GET /api/health
 */

const express = require('express');

const healthController = require('../controllers/health.controller');

const router = express.Router();

router.get('/', healthController.estado);

module.exports = router;
