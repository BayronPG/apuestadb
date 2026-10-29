'use strict';

/**
 * Servicio de AUTENTICACION.
 * Reglas de negocio: registro con hash bcrypt, inicio de sesion con
 * verificacion bcrypt en el backend, recuperacion de contrasena con token y
 * emision/validacion de JWT.
 *
 * DECISION IMPORTANTE (ver docs/backend/ARQUITECTURA.md):
 * usp_Auth_IniciarSesion compara el hash por IGUALDAD, lo que es incompatible
 * con bcrypt (sal aleatoria por hash). Por eso el login NO invoca ese
 * procedimiento: lee la credencial con una consulta parametrizada, verifica con
 * bcrypt.compare, audita el intento con usp_Auditoria_Registrar y emite el JWT.
 */

const usuarioRepository = require('../repositories/usuario.repository');
const auditoriaService = require('./auditoria.service');
const { hashearContrasena, verificarContrasena } = require('../utils/hash');
const { firmarToken } = require('../utils/jwt');
const { errores } = require('../utils/errors');
const config = require('../config');

const OPERACION = {
  registro: 'Registrar usuario',
  inicioSesion: 'INICIO_SESION',
  recuperacion: 'Solicitar recuperacion',
  restablecer: 'Restablecer contrasena',
};

/**
 * Registra un usuario nuevo. El hash se calcula aqui con bcrypt y se envia al
 * procedimiento como @contrasena_hash (la contrasena plana nunca se propaga).
 */
async function registrar({ nombres, apellidos, correo, contrasena, telefono = null }) {
  const contrasenaHash = await hashearContrasena(contrasena);

  const resultado = await usuarioRepository.registrar({
    nombres,
    apellidos,
    correo,
    contrasenaHash,
    telefono,
  });

  return {
    idUsuario: resultado.idUsuario,
    mensaje: resultado.mensaje || 'Usuario registrado correctamente.',
  };
}

/**
 * Inicia sesion y devuelve el token JWT.
 * @param {{correo:string, contrasena:string}} credenciales
 * @param {{direccionOrigen?:string|null}} contexto
 */
async function iniciarSesion({ correo, contrasena }, contexto = {}) {
  const direccionOrigen = contexto.direccionOrigen || null;
  const credencial = await usuarioRepository.buscarCredencialesPorCorreo(correo);

  if (!credencial) {
    await auditoriaService.registrarSeguro({
      operacion: OPERACION.inicioSesion,
      entidadAfectada: 'Usuario',
      resultado: 'fallo',
      descripcion: 'Correo no encontrado.',
      direccionOrigen,
    });
    throw errores.noAutenticado('Credenciales invalidas.', 'CREDENCIALES_INVALIDAS');
  }

  if (credencial.estado !== 'activo') {
    await auditoriaService.registrarSeguro({
      operacion: OPERACION.inicioSesion,
      entidadAfectada: 'Usuario',
      resultado: 'fallo',
      idUsuario: credencial.id_usuario,
      descripcion: 'Usuario inhabilitado.',
      direccionOrigen,
    });
    throw errores.prohibido('El usuario esta inhabilitado.', 'USUARIO_INHABILITADO');
  }

  const contrasenaValida = await verificarContrasena(contrasena, credencial.contrasena);

  if (!contrasenaValida) {
    await auditoriaService.registrarSeguro({
      operacion: OPERACION.inicioSesion,
      entidadAfectada: 'Usuario',
      resultado: 'fallo',
      idUsuario: credencial.id_usuario,
      descripcion: 'Contrasena incorrecta.',
      direccionOrigen,
    });
    throw errores.noAutenticado('Credenciales invalidas.', 'CREDENCIALES_INVALIDAS');
  }

  if (config.auditoria.registrarAccesos) {
    await auditoriaService.registrarSeguro({
      operacion: OPERACION.inicioSesion,
      entidadAfectada: 'Usuario',
      resultado: 'exito',
      idUsuario: credencial.id_usuario,
      descripcion: 'Acceso correcto.',
      direccionOrigen,
    });
  }

  const token = firmarToken({
    idUsuario: credencial.id_usuario,
    rol: credencial.nombre_rol,
  });

  return {
    token,
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

/**
 * Solicita un token de recuperacion (validez 30 minutos, definida en el SP).
 * En un entorno real el token se enviaria por correo; aqui se devuelve para
 * poder probar el flujo academico completo.
 */
async function solicitarRecuperacion({ correo }) {
  const resultado = await usuarioRepository.solicitarTokenRecuperacion(correo);
  return {
    valorToken: resultado.valorToken,
    mensaje: resultado.mensaje || 'Token generado (vigencia 30 minutos).',
  };
}

/** Restablece la contrasena con un token vigente; el hash lo calcula el backend. */
async function restablecerContrasena({ correo, valorToken, nuevaContrasena }) {
  const nuevaContrasenaHash = await hashearContrasena(nuevaContrasena);

  const resultado = await usuarioRepository.restablecerContrasena({
    correo,
    valorToken,
    nuevaContrasenaHash,
  });

  return { mensaje: resultado.mensaje || 'Contrasena restablecida correctamente.' };
}

module.exports = { registrar, iniciarSesion, solicitarRecuperacion, restablecerContrasena };
