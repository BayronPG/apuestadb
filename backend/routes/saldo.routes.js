'use strict';

/**
 * Rutas de SALDO (usuario autenticado).
 * GET /api/saldo | GET /api/saldo/movimientos
 */

const express = require('express');

const { autenticar } = require('../middlewares/auth');
const saldoController = require('../controllers/saldo.controller');

const router = express.Router();

router.get('/', autenticar, saldoController.consultar);
router.get('/movimientos', autenticar, saldoController.historialMovimientos);

module.exports = router;
