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

/** Valida la contrasena (8 a 72 caracteres). */
export function esContrasenaValida(valor) {
  const texto = valor || '';
  return texto.length >= LONGITUD_MINIMA_CONTRASENA && texto.length <= LONGITUD_MAXIMA_CONTRASENA;
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
    errores.contrasena = 'La contrasena debe tener entre 8 y 72 caracteres.';
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
    errores.nuevaContrasena = 'La contrasena debe tener entre 8 y 72 caracteres.';
  }
  if (nuevaContrasena !== confirmacion) errores.confirmacion = 'Las contrasenas no coinciden.';
  return errores;
}
