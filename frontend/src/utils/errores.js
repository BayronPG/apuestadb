/**
 * Normalizacion de errores de Axios.
 *
 * El backend responde siempre con el formato uniforme:
 *   { ok: false, error: { codigo, mensaje } }
 * y los errores de validacion de express-validator anaden `detalles`.
 */

const MENSAJE_POR_DEFECTO = 'No fue posible completar la operacion. Intente de nuevo.';

/**
 * Convierte cualquier error (Axios, red o JavaScript) en un objeto legible.
 * @param {unknown} error
 * @returns {{codigo: string|null, mensaje: string, detalles: Array, estado: number|null}}
 */
export function normalizarError(error) {
  const respuesta = error && error.response;

  if (respuesta && respuesta.data && respuesta.data.error) {
    const { codigo = null, mensaje = null, detalles = [] } = respuesta.data.error;
    return {
      codigo,
      mensaje: mensaje || MENSAJE_POR_DEFECTO,
      detalles: Array.isArray(detalles) ? detalles : [],
      estado: respuesta.status,
    };
  }

  if (respuesta) {
    return {
      codigo: null,
      mensaje: `El servidor respondio con estado ${respuesta.status}.`,
      detalles: [],
      estado: respuesta.status,
    };
  }

  if (error && error.code === 'ECONNABORTED') {
    return {
      codigo: 'TIEMPO_AGOTADO',
      mensaje: 'La peticion tardo demasiado. Verifique la API e intente de nuevo.',
      detalles: [],
      estado: null,
    };
  }

  if (error && error.request) {
    return {
      codigo: 'SIN_CONEXION',
      mensaje: 'No se pudo contactar la API (http://localhost:4000). Verifique que el backend este en ejecucion.',
      detalles: [],
      estado: null,
    };
  }

  return {
    codigo: null,
    mensaje: (error && error.message) || MENSAJE_POR_DEFECTO,
    detalles: [],
    estado: null,
  };
}

/** Atajo: devuelve solo el mensaje legible. */
export function mensajeDeError(error) {
  return normalizarError(error).mensaje;
}

export { MENSAJE_POR_DEFECTO };
