'use strict';

const express = require('express');
const { autenticar } = require('../middlewares/auth');
const { roles } = require('../middlewares/roles');
const driveController = require('../controllers/drive.controller');

const router = express.Router();

router.get('/drive/autorizar', autenticar, roles('administrador'), driveController.autorizar);
router.get('/drive/callback', driveController.callback);

module.exports = router;
