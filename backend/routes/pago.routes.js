'use strict';

const express = require('express');
const { body, param } = require('express-validator');

const { autenticar } = require('../middlewares/auth');
const { validar } = require('../middlewares/validate');
const pagoController = require('../controllers/pago.controller');

const router = express.Router();

router.post(
  '/wompi/checkout',
  autenticar,
  [
    body('idTipoSaldo').isInt({ min: 1 }).withMessage('idTipoSaldo es obligatorio.'),
    body('monto').isFloat({ gt: 0 }).withMessage('monto debe ser mayor que cero.'),
  ],
  validar,
  pagoController.checkout,
);

// Alias compatible con la URL publica acordada: /api/pagos/wompi/webhook
router.post('/wompi/webhook', pagoController.webhook);

// Historial de transacciones Wompi del usuario autenticado.
router.get('/wompi', autenticar, pagoController.listar);

// Historial espejo en Firestore (no sustituye a PostgreSQL).
router.get('/firestore', autenticar, pagoController.listarFirestore);

router.get(
  '/:referencia',
  autenticar,
  [param('referencia').isLength({ min: 5, max: 120 }).withMessage('Referencia invalida.')],
  validar,
  pagoController.estado,
);

module.exports = router;

