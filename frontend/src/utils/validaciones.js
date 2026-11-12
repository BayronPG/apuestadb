/**
 * Validaciones de formulario en el cliente.
 *
 * Replican los mensajes y limites de `backend/routes/auth.routes.js` para dar
 * retroalimentacion inmediata; el backend sigue siendo la autoridad final.
 */

export const LONGITUD_MINIMA_CONTRASENA = 8;
export const LONGITUD_MAXIMA_CONTRASENA = 72;

/** Valida un correo con el mismo criterio de express-validator (isEmail). */
export function esCorreoValido(valor) {
  const texto = (valor || '').trim();
  if (!texto) return false;
  if (texto.length > 150) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto);
}

/** Evalua la contrasena y devuelve criterios, nivel y validez. */
export function evaluarContrasena(valor) {
  const texto = valor || '';
  const criterios = {
    longitud: texto.length >= LONGITUD_MINIMA_CONTRASENA && texto.length <= LONGITUD_MAXIMA_CONTRASENA,
    mayuscula: /[A-Z]/.test(texto),
    minuscula: /[a-z]/.test(texto),
    numero: /\d/.test(texto),
    simbolo: /[^A-Za-z0-9]/.test(texto),
  };
  const cumplidos = Object.values(criterios).filter(Boolean).length;
  let nivel = 'debil';
  if (cumplidos >= 5) nivel = 'fuerte';
  else if (cumplidos >= 3) nivel = 'media';
  return {
    criterios,
    cumplidos,
    total: 5,
    nivel,
    valida: cumplidos === 5,
  };
}

/** Valida la contrasena con todos los criterios de seguridad. */
export function esContrasenaValida(valor) {
  return evaluarContrasena(valor).valida;
}

/** Valida que un monto sea numerico y mayor que cero. */
export function esMontoValido(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0;
}

/** Valida que un entero sea positivo (ids del dominio). */
export function esEnteroPositivo(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
}

/** Devuelve true si el objeto de errores no tiene claves. */
export function sinErrores(errores) {
  return !errores || Object.keys(errores).length === 0;
}

/** Valida el formulario de inicio de sesion. */
export function validarLogin({ correo, contrasena }) {
  const errores = {};
  if (!esCorreoValido(correo)) errores.correo = 'Ingrese un correo valido.';
  if (!contrasena) errores.contrasena = 'La contrasena es obligatoria.';
  return errores;
}

/** Valida el formulario de registro de usuario. */
export function validarRegistro({ nombres, apellidos, correo, contrasena, confirmacion, telefono }) {
  const errores = {};
  if (!nombres || !nombres.trim()) errores.nombres = 'El nombre es obligatorio.';
  else if (nombres.trim().length > 100) errores.nombres = 'El nombre excede 100 caracteres.';
  if (!apellidos || !apellidos.trim()) errores.apellidos = 'El apellido es obligatorio.';
  else if (apellidos.trim().length > 100) errores.apellidos = 'El apellido excede 100 caracteres.';
  if (!esCorreoValido(correo)) errores.correo = 'Ingrese un correo valido.';
  if (!esContrasenaValida(contrasena)) {
    errores.contrasena = 'Debe tener 8-72 caracteres, mayuscula, minuscula, numero y simbolo.';
  }
  if (contrasena !== confirmacion) errores.confirmacion = 'Las contrasenas no coinciden.';
  if (telefono && telefono.trim().length > 20) errores.telefono = 'El telefono excede 20 caracteres.';
  return errores;
}

/** Valida el formulario de solicitud de recuperacion. */
export function validarSolicitudRecuperacion({ correo }) {
  const errores = {};
  if (!esCorreoValido(correo)) errores.correo = 'Ingrese un correo valido.';
  return errores;
}

/** Valida el formulario de restablecimiento con token. */
export function validarRestablecimiento({ correo, valorToken, nuevaContrasena, confirmacion }) {
  const errores = {};
  if (!esCorreoValido(correo)) errores.correo = 'Ingrese un correo valido.';
  if (!valorToken || !valorToken.trim()) errores.valorToken = 'El token es obligatorio.';
  if (!esContrasenaValida(nuevaContrasena)) {
    errores.nuevaContrasena = 'Debe tener 8-72 caracteres, mayuscula, minuscula, numero y simbolo.';
  }
  if (nuevaContrasena !== confirmacion) errores.confirmacion = 'Las contrasenas no coinciden.';
  return errores;
}
