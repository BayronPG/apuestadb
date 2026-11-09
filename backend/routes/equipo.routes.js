'use strict';

/**
 * Rutas de EQUIPO (catalogo MySQL, Fase 15).
 * GET /api/equipos/:id/jugadores (usuario autenticado)
 */

const express = require('express');
const { param } = require('express-validator');

const { autenticar } = require('../middlewares/auth');
const { roles } = require('../middlewares/roles');
const { errores } = require('../utils/errors');
const { validar } = require('../middlewares/validate');
const jugadorController = require('../controllers/jugador.controller');
const equipoController = require('../controllers/equipo.controller');
const multer = require('multer');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
function cargarLogo(req, res, next) {
  upload.single('logo')(req, res, (error) => {
    if (error && error.code === 'LIMIT_FILE_SIZE') {
      return next(errores.solicitudInvalida('El logo no puede superar 5 MB.', 'LOGO_TAMANO_EXCEDIDO'));
    }
    return next(error);
  });
}

router.get('/', autenticar, equipoController.listar);

router.post(
  '/:id/logo',
  autenticar,
  roles('administrador'),
  cargarLogo,
  [param('id').isInt({ min: 1 }).withMessage('El identificador del equipo no es valido.')],
  validar,
  equipoController.subirLogo,
);

router.get(
  '/:id/jugadores',
  autenticar,
  [param('id').isInt({ min: 1 }).withMessage('El identificador del equipo no es valido.')],
  validar,
  jugadorController.listarPorEquipo,
);

module.exports = router;
