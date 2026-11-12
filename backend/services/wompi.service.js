'use strict';

/**
 * Wompi Sandbox/Produccion (MVP).
 * - Checkout por redireccion (Web Checkout) con firma de integridad.
 * - Webhook con verificacion de checksum e idempotencia por transaccion.
 * - Abono reutilizando fn_recarga_crear (clave wompi:<transaction_id>).
 * Nunca registra ni devuelve llaves.
 */

const crypto = require('crypto');
const config = require('../config');
const pagoRepository = require('../repositories/pago.repository');
const postgresql = require('../config/db/postgresql');
const { errores } = require('../utils/errors');

const MONEDA = 'COP';

function habilitado() {
  return Boolean(config.wompi.publicKey && config.wompi.privateKey && config.wompi.eventsSecret);
}

function firmarIntegridad(referencia, montoCentavos, secreto = config.wompi.integritySecret) {
  if (!secreto) return null;
  return crypto
    .createHash('sha256')
    .update(`${referencia}${montoCentavos}${MONEDA}${secreto}`)
    .digest('hex');
}

function construirUrlCheckout(referencia, montoCentavos) {
  const params = new URLSearchParams({
    'public-key': config.wompi.publicKey,
    currency: MONEDA,
    'amount-in-cents': String(montoCentavos),
    reference: referencia,
  });
  const firma = firmarIntegridad(referencia, montoCentavos);
  if (firma) params.set('signature:integrity', firma);
  if (config.wompi.redirectUrl) params.set('redirect-url', config.wompi.redirectUrl);
  return `${config.wompi.checkoutUrl}?${params.toString()}`;
}

function valorPorRuta(objeto, ruta) {
  return ruta.split('.').reduce((actual, clave) => (actual == null ? undefined : actual[clave]), objeto);
}

function calcularChecksum(payload, secreto) {
  const propiedades = (payload && payload.signature && payload.signature.properties) || [];
  const valores = propiedades.map((ruta) => String(valorPorRuta(payload.data, ruta)));
  return crypto.createHash('sha256').update(`${valores.join('')}${payload.timestamp}${secreto}`).digest('hex');
}

function verificarFirma(payload, secreto = config.wompi.eventsSecret) {
  const esperado = payload && payload.signature && payload.signature.checksum;
  if (!esperado || !secreto) return false;
  const calculado = calcularChecksum(payload, secreto);
  const a = Buffer.from(calculado);
  const b = Buffer.from(String(esperado).toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function acreditarSaldo({ idUsuario, idTipoSaldo, montoPesos, clave }) {
  const pool = await postgresql.obtenerPool();
  const { rows } = await pool.query('SELECT * FROM fn_recarga_crear($1, $2, $3, $4, $5, $6)', [
    idUsuario,
    idTipoSaldo,
    montoPesos,
    null,
    'Recarga Wompi Sandbox',
    clave,
  ]);
  return rows[0];
}

async function crearCheckout({ idUsuario, idTipoSaldo, monto }, { repository = pagoRepository } = {}) {
  if (!habilitado()) throw errores.noDisponible('Wompi no esta configurado.', 'WOMPI_NO_CONFIGURADO');
  const numero = Number(monto);
  if (!Number.isFinite(numero) || numero <= 0) {
    throw errores.solicitudInvalida('El monto debe ser mayor que cero.', 'MONTO_INVALIDO');
  }
  const montoCentavos = Math.round(numero * 100);
  const referencia = `APD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  await repository.crear({ referencia, idUsuario, idTipoSaldo, montoCentavos });
  return { referencia, montoCentavos, checkoutUrl: construirUrlCheckout(referencia, montoCentavos) };
}

async function procesarEvento(payload, {
  repository = pagoRepository,
  acreditar = acreditarSaldo,
  secreto = config.wompi.eventsSecret,
} = {}) {
  if (!secreto) throw errores.noDisponible('Wompi no esta configurado.', 'WOMPI_NO_CONFIGURADO');
  if (!verificarFirma(payload, secreto)) {
    throw errores.solicitudInvalida('Firma de Wompi invalida.', 'WOMPI_FIRMA_INVALIDA');
  }

  const transaccion = payload.data && payload.data.transaction;
  if (!transaccion || !transaccion.reference || !transaccion.id) {
    throw errores.solicitudInvalida('Evento Wompi incompleto.', 'WOMPI_EVENTO_INVALIDO');
  }

  const pago = await repository.obtener(transaccion.reference);
  if (!pago) throw errores.noEncontrado('Pago no encontrado.', 'PAGO_NO_ENCONTRADO');

  if (pago.estado === 'APROBADO') {
    return { estado: 'APROBADO', idempotente: true };
  }
  if (pago.moneda !== MONEDA || Number(pago.monto_centavos) !== Number(transaccion.amount_in_cents)) {
    await repository.marcarEstado(pago.referencia, 'RECHAZADO', {
      transactionId: transaccion.id,
      payloadHash: payload.signature.checksum,
    });
    throw errores.solicitudInvalida('Monto o moneda no coinciden.', 'WOMPI_MONTO_INVALIDO');
  }

  const eventoId = String(transaccion.id);
  if (pago.evento_id === eventoId && pago.estado === 'APROBADO') {
    return { estado: 'APROBADO', idempotente: true };
  }

  if (transaccion.status === 'APPROVED') {
    await acreditar({
      idUsuario: pago.id_usuario,
      idTipoSaldo: pago.id_tipo_saldo,
      montoPesos: Number(pago.monto_centavos) / 100,
      clave: `wompi:${eventoId}`,
    });
    await repository.marcarAprobado(pago.referencia, {
      transactionId: eventoId,
      eventoId,
      payloadHash: payload.signature.checksum,
    });
    return { estado: 'APROBADO', idempotente: false };
  }

  const estado = ['DECLINED', 'VOIDED', 'ERROR'].includes(transaccion.status) ? 'RECHAZADO' : 'PENDIENTE';
  await repository.marcarEstado(pago.referencia, estado, {
    transactionId: eventoId,
    payloadHash: payload.signature.checksum,
  });
  return { estado, idempotente: false };
}

async function consultarPago(referencia, { idUsuario, rol }, { repository = pagoRepository } = {}) {
  const pago = await repository.obtener(referencia);
  if (!pago) throw errores.noEncontrado('Pago no encontrado.', 'PAGO_NO_ENCONTRADO');
  if (rol !== 'administrador' && Number(pago.id_usuario) !== Number(idUsuario)) {
    throw errores.prohibido('No puede consultar este pago.', 'PAGO_AJENO');
  }
  return {
    referencia: pago.referencia,
    estado: pago.estado,
    monto: Number(pago.monto_centavos) / 100,
    moneda: pago.moneda,
    creado: pago.creado,
  };
}

/** Historial de pagos Wompi del usuario (APROBADO, PENDIENTE, RECHAZADO). */
async function listarPagos({ idUsuario }, { repository = pagoRepository } = {}) {
  const filas = await repository.listarPorUsuario(idUsuario);
  return filas.map((pago) => ({
    referencia: pago.referencia,
    estado: pago.estado,
    monto: Number(pago.monto_centavos) / 100,
    moneda: pago.moneda,
    creado: pago.creado,
    actualizado: pago.actualizado,
  }));
}

module.exports = {
  habilitado,
  firmarIntegridad,
  construirUrlCheckout,
  calcularChecksum,
  verificarFirma,
  crearCheckout,
  procesarEvento,
  consultarPago,
  listarPagos,
};
