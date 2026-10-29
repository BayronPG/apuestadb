'use strict';

/**
 * Errores de aplicacion.
 *
 * `ErrorApi` transporta el codigo funcional, el mensaje legible y el estado
 * HTTP. El manejador central de errores lo serializa siempre como:
 *   { ok: false, error: { codigo, mensaje } }
 */

class ErrorApi extends Error {
  /**
   * @param {string} codigo Codigo funcional (por ejemplo 'SALDO_INSUFICIENTE').
   * @param {string} mensaje Mensaje legible para el cliente.
   * @param {number} estadoHttp Estado HTTP sugerido.
   * @param {Array} detalles Detalles opcionales de validacion.
   */
  constructor(codigo, mensaje, estadoHttp = 500, detalles = undefined) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.codigo = codigo;
    this.mensaje = mensaje;
    this.estadoHttp = estadoHttp;
    this.detalles = detalles;
    this.esOperacional = true;
  }

  toJSON() {
    const cuerpo = { codigo: this.codigo, mensaje: this.mensaje };
    if (this.detalles) cuerpo.detalles = this.detalles;
    return cuerpo;
  }
}

const errores = {
  solicitudInvalida: (mensaje = 'Solicitud invalida.', codigo = 'SOLICITUD_INVALIDA', detalles) =>
    new ErrorApi(codigo, mensaje, 400, detalles),

  noAutenticado: (mensaje = 'Debe iniciar sesion.', codigo = 'NO_AUTENTICADO') =>
    new ErrorApi(codigo, mensaje, 401),

  prohibido: (mensaje = 'No tiene permisos para esta operacion.', codigo = 'SIN_PERMISOS') =>
    new ErrorApi(codigo, mensaje, 403),

  noEncontrado: (mensaje = 'Recurso no encontrado.', codigo = 'NO_ENCONTRADO') =>
    new ErrorApi(codigo, mensaje, 404),

  conflicto: (mensaje = 'La operacion entra en conflicto con el estado actual.', codigo = 'CONFLICTO') =>
    new ErrorApi(codigo, mensaje, 409),

  interno: (mensaje = 'Error interno del servidor.', codigo = 'ERROR_INTERNO') =>
    new ErrorApi(codigo, mensaje, 500),

  noDisponible: (mensaje = 'Servicio no disponible.', codigo = 'SERVICIO_NO_DISPONIBLE') =>
    new ErrorApi(codigo, mensaje, 503),
};

module.exports = { ErrorApi, errores };
