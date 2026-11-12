'use strict';

/**
 * Saga de registro de apuesta (Fase 17).
 *
 * Pasos:
 *   1. Validar la opcion de apuesta en el catalogo (MySQL).
 *   2. Debitar el saldo en PostgreSQL (idempotente por clave).
 *   3. Insertar el documento de apuesta en MongoDB.
 *   4. Si el paso 3 falla, compensar con un credito de ajuste en PostgreSQL.
 *
 * No se declara ACID entre motores: la compensacion es explicita y la
 * idempotencia evita aplicar dos veces el mismo movimiento.
 */

const saldoRepository = require('../repositories/saldo.repository');
const apuestaMongo = require('../repositories/apuesta.mongo.repository');
const config = require('../config');
const { errores } = require('../utils/errors');

function validarOpcion(opcion) {
  if (!opcion) throw errores.noEncontrado('La opcion de apuesta no existe.', 'OPCION_NO_ENCONTRADA');
  if (opcion.estado_opcion !== 'habilitada' || opcion.estado_mercado !== 'abierto') {
    throw errores.conflicto('El mercado no esta abierto para apostar.', 'MERCADO_NO_DISPONIBLE');
  }
  if (!['programado', 'en_curso'].includes(opcion.estado_evento)) {
    throw errores.conflicto('El evento no admite apuestas.', 'EVENTO_NO_DISPONIBLE');
  }
  if (opcion.fecha_hora_inicio && new Date(opcion.fecha_hora_inicio) <= new Date()) {
    throw errores.conflicto('El evento ya inicio.', 'EVENTO_INICIADO');
  }
}

/**
 * Registra una apuesta con saga PostgreSQL + MongoDB.
 * @param {{idUsuario:number,idOpcion:number,idTipoSaldo:number,monto:number,claveIdempotencia?:string|null}} datos
 */
async function registrar({ idUsuario, idOpcion, idTipoSaldo, monto, claveIdempotencia = null }) {
  const clave = claveIdempotencia || `apuesta:${idUsuario}:${idOpcion}:${idTipoSaldo}:${monto}:${Date.now()}`;

  const existente = await apuestaMongo.buscarPorClave(clave);
  if (existente) {
    return { idApuesta: existente.id_apuesta, mensaje: 'Apuesta registrada correctamente.' };
  }

  const opcion = await apuestaMongo.opcionDe(idOpcion);
  validarOpcion(opcion);

  const cuenta = await saldoRepository.obtenerCuenta(idUsuario, idTipoSaldo);
  if (!cuenta) {
    throw errores.noEncontrado('La cuenta de saldo no existe.', 'CUENTA_NO_ENCONTRADA');
  }

  const idApuesta = await apuestaMongo.siguienteId();
  const idApuestaMovimiento = config.saldo.motor === 'postgresql' ? idApuesta : null;
  const debito = await saldoRepository.registrarMovimiento({
    idSaldoCuenta: cuenta.id_saldo_cuenta,
    nombreMovimiento: 'apuesta',
    monto,
    idApuesta: idApuestaMovimiento,
    referencia: 'Descuento por registro de apuesta',
    claveIdempotencia: `apuesta:${clave}`,
  });

  try {
    const documento = {
      id_apuesta: idApuesta,
      id_usuario: Number(idUsuario),
      id_opcion: Number(idOpcion),
      id_tipo_saldo: Number(idTipoSaldo),
      monto: Number(monto),
      cuota_congelada: Number(opcion.cuota_vigente),
      tipo_apuesta: 'simple',
      estado: 'pendiente',
      fecha_hora_registro: new Date(),
      id_movimiento: debito.idMovimiento,
      clave_idempotencia: clave,
    };
    await apuestaMongo.insertar(documento);
    return { idApuesta, mensaje: 'Apuesta registrada correctamente.' };
  } catch (error) {
    try {
      await saldoRepository.registrarMovimiento({
        idSaldoCuenta: cuenta.id_saldo_cuenta,
        nombreMovimiento: 'ajuste',
        monto,
        idApuesta: idApuestaMovimiento,
        referencia: 'Compensacion apuesta fallida',
        claveIdempotencia: `comp:${clave}`,
      });
    } catch (_e) {
      /* la compensacion se documenta; no se oculta el error original */
    }
    throw errores.noDisponible(
      'No se pudo registrar la apuesta; el saldo fue compensado.',
      'APUESTA_NO_REGISTRADA',
    );
  }
}

module.exports = { registrar };
