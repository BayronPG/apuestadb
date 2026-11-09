'use strict';

/**
 * Servicio de USUARIOS (consultas administrativas).
 */

const usuarioRepository = require('../repositories/usuario.repository');
const { errores } = require('../utils/errors');

function perfilSeguro(perfil) {
  if (!perfil) return null;
  return {
    idUsuario: perfil.id_usuario,
    nombres: perfil.nombres,
    apellidos: perfil.apellidos,
    correo: perfil.correo,
    telefono: perfil.telefono,
    rol: perfil.rol,
  };
}

async function obtenerPerfil(idUsuario) {
  const perfil = await usuarioRepository.obtenerPerfil(idUsuario);
  if (!perfil) {
    throw errores.noEncontrado('El usuario no existe.', 'USUARIO_NO_ENCONTRADO');
  }
  return perfilSeguro(perfil);
}

async function actualizarPerfil({ idUsuario, cambios }) {
  const perfil = await usuarioRepository.actualizarPerfil({ idUsuario, cambios });
  if (!perfil) {
    throw errores.noEncontrado('El usuario no existe.', 'USUARIO_NO_ENCONTRADO');
  }
  return perfilSeguro(perfil);
}

/**
 * Lista usuarios con rol y saldo consolidado.
 * @param {{estado?:string|null, rol?:string|null, limite?:number}} filtros
 */
async function listar({ estado = null, rol = null, limite = 200 } = {}) {
  return usuarioRepository.listar({ estado, rol, limite });
}

module.exports = { listar, obtenerPerfil, actualizarPerfil };
