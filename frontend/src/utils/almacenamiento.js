/**
 * Utilidades de persistencia de sesion en localStorage.
 *
 * Solo se guardan el token JWT y el objeto publico del usuario que devuelve
 * `POST /api/auth/login`. Nunca se guarda la contrasena ni datos de la base.
 */

const CLAVE_TOKEN = 'apuestadb.token';
const CLAVE_USUARIO = 'apuestadb.usuario';

/** Lee el token de la sesion. @returns {string|null} */
export function obtenerToken() {
  try {
    return window.localStorage.getItem(CLAVE_TOKEN);
  } catch (error) {
    console.warn('[sesion] No se pudo leer el token:', error.message);
    return null;
  }
}

/** Guarda el token de la sesion. */
export function guardarToken(token) {
  try {
    window.localStorage.setItem(CLAVE_TOKEN, token);
  } catch (error) {
    console.warn('[sesion] No se pudo guardar el token:', error.message);
  }
}

/** Lee el usuario de la sesion. @returns {object|null} */
export function obtenerUsuario() {
  try {
    const crudo = window.localStorage.getItem(CLAVE_USUARIO);
    return crudo ? JSON.parse(crudo) : null;
  } catch (error) {
    console.warn('[sesion] No se pudo leer el usuario:', error.message);
    return null;
  }
}

/** Guarda el usuario de la sesion. */
export function guardarUsuario(usuario) {
  try {
    window.localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
  } catch (error) {
    console.warn('[sesion] No se pudo guardar el usuario:', error.message);
  }
}

/** Elimina token y usuario (cierre de sesion o 401). */
export function limpiarSesion() {
  try {
    window.localStorage.removeItem(CLAVE_TOKEN);
    window.localStorage.removeItem(CLAVE_USUARIO);
  } catch (error) {
    console.warn('[sesion] No se pudo limpiar la sesion:', error.message);
  }
}

export const CLAVES_SESION = { token: CLAVE_TOKEN, usuario: CLAVE_USUARIO };
