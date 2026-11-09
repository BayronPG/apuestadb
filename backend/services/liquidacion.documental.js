'use strict';

/**
 * Liquidacion documental (Fase 17.1).
 *
 * - Resultado y opcion ganadora se derivan del catalogo en MySQL.
 * - El premio se acredita en PostgreSQL con el MISMO tipo de saldo de la apuesta.
 * - La liquidacion se inserta en MongoDB con id_apuesta unico: un duplicado no
 *   vuelve a pagar (idempotencia + indice unico).
 * - Si falla la insercion del documento, el premio se compensa con un debito.
 * - Notificacion y auditoria se escriben en MongoDB.
 * - No se declara ACID entre motores.
 */

const mysql = require('../config/db/mysql');
const saldoRepository = require('../repositories/saldo.repository');
const docs = require('../repositories/documentos.mongo.repository');
const { errores } = require('../utils/errors');

function ganador(marcadorLocal, marcadorVisitante) {
  if (Number(marcadorLocal) > Number(marcadorVisitante)) return 'local';
  if (Number(marcadorLocal) < Number(marcadorVisitante)) return 'visitante';
  return 'empate';
}

async function datosResultado(idOpcion) {
  const pool = await mysql.obtenerPool();
  const [filas] = await pool.query(
    `SELECT o.id_opcion, o.etiqueta, m.id_evento, r.id_resultado,
            r.marcador_local, r.marcador_visitante, r.estado AS estado_resultado
       FROM OpcionApuesta o
       JOIN Mercado m ON m.id_mercado = o.id_mercado
       LEFT JOIN Resultado r ON r.id_evento = m.id_evento
      WHERE o.id_opcion = ?`,
    [idOpcion],
  );
  return filas[0] || null;
}

async function liquidarUna(apuesta, idAdministrador) {
  const existente = await docs.buscarLiquidacion(apuesta.id_apuesta);
  if (existente) return { liquidada: false, premio: 0 };

  const datos = await datosResultado(apuesta.id_opcion);
  if (!datos || !datos.id_resultado || datos.estado_resultado !== 'oficial') {
    throw errores.conflicto('El evento no tiene resultado oficial.', 'RESULTADO_NO_DISPONIBLE');
  }

  const gano = ganador(datos.marcador_local, datos.marcador_visitante) === datos.etiqueta;
  const premio = gano
    ? Number((Number(apuesta.monto) * Number(apuesta.cuota_congelada)).toFixed(2))
    : 0;

  const cuenta = await saldoRepository.obtenerCuenta(apuesta.id_usuario, apuesta.id_tipo_saldo);
  if (!cuenta) throw errores.noEncontrado('La cuenta de saldo no existe.', 'CUENTA_NO_ENCONTRADA');

  if (gano) {
    await saldoRepository.registrarMovimiento({
      idSaldoCuenta: cuenta.id_saldo_cuenta,
      nombreMovimiento: 'premio',
      monto: premio,
      referencia: `Premio apuesta ${apuesta.id_apuesta}`,
      claveIdempotencia: `liquidacion:${apuesta.id_apuesta}`,
    });
  }

  try {
    await docs.crearLiquidacion({
      idApuesta: apuesta.id_apuesta,
      idResultado: datos.id_resultado,
      resultado: gano ? 'ganada' : 'perdida',
      montoPremio: premio,
    });
    await docs.actualizarApuesta(apuesta.id_apuesta, gano ? 'ganada' : 'perdida');
  } catch (error) {
    // Otra ejecucion pudo reservar la liquidacion primero: no se compensa.
    const ahora = await docs.buscarLiquidacion(apuesta.id_apuesta);
    if (ahora) return { liquidada: false, premio: 0 };

    if (gano) {
      try {
        await saldoRepository.registrarMovimiento({
          idSaldoCuenta: cuenta.id_saldo_cuenta,
          nombreMovimiento: 'apuesta',
          monto: premio,
          referencia: `Compensacion liquidacion ${apuesta.id_apuesta}`,
          claveIdempotencia: `comp:liquidacion:${apuesta.id_apuesta}`,
        });
      } catch (_e) {
        /* el error original se propaga */
      }
      throw errores.noDisponible(
        'No se pudo registrar la liquidacion; el premio fue compensado.',
        'LIQUIDACION_NO_REGISTRADA',
      );
    }
    throw error;
  }

  await docs.registrarNotificacion({
    idUsuario: apuesta.id_usuario,
    mensaje: `Apuesta #${apuesta.id_apuesta} liquidada como ${gano ? 'ganada' : 'perdida'}.`,
    tipo: 'liquidacion',
  });
  await docs.registrarAuditoria({
    idUsuario: idAdministrador,
    operacion: 'Liquidar apuesta',
    entidadAfectada: 'Liquidacion',
    descripcion: `Apuesta ${apuesta.id_apuesta}: ${gano ? 'ganada' : 'perdida'}.`,
    resultado: 'exito',
  });

  return { liquidada: true, premio };
}

/**
 * Liquida una apuesta o todas las pendientes de un evento.
 * @param {{idApuesta?:number|null,idEvento?:number|null,idAdministrador?:number|null}} datos
 */
async function liquidar({ idApuesta = null, idEvento = null, idAdministrador = null }) {
  if ((idApuesta === null) === (idEvento === null)) {
    throw errores.solicitudInvalida(
      'Debe indicar exactamente un criterio: idApuesta o idEvento.',
      'CRITERIO_INVALIDO',
    );
  }

  let apuestas = [];
  if (idApuesta !== null) {
    const apuesta = await docs.obtenerApuesta(idApuesta);
    if (!apuesta) throw errores.noEncontrado('La apuesta no existe.', 'APUESTA_NO_ENCONTRADA');
    apuestas = [apuesta];
  } else {
    const pool = await mysql.obtenerPool();
    const [opciones] = await pool.query(
      'SELECT id_opcion FROM OpcionApuesta o JOIN Mercado m ON m.id_mercado=o.id_mercado WHERE m.id_evento=?',
      [idEvento],
    );
    const ids = opciones.map((o) => o.id_opcion);
    if (ids.length === 0) return { apuestasLiquidadas: 0, mensaje: 'Sin apuestas pendientes.' };
    apuestas = await docs.notificacionesPendientesDeEvento(idEvento, ids);
  }

  let liquidadas = 0;
  let premios = 0;
  for (const apuesta of apuestas) {
    const r = await liquidarUna(apuesta, idAdministrador);
    if (r.liquidada) {
      liquidadas += 1;
      premios += r.premio;
    }
  }

  return {
    apuestasLiquidadas: liquidadas,
    premiosPagados: Number(premios.toFixed(2)),
    mensaje: liquidadas > 0 ? 'Liquidacion aplicada.' : 'Sin apuestas pendientes por liquidar.',
  };
}

module.exports = { liquidar };
