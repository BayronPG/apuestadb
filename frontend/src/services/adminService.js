import api, { desenvolver } from './api.js';

/**
 * Servicio de OPERACIONES ADMINISTRATIVAS.
 *   POST /api/recargas            -> { idRecarga, mensaje } (201)
 *   POST /api/liquidaciones       -> { apuestasLiquidadas, mensaje }
 *   GET  /api/usuarios            -> { usuarios, total }
 *   GET  /api/auditoria           -> { registros, total }
 *
 * Filas (snake_case):
 *   usuarios[]  : { id_usuario, nombres, apellidos, correo, telefono, estado,
 *                   fecha_registro, rol, saldo_tokens, saldo_pse, saldo_total }
 *   registros[] : { id_auditoria, fecha_hora, id_usuario, correo, operacion,
 *                   entidad_afectada, descripcion, resultado, direccion_origen }
 */

/**
 * POST /api/recargas -> { idRecarga, mensaje } (201)
 * @param {{idUsuario:number, idTipoSaldo:number, monto:number, observacion?:string}} datos
 * `idTipoSaldo` se toma de GET /api/saldo (cuentas del administrador). Falta un
 * catalogo global de tipos de saldo, mejora no bloqueante: ver
 * docs/frontend/PENDIENTES_BACKEND.md.
 */
export async function crearRecarga({ idUsuario, idTipoSaldo, monto, observacion }) {
  const cuerpo = { idUsuario, idTipoSaldo, monto };
  if (observacion) cuerpo.observacion = observacion;
  const respuesta = await api.post('/recargas', cuerpo);
  return desenvolver(respuesta);
}

/**
 * POST /api/liquidaciones -> { apuestasLiquidadas, mensaje }
 * Exactamente uno de { idApuesta, idEvento }.
 */
export async function liquidarApuestas({ idApuesta, idEvento }) {
  const cuerpo = {};
  if (idApuesta) cuerpo.idApuesta = Number(idApuesta);
  if (idEvento) cuerpo.idEvento = Number(idEvento);
  const respuesta = await api.post('/liquidaciones', cuerpo);
  return desenvolver(respuesta);
}

/** GET /api/usuarios?estado=&rol=&limite= -> { usuarios, total } */
export async function listarUsuarios({ estado, rol, limite } = {}) {
  const parametros = {};
  if (estado) parametros.estado = estado;
  if (rol) parametros.rol = rol;
  if (limite) parametros.limite = limite;
  const respuesta = await api.get('/usuarios', { params: parametros });
  return desenvolver(respuesta);
}

/** GET /api/auditoria?idUsuario=&operacion=&desde=&hasta=&top= -> { registros, total } */
export async function consultarAuditoria({ idUsuario, operacion, desde, hasta, top } = {}) {
  const parametros = {};
  if (idUsuario) parametros.idUsuario = idUsuario;
  if (operacion) parametros.operacion = operacion;
  if (desde) parametros.desde = desde;
  if (hasta) parametros.hasta = hasta;
  if (top) parametros.top = top;
  const respuesta = await api.get('/auditoria', { params: parametros });
  return desenvolver(respuesta);
}
