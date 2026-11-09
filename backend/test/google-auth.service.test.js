'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-with-at-least-32-characters';
const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../services/google-auth.service');

test('state seguro se valida y rechaza alteraciones', () => {
  const state = service.crearState(100000);
  assert.equal(service.validarState(state, state, 100001), true);
  assert.equal(service.validarState(`${state}x`, state, 100001), false);
  assert.equal(service.validarState(state, state, 700001), false);
});

function fetchMock(emailVerified, email = 'ana@example.com') {
  return async (url) => ({
    ok: true,
    json: async () => url.includes('/token') ? { access_token: 'mock-token' } : {
      email, email_verified: emailVerified, given_name: 'Ana', family_name: 'Prueba',
    },
  });
}

test('autentica y crea usuario con correo verificado', async () => {
  const repository = {
    buscarCredencialesPorCorreo: async () => null,
    registrar: async () => ({ idUsuario: 7 }),
  };
  const resultado = await service.autenticarGoogle('codigo', { fetchImpl: fetchMock(true), repository });
  assert.equal(resultado.usuario.idUsuario, 7);
  assert.ok(resultado.token);
});

test('rechaza correo no verificado', async () => {
  await assert.rejects(() => service.autenticarGoogle('codigo', { fetchImpl: fetchMock(false), repository: {} }), { codigo: 'GOOGLE_CORREO_NO_VERIFICADO' });
});

test('expone proveedor caido como no disponible', async () => {
  await assert.rejects(() => service.autenticarGoogle('codigo', { fetchImpl: async () => { throw new Error('caido'); }, repository: {} }), { codigo: 'GOOGLE_PROVEEDOR_NO_DISPONIBLE' });
});

test('clasifica un fallo de intercambio de token', async () => {
  await assert.rejects(() => service.autenticarGoogle('codigo', {
    fetchImpl: async () => ({ ok: false, status: 503 }),
    repository: {},
  }), { codigo: 'GOOGLE_PROVEEDOR_NO_DISPONIBLE' });
});

test('no convierte una caida de base de datos en error del proveedor', async () => {
  const repository = { buscarCredencialesPorCorreo: async () => { throw new Error('bd'); } };
  await assert.rejects(
    () => service.autenticarGoogle('codigo', { fetchImpl: fetchMock(true), repository }),
    { codigo: 'GOOGLE_DATABASE_ERROR' },
  );
});

test('conserva state tras recargar el servicio', () => {
  const state = service.crearState();
  delete require.cache[require.resolve('../services/google-auth.service')];
  const recargado = require('../services/google-auth.service');
  assert.equal(recargado.validarState(state, state), true);
});

test('diagnostica por etapa sin incluir query strings', async () => {
  const advertencias = [];
  const originalWarn = console.warn;
  console.warn = (...argumentos) => advertencias.push(argumentos.join(' '));
  try {
    await assert.rejects(() => service.autenticarGoogle('codigo', {
      fetchImpl: async () => { throw new Error('caido?code=secreto'); },
      repository: {},
    }));
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(advertencias.some((linea) => linea.includes('TOKEN_EXCHANGE')), true);
  assert.equal(advertencias.some((linea) => linea.includes('?')), false);
});

test('clasifica un fallo de JWT fuera del proveedor', async () => {
  const config = require('../config');
  const secreto = config.jwt.secreto;
  config.jwt.secreto = '';
  try {
    await assert.rejects(() => service.autenticarGoogle('codigo', {
      fetchImpl: fetchMock(true),
      repository: { buscarCredencialesPorCorreo: async () => ({
        id_usuario: 7, nombres: 'Ana', apellidos: 'Prueba', correo: 'ana@example.com',
        telefono: null, estado: 'activo', nombre_rol: 'usuario',
      }) },
    }), { codigo: 'GOOGLE_JWT_ERROR' });
  } finally {
    config.jwt.secreto = secreto;
  }
});
