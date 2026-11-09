'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-with-at-least-32-characters';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-client';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret';
process.env.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'https://example.test/callback';
process.env.GOOGLE_DRIVE_CALLBACK_URL = process.env.GOOGLE_DRIVE_CALLBACK_URL || 'https://example.test/drive-callback';
process.env.GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || 'test-folder';
process.env.GOOGLE_DRIVE_REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || 'test-refresh';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../app');
const { firmarToken } = require('../utils/jwt');
const driveService = require('../services/drive.service');

let servidor;
let baseUrl;

test.before(async () => {
  servidor = await new Promise((resolve) => {
    const instancia = app.listen(0, () => resolve(instancia));
  });
  baseUrl = `http://127.0.0.1:${servidor.address().port}`;
});

test.after(() => new Promise((resolve) => servidor.close(resolve)));

async function solicitar(ruta, rol) {
  const headers = rol ? { Authorization: `Bearer ${firmarToken({ idUsuario: 1, rol })}` } : {};
  return fetch(`${baseUrl}${ruta}`, { headers });
}

test('Drive autorizar exige autenticacion y rol administrador', async () => {
  assert.equal((await solicitar('/api/integraciones/drive/autorizar')).status, 401);
  assert.equal((await solicitar('/api/integraciones/drive/autorizar', 'usuario')).status, 403);
});

test('admin recibe authorizationUrl JSON sin JWT en query string', async () => {
  const respuesta = await solicitar('/api/integraciones/drive/autorizar', 'administrador');
  const cuerpo = await respuesta.json();
  assert.equal(respuesta.status, 200);
  assert.equal(typeof cuerpo.data.authorizationUrl, 'string');
  assert.equal(cuerpo.data.authorizationUrl.includes('jwt'), false);
  assert.equal(cuerpo.data.authorizationUrl.includes('token='), false);
});

test('callback con state invalido es rechazado', async () => {
  const respuesta = await fetch(`${baseUrl}/api/integraciones/drive/callback?state=incorrecto&code=mock`);
  assert.equal(respuesta.status, 400);
});

test('callback correcto consume state y no entrega refresh token', async () => {
  const autorizacion = await solicitar('/api/integraciones/drive/autorizar', 'administrador');
  const cookie = autorizacion.headers.get('set-cookie').split(';', 1)[0];
  const url = new URL((await autorizacion.json()).data.authorizationUrl);
  const original = driveService.completarAutorizacion;
  driveService.completarAutorizacion = async () => true;
  try {
    const respuesta = await fetch(
      `${baseUrl}/api/integraciones/drive/callback?state=${encodeURIComponent(url.searchParams.get('state'))}&code=mock`,
      { headers: { Cookie: cookie }, redirect: 'manual' },
    );
    assert.equal(respuesta.status, 302);
    assert.equal(respuesta.headers.get('location').includes('token'), false);
    assert.equal(respuesta.headers.get('set-cookie').includes('Max-Age=0'), true);
  } finally {
    driveService.completarAutorizacion = original;
  }
});
