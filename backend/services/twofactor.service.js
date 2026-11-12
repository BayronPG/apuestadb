'use strict';

/** Segundo factor TOTP (Google Authenticator / Microsoft Authenticator). */

const crypto = require('crypto');
const QRCode = require('qrcode');
const { generateSecret, generateURI, verify } = require('otplib');

const config = require('../config');
const repo = require('../repositories/twofactor.repository');
const usuarioRepository = require('../repositories/usuario.repository');
const auditoriaService = require('./auditoria.service');
const { verificarContrasena } = require('../utils/hash');
const { firmarToken, firmarTokenDesafio, verificarTokenDesafio } = require('../utils/jwt');
const { errores } = require('../utils/errors');

const OPERACION = {
  configurar: '2FA_CONFIGURAR',
  activar: '2FA_ACTIVAR',
  verificar: '2FA_VERIFICAR',
  desactivar: '2FA_DESHABILITAR',
};

function claveCifrado() {
  const raw = config.totp.encryptionKey;
  if (!raw) throw errores.noDisponible('2FA no configurado.', 'TOTP_NO_CONFIGURADO');
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw errores.noDisponible('2FA no configurado.', 'TOTP_NO_CONFIGURADO');
  return key;
}

function cifrar(texto) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', claveCifrado(), iv);
  const datos = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), datos]);
}

function descifrar(buffer) {
  try {
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const datos = buffer.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', claveCifrado(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(datos), decipher.final()]).toString('utf8');
  } catch (_error) {
    throw errores.interno('No fue posible leer el secreto 2FA.', 'TOTP_SECRETO_INVALIDO');
  }
}

async function auditar({ operacion, resultado, idUsuario, descripcion, direccionOrigen }) {
  await auditoriaService.registrarSeguro({
    operacion,
    entidadAfectada: 'Usuario2FA',
    resultado,
    idUsuario,
    descripcion,
    direccionOrigen,
  });
}

async function verificarCodigo(idUsuario, codigo, { direccionOrigen = null } = {}) {
  const fila = await repo.obtener(idUsuario);
  if (!fila || !fila.secreto_cifrado) {
    throw errores.conflicto('El usuario no tiene 2FA configurado.', 'TOTP_NO_CONFIGURADO');
  }
  if (fila.bloqueado_hasta && new Date(fila.bloqueado_hasta) > new Date()) {
    throw errores.demasiadasSolicitudes('Demasiados intentos. Espere 5 minutos.', 'TOTP_BLOQUEADO');
  }

  const secreto = descifrar(Buffer.from(fila.secreto_cifrado));
  const resultado = await verify({
    secret: secreto,
    token: String(codigo || '').trim(),
    epochTolerance: config.totp.windowSeconds,
  });

  if (!resultado.valid) {
    const fallo = await repo.registrarFallo(
      idUsuario,
      config.totp.maxIntentos,
      config.totp.bloqueoMinutos,
    );
    await auditar({
      operacion: OPERACION.verificar,
      resultado: 'fallo',
      idUsuario,
      descripcion: 'Codigo TOTP invalido.',
      direccionOrigen,
    });
    const bloqueado = fallo && fallo.bloqueado_hasta && new Date(fallo.bloqueado_hasta) > new Date();
    if (bloqueado) {
      throw errores.demasiadasSolicitudes('Demasiados intentos. Espere 5 minutos.', 'TOTP_BLOQUEADO');
    }
    throw errores.solicitudInvalida('Codigo 2FA invalido.', 'TOTP_INVALIDO');
  }

  await repo.registrarExito(idUsuario);
  return true;
}

async function configurar(idUsuario, { direccionOrigen = null } = {}) {
  const usuario = await usuarioRepository.obtenerPerfil(idUsuario);
  if (!usuario) throw errores.noEncontrado('Usuario no encontrado.', 'USUARIO_NO_ENCONTRADO');
  if (await repo.estaHabilitado(idUsuario)) {
    throw errores.conflicto('2FA ya esta activo.', 'TOTP_YA_ACTIVO');
  }

  const secreto = generateSecret();
  await repo.guardarPendiente({ idUsuario, secretoCifrado: cifrar(secreto) });
  const otpauth = generateURI({
    issuer: config.totp.issuer,
    label: usuario.correo,
    secret: secreto,
  });
  const qr = await QRCode.toDataURL(otpauth, { width: 240, margin: 1, errorCorrectionLevel: 'M' });

  await auditar({
    operacion: OPERACION.configurar,
    resultado: 'exito',
    idUsuario,
    descripcion: 'Secreto TOTP generado.',
    direccionOrigen,
  });

  return { secreto, otpauth, qr };
}

async function activar(idUsuario, codigo, { direccionOrigen = null } = {}) {
  const fila = await repo.obtener(idUsuario);
  if (!fila || !fila.secreto_cifrado) {
    throw errores.conflicto('Primero configure el 2FA.', 'TOTP_NO_CONFIGURADO');
  }
  if (fila.habilitado) throw errores.conflicto('2FA ya esta activo.', 'TOTP_YA_ACTIVO');

  await verificarCodigo(idUsuario, codigo, { direccionOrigen });
  await repo.activar(idUsuario);
  await auditar({
    operacion: OPERACION.activar,
    resultado: 'exito',
    idUsuario,
    descripcion: '2FA activado.',
    direccionOrigen,
  });
  return { habilitado: true, mensaje: '2FA activado correctamente.' };
}

async function desactivar(idUsuario, { contrasena, codigo }, { direccionOrigen = null } = {}) {
  const credencial = await usuarioRepository.buscarCredencialesPorId(idUsuario);
  if (!credencial) throw errores.noEncontrado('Usuario no encontrado.', 'USUARIO_NO_ENCONTRADO');
  if (!(await verificarContrasena(contrasena, credencial.contrasena))) {
    await auditar({
      operacion: OPERACION.desactivar,
      resultado: 'fallo',
      idUsuario,
      descripcion: 'Contrasena incorrecta al desactivar 2FA.',
      direccionOrigen,
    });
    throw errores.noAutenticado('Contrasena incorrecta.', 'CREDENCIALES_INVALIDAS');
  }
  if (!(await repo.estaHabilitado(idUsuario))) {
    throw errores.conflicto('2FA no esta activo.', 'TOTP_NO_ACTIVO');
  }

  await verificarCodigo(idUsuario, codigo, { direccionOrigen });
  await repo.desactivar(idUsuario);
  await auditar({
    operacion: OPERACION.desactivar,
    resultado: 'exito',
    idUsuario,
    descripcion: '2FA desactivado.',
    direccionOrigen,
  });
  return { habilitado: false, mensaje: '2FA desactivado correctamente.' };
}

async function estado(idUsuario) {
  const fila = await repo.obtener(idUsuario);
  return {
    habilitado: Boolean(fila && fila.habilitado),
    fechaActivacion: fila ? fila.fecha_activacion : null,
  };
}

async function crearDesafio(idUsuario, rol) {
  if (!(await repo.estaHabilitado(idUsuario))) return null;
  return firmarTokenDesafio({ idUsuario, rol });
}

async function verificarDesafio(challengeToken, codigo, { direccionOrigen = null } = {}) {
  const sesion = verificarTokenDesafio(challengeToken);
  const credencial = await usuarioRepository.buscarCredencialesPorId(sesion.idUsuario);
  if (!credencial || credencial.estado !== 'activo') {
    throw errores.noAutenticado('Usuario no disponible.', 'USUARIO_INHABILITADO');
  }
  if (!(await repo.estaHabilitado(sesion.idUsuario))) {
    throw errores.conflicto('2FA no esta activo.', 'TOTP_NO_ACTIVO');
  }

  await verificarCodigo(sesion.idUsuario, codigo, { direccionOrigen });
  await auditar({
    operacion: OPERACION.verificar,
    resultado: 'exito',
    idUsuario: sesion.idUsuario,
    descripcion: 'Segundo factor validado.',
    direccionOrigen,
  });

  return {
    token: firmarToken({ idUsuario: sesion.idUsuario, rol: credencial.nombre_rol }),
    expiraEn: config.jwt.expiracion,
    usuario: {
      idUsuario: credencial.id_usuario,
      nombres: credencial.nombres,
      apellidos: credencial.apellidos,
      correo: credencial.correo,
      telefono: credencial.telefono,
      rol: credencial.nombre_rol,
    },
  };
}

async function resetPorRecuperacion(idUsuario, { direccionOrigen = null } = {}) {
  await repo.desactivar(idUsuario);
  await auditar({
    operacion: '2FA_RESET_RECUPERACION',
    resultado: 'exito',
    idUsuario,
    descripcion: '2FA desactivado por recuperacion de contrasena.',
    direccionOrigen,
  });
  return { habilitado: false };
}

module.exports = {
  configurar,
  activar,
  desactivar,
  estado,
  crearDesafio,
  verificarDesafio,
  resetPorRecuperacion,
};
