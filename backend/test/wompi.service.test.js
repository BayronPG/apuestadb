'use strict';

process.env.NODE_ENV = 'test';
process.env.WOMPI_PUBLIC_KEY = 'pub_test_demo';
process.env.WOMPI_PRIVATE_KEY = 'prv_test_demo';
process.env.WOMPI_EVENTS_SECRET = 'events_test_demo';
process.env.WOMPI_INTEGRITY_SECRET = 'integrity_test_demo';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const service = require('../services/wompi.service');

function payloadAprobado(referencia, centavos, secreto = 'events_test_demo') {
  const data = {
    transaction: {
      id: 'tx-123',
      reference: referencia,
      status: 'APPROVED',
      amount_in_cents: centavos,
      currency: 'COP',
    },
  };
  const propiedades = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  const valores = propiedades.map((ruta) => ruta.split('.').reduce((o, k) => o[k], data));
  const timestamp = 1700000000;
  const checksum = crypto.createHash('sha256').update(`${valores.join('')}${timestamp}${secreto}`).digest('hex');
  return { event: 'transaction.updated', data, timestamp, signature: { properties: propiedades, checksum } };
}

test('firma de integridad determinista', () => {
  const firma = service.firmarIntegridad('APD-1', 500000, 'integrity_test_demo');
  assert.equal(firma.length, 64);
  assert.equal(firma, service.firmarIntegridad('APD-1', 500000, 'integrity_test_demo'));
});

test('URL de checkout incluye monto y referencia', () => {
  const url = service.construirUrlCheckout('APD-2', 123400);
  assert.match(url, /amount-in-cents=123400/);
  assert.match(url, /reference=APD-2/);
  assert.match(url, /public-key=pub_test_demo/);
  assert.match(url, /signature%3Aintegrity=/);
});

test('crear checkout guarda el pago pendiente', async () => {
  let creado = null;
  const repo = { crear: async (datos) => { creado = datos; return datos; } };
  const r = await service.crearCheckout({ idUsuario: 2, idTipoSaldo: 1, monto: 5000 }, { repository: repo });
  assert.equal(creado.montoCentavos, 500000);
  assert.match(r.referencia, /^APD-/);
  assert.match(r.checkoutUrl, /500000/);
});

test('webhook aprobado acredita una sola vez', async () => {
  const pago = { referencia: 'APD-3', id_usuario: 2, id_tipo_saldo: 1, monto_centavos: 500000, moneda: 'COP', estado: 'PENDIENTE' };
  let creditos = 0;
  let aprobado = null;
  const repo = {
    obtener: async () => ({ ...pago, estado: aprobado ? 'APROBADO' : 'PENDIENTE' }),
    marcarAprobado: async (ref, datos) => { aprobado = datos; },
    marcarEstado: async () => {},
  };
  const acreditar = async () => { creditos += 1; };
  const p = payloadAprobado('APD-3', 500000);
  const r1 = await service.procesarEvento(p, { repository: repo, acreditar });
  const r2 = await service.procesarEvento(p, { repository: repo, acreditar });
  assert.equal(r1.estado, 'APROBADO');
  assert.equal(r2.idempotente, true);
  assert.equal(creditos, 1);
});

test('monto distinto rechaza el pago', async () => {
  const repo = {
    obtener: async () => ({ referencia: 'APD-4', id_usuario: 2, id_tipo_saldo: 1, monto_centavos: 1000, moneda: 'COP', estado: 'PENDIENTE' }),
    marcarEstado: async () => {},
    marcarAprobado: async () => {},
  };
  await assert.rejects(
    service.procesarEvento(payloadAprobado('APD-4', 500000), { repository: repo, acreditar: async () => {} }),
    { codigo: 'WOMPI_MONTO_INVALIDO' },
  );
});

test('firma invalida se rechaza', async () => {
  const p = payloadAprobado('APD-5', 500000);
  p.signature.checksum = 'f'.repeat(64);
  await assert.rejects(
    service.procesarEvento(p, { repository: { obtener: async () => null }, acreditar: async () => {} }),
    { codigo: 'WOMPI_FIRMA_INVALIDA' },
  );
});
