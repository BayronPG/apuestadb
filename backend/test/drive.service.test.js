'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-with-at-least-32-characters';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-client';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret';
process.env.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'https://example.test/callback';
process.env.GOOGLE_DRIVE_CALLBACK_URL = process.env.GOOGLE_DRIVE_CALLBACK_URL || 'https://example.test/drive-callback';
process.env.GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || 'test-folder';
process.env.GOOGLE_DRIVE_REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || 'test-refresh';

const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../services/drive.service');

const archivo = (mimetype = 'image/png', size = 10) => ({
  mimetype,
  size,
  buffer: Buffer.alloc(size),
});

test('valida formato y tamaño de logos', () => {
  assert.doesNotThrow(() => service.validarArchivo(archivo('image/webp')));
  assert.throws(() => service.validarArchivo(archivo('image/gif')), { codigo: 'LOGO_FORMATO_INVALIDO' });
  assert.throws(() => service.validarArchivo(archivo('image/png', 5 * 1024 * 1024 + 1)), { codigo: 'LOGO_TAMANO_EXCEDIDO' });
});

test('OAuth Drive usa state y proveedor mock', async () => {
  const state = service.crearState();
  assert.equal(service.validarState(state, state), true);
  const oauthClient = { getToken: async () => ({ tokens: { access_token: 'interno' } }) };
  assert.equal(await service.completarAutorizacion('codigo', { oauthClient }), true);
});

test('sube logo, guarda fileId/url y no retorna tokens', async () => {
  const llamadas = [];
  const driveApi = {
    files: {
      create: async (opciones) => {
        llamadas.push(opciones);
        return { data: { id: 'file-123' } };
      },
    },
    permissions: { create: async () => ({}) },
  };
  const repository = {
    actualizarLogo: async (idEquipo, logo) => ({
      id_equipo: idEquipo, nombre: 'Equipo', logo_file_id: logo.fileId, logo_url: logo.url,
    }),
  };
  const resultado = await service.subirLogo(9, archivo(), { driveApi, repository });
  assert.equal(resultado.fileId, 'file-123');
  assert.equal(Object.prototype.hasOwnProperty.call(resultado, 'access_token'), false);
  assert.equal(llamadas.length, 1);
});

test('reporta proveedor Drive caído', async () => {
  const driveApi = { files: { create: async () => { throw new Error('caido'); } } };
  await assert.rejects(() => service.subirLogo(9, archivo(), {
    driveApi,
    repository: { actualizarLogo: async () => null },
  }), { codigo: 'DRIVE_PROVEEDOR_NO_DISPONIBLE' });
});
