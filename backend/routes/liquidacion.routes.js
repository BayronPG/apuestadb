'use strict';

/**
 * Rutas de LIQUIDACIONES (administrador).
 * POST /api/liquidaciones
 */

const express = require('express');
const { body } = require('express-validator');

const { autenticar } = require('../middlewares/auth');
const { roles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validate');
const { errores } = require('../utils/errors');
const liquidacionController = require('../controllers/liquidacion.controller');

const router = express.Router();

/**
 * Verificacion cruzada: exactamente uno de { idApuesta, idEvento }.
 * Se implementa como middleware propio para no depender de validadores de
 * cuerpo completo de express-validator.
 */
function exigirUnCriterio(req, res, next) {
  const tieneApuesta = req.body.idApuesta !== undefined && req.body.idApuesta !== null && req.body.idApuesta !== '';
  const tieneEvento = req.body.idEvento !== undefined && req.body.idEvento !== null && req.body.idEvento !== '';

  if (tieneApuesta === tieneEvento) {
    return next(
      errores.solicitudInvalida(
        'Indique idApuesta o idEvento, pero no ambos.',
        'CRITERIO_EXCLUYENTE',
      ),
    );
  }
  return next();
}

router.post(
  '/',
  autenticar,
  roles('administrador'),
  [
    body('idApuesta')
      .optional()
      .isInt({ min: 1 })
      .withMessage('idApuesta debe ser un entero positivo.'),
    body('idEvento')
      .optional()
      .isInt({ min: 1 })
      .withMessage('idEvento debe ser un entero positivo.'),
  ],
  validar,
  exigirUnCriterio,
  liquidacionController.liquidar,
);

module.exports = router;
