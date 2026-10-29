'use strict';

/**
 * Hashing de contrasenas con bcrypt.
 *
 * Decision del proyecto (no modificable): el hash se calcula SIEMPRE en el
 * backend con bcrypt y se envia a los procedimientos como @contrasena_hash.
 * La contrasena en texto plano nunca se almacena, registra ni audita.
 */

const bcrypt = require('bcrypt');
const config = require('../config');

/**
 * Calcula el hash de una contrasena.
 * @param {string} contrasena Texto plano.
 * @returns {Promise<string>} Hash bcrypt (60 caracteres).
 */
async function hashearContrasena(contrasena) {
  return bcrypt.hash(contrasena, config.bcrypt.rondas);
}

/**
 * Compara una contrasena con un hash almacenado.
 * Devuelve false ante hash ausente o mal formado (nunca lanza al llamador).
 * @param {string} contrasena Texto plano.
 * @param {string} hashAlmacenado Hash leido de dbo.Usuario.contrasena.
 */
async function verificarContrasena(contrasena, hashAlmacenado) {
  if (!contrasena || !hashAlmacenado) return false;
  try {
    return await bcrypt.compare(contrasena, hashAlmacenado);
  } catch (error) {
    return false;
  }
}

module.exports = { hashearContrasena, verificarContrasena };
