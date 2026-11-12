'use strict';

const express = require('express');

const pagoController = require('../controllers/pago.controller');

const router = express.Router();

/** Webhook publico de Wompi: la autenticidad se valida por firma. */
router.post('/wompi', pagoController.webhook);

module.exports = router;
