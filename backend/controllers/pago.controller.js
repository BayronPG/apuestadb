'use strict';

const { manejarAsync } = require('../utils/asyncHandler');
const wompiService = require('../services/wompi.service');

const checkout = manejarAsync(async (req, res) => {
  const { idTipoSaldo, monto } = req.body;
  const datos = await wompiService.crearCheckout({
    idUsuario: req.usuario.id,
    idTipoSaldo: Number(idTipoSaldo),
    monto,
  });
  return res.status(201).json({ ok: true, data: datos });
});

const webhook = manejarAsync(async (req, res) => {
  const resultado = await wompiService.procesarEvento(req.body);
  return res.status(200).json({ ok: true, data: resultado });
});

const estado = manejarAsync(async (req, res) => {
  const datos = await wompiService.consultarPago(req.params.referencia, req.usuario);
  return res.status(200).json({ ok: true, data: datos });
});

module.exports = { checkout, webhook, estado };
