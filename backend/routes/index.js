'use strict';

/**
 * Router raiz de la API. Monta un router por recurso bajo el prefijo /api.
 */

const express = require('express');

const router = express.Router();

router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/usuarios', require('./usuario.routes'));
router.use('/saldo', require('./saldo.routes'));
router.use('/recargas', require('./recarga.routes'));
router.use('/apuestas', require('./apuesta.routes'));
router.use('/liquidaciones', require('./liquidacion.routes'));
router.use('/eventos', require('./evento.routes'));
router.use('/notificaciones', require('./notificacion.routes'));
router.use('/reportes', require('./reporte.routes'));
router.use('/auditoria', require('./auditoria.routes'));

module.exports = router;
