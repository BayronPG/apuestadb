'use strict';

/**
 * Emision y verificacion de JSON Web Tokens.
 * Payload: { sub: id_usuario, rol: 'usuario' | 'administrador' }.
 * La expiracion es configurable con JWT_EXPIRES_IN.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { errores } = require('./errors');

/**
 * Firma el token de sesion.
 * @param {{idUsuario:number, rol:string}} sesion Datos minimos de la sesion.
 */
function firmarToken(sesion) {
  return jwt.sign({ sub: sesion.idUsuario, rol: sesion.rol, tipo: 'acceso' }, config.jwt.secreto, {
    expiresIn: config.jwt.expiracion,
    issuer: config.jwt.emisor,
  });
}

/** Token temporal que solo autoriza completar el segundo factor. */
function firmarTokenDesafio(sesion) {
  return jwt.sign({ sub: sesion.idUsuario, rol: sesion.rol, tipo: '2fa' }, config.jwt.secreto, {
    expiresIn: '5m',
    issuer: config.jwt.emisor,
  });
}

function verificarTokenDesafio(token) {
  try {
    const payload = jwt.verify(token, config.jwt.secreto, { issuer: config.jwt.emisor });
    if (payload.tipo !== '2fa') throw new Error('tipo invalido');
    return { idUsuario: Number(payload.sub), rol: payload.rol };
  } catch (_error) {
    throw errores.noAutenticado('El desafio 2FA expiro o no es valido.', 'TOTP_DESAFIO_INVALIDO');
  }
}

/**
 * Verifica la firma, el emisor y la vigencia del token.
 * @throws {ErrorApi} 401 si el token es invalido o expiro.
 */
function verificarToken(token) {
  try {
    const payload = jwt.verify(token, config.jwt.secreto, { issuer: config.jwt.emisor });
    if (payload.tipo === '2fa') {
      throw errores.noAutenticado('Se requiere completar el segundo factor.', 'TOTP_REQUERIDO');
    }
    return { idUsuario: Number(payload.sub), rol: payload.rol };
  } catch (error) {
    if (error && error.esOperacional) throw error;
    if (error && error.name === 'TokenExpiredError') {
      throw errores.noAutenticado('La sesion expiro. Vuelva a iniciar sesion.', 'TOKEN_EXPIRADO');
    }
    throw errores.noAutenticado('Token invalido.', 'TOKEN_INVALIDO');
  }
}

/** Extrae el token de un encabezado "Authorization: Bearer <token>". */
function extraerToken(encabezado) {
  if (!encabezado || typeof encabezado !== 'string') return null;
  const partes = encabezado.split(' ');
  if (partes.length !== 2) return null;
  const [esquema, token] = partes;
  if (esquema.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

module.exports = { firmarToken, firmarTokenDesafio, verificarTokenDesafio, verificarToken, extraerToken };
