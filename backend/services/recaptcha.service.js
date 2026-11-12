'use strict';

/**
 * Verificación de reCAPTCHA v3.
 * Si RECAPTCHA_SECRET_KEY no está configurada, la verificación se omite
 * (entornos de demo sin claves) para no bloquear registro ni checkout.
 */

const config = require('../config');
const { errores } = require('../utils/errors');

const URL_VERIFICACION = 'https://www.google.com/recaptcha/api/siteverify';

function habilitado() {
  return Boolean(config.recaptcha.secretKey);
}

/**
 * @param {string|null} token Token generado por grecaptcha.execute en el frontend.
 * @param {string|null} ip Dirección del cliente (opcional).
 * @returns {Promise<{omitido?:boolean, score?:number}>}
 */
async function verificar(token, ip = null) {
  if (!habilitado()) return { omitido: true };
  if (!token) {
    throw errores.solicitudInvalida(
      'Falta la verificación reCAPTCHA.',
      'RECAPTCHA_REQUERIDO',
    );
  }

  const cuerpo = new URLSearchParams({ secret: config.recaptcha.secretKey, response: token });
  if (ip) cuerpo.set('remoteip', ip);

  let respuesta;
  try {
    respuesta = await fetch(URL_VERIFICACION, { method: 'POST', body: cuerpo });
  } catch (_error) {
    throw errores.noDisponible('No fue posible validar reCAPTCHA.', 'RECAPTCHA_NO_DISPONIBLE');
  }
  if (!respuesta.ok) {
    throw errores.noDisponible('No fue posible validar reCAPTCHA.', 'RECAPTCHA_NO_DISPONIBLE');
  }

  const datos = await respuesta.json();
  if (!datos.success) {
    throw errores.solicitudInvalida('reCAPTCHA inválido.', 'RECAPTCHA_INVALIDO');
  }
  if (typeof datos.score === 'number' && datos.score < config.recaptcha.minScore) {
    throw errores.solicitudInvalida('reCAPTCHA con puntuación baja.', 'RECAPTCHA_SCORE_BAJO');
  }
  return { score: datos.score };
}

module.exports = { habilitado, verificar };
