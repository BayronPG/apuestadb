import api, { desenvolver } from './api.js';

/**
 * Servicio de AUTENTICACION (endpoints publicos).
 *   POST /api/auth/registro
 *   POST /api/auth/login
 *   POST /api/auth/recuperar
 *   POST /api/auth/restablecer
 */

/** POST /api/auth/login -> { token, expiraEn, usuario } */
export async function iniciarSesion({ correo, contrasena }) {
  const respuesta = await api.post('/auth/login', { correo, contrasena });
  return desenvolver(respuesta);
}

/** POST /api/auth/registro -> { idUsuario, mensaje } (201) */
export async function registrarUsuario({ nombres, apellidos, correo, contrasena, telefono }) {
  const cuerpo = { nombres, apellidos, correo, contrasena };
  if (telefono) cuerpo.telefono = telefono;
  const respuesta = await api.post('/auth/registro', cuerpo);
  return desenvolver(respuesta);
}

/** POST /api/auth/recuperar -> { valorToken, mensaje } */
export async function solicitarRecuperacion({ correo }) {
  const respuesta = await api.post('/auth/recuperar', { correo });
  return desenvolver(respuesta);
}

/** POST /api/auth/restablecer -> { mensaje } */
export async function restablecerContrasena({ correo, valorToken, nuevaContrasena }) {
  const respuesta = await api.post('/auth/restablecer', { correo, valorToken, nuevaContrasena });
  return desenvolver(respuesta);
}
