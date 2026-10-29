import axios from 'axios';

import { obtenerToken, limpiarSesion } from '../utils/almacenamiento.js';

/**
 * Instancia unica de Axios para toda la aplicacion.
 *
 * - `baseURL` proviene de `VITE_API_URL` (por defecto `/api`, redirigido por el
 *   proxy de Vite hacia http://localhost:4000 en desarrollo).
 * - Interceptor de REQUEST: agrega `Authorization: Bearer <token>` cuando hay
 *   sesion activa.
 * - Interceptor de RESPONSE: ante 401 limpia la sesion y redirige a /login
 *   (salvo en las rutas publicas de autenticacion, para poder mostrar el error
 *   "credenciales invalidas" en el propio formulario).
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

/** Rutas publicas donde un 401 es un error de credenciales, no de sesion. */
const RUTAS_PUBLICAS = ['/auth/login', '/auth/registro', '/auth/recuperar', '/auth/restablecer'];

let manejadorNoAutorizado = null;

/**
 * Registra la funcion que se ejecuta ante un 401 (la usa AuthContext para
 * cerrar la sesion en memoria sin recargar la pagina).
 * @param {(() => void)|null} fn
 */
export function registrarManejadorNoAutorizado(fn) {
  manejadorNoAutorizado = fn;
}

api.interceptors.request.use((configuracion) => {
  const token = obtenerToken();
  if (token) {
    configuracion.headers = configuracion.headers || {};
    configuracion.headers.Authorization = `Bearer ${token}`;
  }
  return configuracion;
});

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const estado = error && error.response ? error.response.status : null;
    const url = (error && error.config && error.config.url) || '';
    const esRutaPublica = RUTAS_PUBLICAS.some((ruta) => url.includes(ruta));

    if (estado === 401 && !esRutaPublica) {
      limpiarSesion();
      if (typeof manejadorNoAutorizado === 'function') {
        manejadorNoAutorizado();
      } else if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Desempaqueta la envoltura uniforme del backend `{ ok, data }`.
 * @param {import('axios').AxiosResponse} respuesta
 */
export function desenvolver(respuesta) {
  const cuerpo = respuesta && respuesta.data;
  if (cuerpo && cuerpo.ok === true) return cuerpo.data;
  throw new Error('Respuesta inesperada de la API.');
}

export { BASE_URL };
export default api;
