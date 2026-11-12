'use strict';

const { manejarAsync } = require('../utils/asyncHandler');
const twofactorService = require('../services/twofactor.service');

function direccionOrigen(req) {
  return req.ip || (req.socket && req.socket.remoteAddress) || null;
}

const estado = manejarAsync(async (req, res) => {
  const datos = await twofactorService.estado(req.usuario.id);
  return res.status(200).json({ ok: true, data: datos });
});

const configurar = manejarAsync(async (req, res) => {
  const datos = await twofactorService.configurar(req.usuario.id, {
    direccionOrigen: direccionOrigen(req),
  });
  return res.status(200).json({ ok: true, data: datos });
});

const activar = manejarAsync(async (req, res) => {
  const datos = await twofactorService.activar(req.usuario.id, req.body.codigo, {
    direccionOrigen: direccionOrigen(req),
  });
  return res.status(200).json({ ok: true, data: datos });
});

const desactivar = manejarAsync(async (req, res) => {
  const datos = await twofactorService.desactivar(
    req.usuario.id,
    { contrasena: req.body.contrasena, codigo: req.body.codigo },
    { direccionOrigen: direccionOrigen(req) },
  );
  return res.status(200).json({ ok: true, data: datos });
});

module.exports = { estado, configurar, activar, desactivar };
