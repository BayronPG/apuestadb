'use strict';

const { manejarAsync } = require('../utils/asyncHandler');
const wompiService = require('../services/wompi.service');
const recaptchaService = require('../services/recaptcha.service');
const firestoreService = require('../services/firestore.service');
const pagoRepository = require('../repositories/pago.repository');

const checkout = manejarAsync(async (req, res) => {
  const { idTipoSaldo, monto } = req.body;
  await recaptchaService.verificar(req.body.recaptchaToken, req.ip);
  const datos = await wompiService.crearCheckout({
    idUsuario: req.usuario.id,
    idTipoSaldo: Number(idTipoSaldo),
    monto,
  });
  try {
    await firestoreService.guardarTransaccion({
      idUsuario: req.usuario.id,
      referencia: datos.referencia,
      monto: Number(datos.montoCentavos) / 100,
      estado: 'PENDIENTE',
      fecha: new Date(),
    });
  } catch (_error) {
    // El historial espejo no bloquea el checkout.
  }
  return res.status(201).json({ ok: true, data: datos });
});

const webhook = manejarAsync(async (req, res) => {
  const resultado = await wompiService.procesarEvento(req.body);
  try {
    const referencia = req.body?.data?.transaction?.reference;
    if (referencia) {
      const pago = await pagoRepository.obtener(referencia);
      if (pago) {
        await firestoreService.guardarTransaccion({
          idUsuario: pago.id_usuario,
          referencia: pago.referencia,
          monto: Number(pago.monto_centavos) / 100,
          estado: pago.estado,
          fecha: pago.actualizado || pago.creado,
        });
      }
    }
  } catch (_error) {
    // Firestore es un historial paralelo: nunca bloquea el webhook.
  }
  return res.status(200).json({ ok: true, data: resultado });
});

const estado = manejarAsync(async (req, res) => {
  const datos = await wompiService.consultarPago(req.params.referencia, req.usuario);
  return res.status(200).json({ ok: true, data: datos });
});

const listar = manejarAsync(async (req, res) => {
  const pagos = await wompiService.listarPagos({ idUsuario: req.usuario.id });
  return res.status(200).json({ ok: true, data: { pagos, total: pagos.length } });
});

const listarFirestore = manejarAsync(async (req, res) => {
  const datos = await firestoreService.listarTransacciones(req.usuario.id, 50);
  return res.status(200).json({ ok: true, data: datos });
});

module.exports = { checkout, webhook, estado, listar, listarFirestore };
