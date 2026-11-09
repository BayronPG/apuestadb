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

test('callback persiste refresh token en archivo local sin exponerlo', async () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const archivoEnv = path.join(os.tmpdir(), `apuestadb-drive-${process.pid}.env`);
  fs.writeFileSync(archivoEnv, 'OTRA=1\n', 'utf8');

  const anterior = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const oauthClient = {
    getToken: async () => ({ tokens: { refresh_token: 'refresh-persistido' } }),
  };
  await service.completarAutorizacion('codigo', { oauthClient, rutaEnv: archivoEnv });

  const contenido = fs.readFileSync(archivoEnv, 'utf8');
  assert.match(contenido, /^GOOGLE_DRIVE_REFRESH_TOKEN=refresh-persistido$/m);
  assert.equal(process.env.GOOGLE_DRIVE_REFRESH_TOKEN, 'refresh-persistido');

  process.env.GOOGLE_DRIVE_REFRESH_TOKEN = anterior;
  fs.rmSync(archivoEnv, { force: true });
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
  };
  const repository = {
    actualizarLogo: async (idEquipo, logo) => ({
      id_equipo: idEquipo, nombre: 'Equipo', logo_file_id: logo.fileId, logo_url: logo.url,
    }),
  };
  const resultado = await service.subirLogo(9, archivo(), { driveApi, repository });
  assert.equal(Object.prototype.hasOwnProperty.call(resultado, 'fileId'), false);
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

test('normaliza nombres quitando extension, adornos, tildes y separadores', () => {
  assert.equal(service.normalizarNombre('Logo_Fútbol-Club Águilas.PNG'), 'futbol club aguilas');
});

test('asocia solo coincidencias unicas y reporta omitidos sin fileId', async () => {
  const actualizados = [];
  const driveApi = {
    files: {
      list: async () => ({
        data: {
          files: [
            { id: 'a', name: 'logo Atletico-Nacional.png', mimeType: 'image/png', webViewLink: 'https://drive/a' },
            { id: 'b', name: 'escudo Desconocido.jpg', mimeType: 'image/jpeg', webViewLink: 'https://drive/b' },
            { id: 'c', name: 'Footylogos Tigres.webp', mimeType: 'image/webp', webViewLink: 'https://drive/c' },
          ],
        },
      }),
    },
  };
  const repository = {
    listarParaAsociar: async () => [
      { id_equipo: 1, nombre: 'Atlético Nacional' },
      { id_equipo: 2, nombre: 'Tigres' },
      { id_equipo: 3, nombre: 'Tigres' },
    ],
    actualizarLogo: async (idEquipo, logo) => actualizados.push({ idEquipo, logo }),
  };
  const reporte = await service.asociarLogos({ driveApi, repository });
  assert.equal(reporte.asociados, 1);
  assert.deepEqual(actualizados.map((item) => item.idEquipo), [1]);
  assert.deepEqual(reporte.omitidos.map((item) => item.razon), ['SIN_COINCIDENCIA', 'COINCIDENCIA_AMBIGUA']);
  assert.equal(JSON.stringify(reporte).includes('fileId'), false);
});
