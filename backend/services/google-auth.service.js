'use strict';

const crypto = require('crypto');
const config = require('../config');
const usuarioRepository = require('../repositories/usuario.repository');
const { firmarToken } = require('../utils/jwt');
const { errores } = require('../utils/errors');

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO = 'https://openidconnect.googleapis.com/v1/userinfo';
const STATE_TTL_MS = 10 * 60 * 1000;

function habilitado() {
  return Boolean(config.google.clientId && config.google.clientSecret && config.google.callbackUrl);
}

function crearState(now = Date.now()) {
  const payload = `${now}.${crypto.randomBytes(32).toString('base64url')}`;
  const firma = crypto.createHmac('sha256', config.google.stateSecret).update(payload).digest('base64url');
  return `${payload}.${firma}`;
}

function validarState(state, esperado, now = Date.now()) {
  if (!state || !esperado || state !== esperado) return false;
  const partes = state.split('.');
  if (partes.length !== 3 || !/^\d+$/.test(partes[0])) return false;
  if (now - Number(partes[0]) > STATE_TTL_MS || Number(partes[0]) > now + 30_000) return false;
  const payload = partes.slice(0, 2).join('.');
  const firma = crypto.createHmac('sha256', config.google.stateSecret).update(payload).digest('base64url');
  const recibida = Buffer.from(partes[2]);
  const esperada = Buffer.from(firma);
  return recibida.length === esperada.length && crypto.timingSafeEqual(esperada, recibida);
}

function urlAutorizacion(state) {
  const parametros = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH}?${parametros}`;
}

async function autenticarGoogle(
  code,
  { fetchImpl = globalThis.fetch, repository = usuarioRepository } = {},
) {
  if (!code) throw errores.solicitudInvalida('El codigo de Google es obligatorio.', 'GOOGLE_CODE_INVALIDO');
  let tokenResponse;
  try {
    tokenResponse = await fetchImpl(GOOGLE_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.callbackUrl,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) throw new Error(`Token HTTP ${tokenResponse.status}`);
    const tokens = await tokenResponse.json();
    const perfilResponse = await fetchImpl(GOOGLE_USERINFO, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!perfilResponse.ok) throw new Error(`Perfil HTTP ${perfilResponse.status}`);
    const perfil = await perfilResponse.json();
    if (perfil.email_verified !== true && perfil.email_verified !== 'true') {
      throw errores.noAutenticado('Google no ha verificado este correo.', 'GOOGLE_CORREO_NO_VERIFICADO');
    }
    if (!perfil.email) throw errores.noAutenticado('Google no devolvio un correo valido.', 'GOOGLE_CORREO_INVALIDO');

    let usuario = await repository.buscarCredencialesPorCorreo(perfil.email);
    if (!usuario) {
      const nombres = String(perfil.given_name || perfil.name || 'Usuario').slice(0, 100);
      const apellidos = String(perfil.family_name || 'Google').slice(0, 100);
      const creado = await repository.registrar({
        nombres,
        apellidos,
        correo: perfil.email,
        contrasenaHash: crypto.randomBytes(32).toString('hex'),
        telefono: null,
      });
      usuario = {
        id_usuario: creado.idUsuario,
        nombres,
        apellidos,
        correo: perfil.email,
        telefono: null,
        estado: 'activo',
        nombre_rol: 'usuario',
      };
    }
    if (usuario.estado !== 'activo') throw errores.prohibido('El usuario esta inhabilitado.', 'USUARIO_INHABILITADO');
    const token = firmarToken({ idUsuario: usuario.id_usuario, rol: usuario.nombre_rol });
    return {
      token,
      expiraEn: config.jwt.expiracion,
      usuario: {
        idUsuario: usuario.id_usuario,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        telefono: usuario.telefono,
        rol: usuario.nombre_rol,
      },
    };
  } catch (error) {
    if (error && error.esOperacional) throw error;
    throw errores.noDisponible('No fue posible autenticar con Google.', 'GOOGLE_PROVEEDOR_NO_DISPONIBLE');
  }
}

module.exports = { habilitado, crearState, validarState, urlAutorizacion, autenticarGoogle };
