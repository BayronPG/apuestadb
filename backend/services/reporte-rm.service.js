'use strict';

/**
 * Read model MVP de reportes.
 * Fuente: MongoDB apuesta/liquidacion. Destino: SQL Server RM_*.
 * Sin outbox: cada ejecucion reemplaza el snapshot completo en una transaccion.
 */

const mongo = require('../config/db/mongodb');
const { sql, consultar, obtenerPool } = require('../config/database');

async function mapaEventos() {
  const resultado = await consultar(
    `SELECT o.id_opcion, m.id_evento
       FROM dbo.OpcionApuesta o
       JOIN dbo.Mercado m ON m.id_mercado = o.id_mercado`,
  );
  return new Map(resultado.registros.map((fila) => [Number(fila.id_opcion), Number(fila.id_evento)]));
}

async function leerMongo() {
  await mongo.ping();
  const db = mongo.obtenerDb();
  const [apuestas, liquidaciones] = await Promise.all([
    db.collection('apuesta').find({}, { projection: { _id: 0 } }).toArray(),
    db.collection('liquidacion').find({}, { projection: { _id: 0 } }).toArray(),
  ]);
  return { apuestas, liquidaciones };
}

function iso(valor) {
  return valor ? new Date(valor).toISOString() : null;
}

async function refrescar() {
  const inicio = Date.now();
  const { apuestas, liquidaciones } = await leerMongo();
  const eventos = await mapaEventos();

  let sinEvento = 0;
  const apuestasRm = apuestas.map((a) => {
    const idEvento = eventos.get(Number(a.id_opcion)) || null;
    if (!idEvento) sinEvento += 1;
    return {
      id_apuesta: Number(a.id_apuesta),
      id_usuario: Number(a.id_usuario),
      id_opcion: Number(a.id_opcion),
      id_evento: idEvento,
      id_tipo_saldo: Number(a.id_tipo_saldo),
      monto: Number(a.monto),
      cuota_congelada: a.cuota_congelada == null ? null : Number(a.cuota_congelada),
      tipo_apuesta: a.tipo_apuesta || null,
      estado: a.estado,
      fecha_registro: iso(a.fecha_hora_registro),
      id_movimiento: a.id_movimiento == null ? null : Number(a.id_movimiento),
      clave_idempotencia: a.clave_idempotencia || null,
    };
  });

  const liquidacionesRm = liquidaciones.map((l) => ({
    id_apuesta: Number(l.id_apuesta),
    id_liquidacion: l.id_liquidacion == null ? null : Number(l.id_liquidacion),
    id_resultado: l.id_resultado == null ? null : Number(l.id_resultado),
    resultado: l.resultado_liquidacion || null,
    monto_premio: Number(l.monto_premio || 0),
    fecha_hora: iso(l.fecha_hora),
    estado: l.estado || null,
  }));

  const pool = await obtenerPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await new sql.Request(tx).query('DELETE FROM dbo.RM_Liquidacion; DELETE FROM dbo.RM_Apuesta;');

    const reqApuestas = new sql.Request(tx);
    reqApuestas.input('json', sql.NVarChar(sql.MAX), JSON.stringify(apuestasRm));
    await reqApuestas.query(
      `INSERT INTO dbo.RM_Apuesta
         (id_apuesta, id_usuario, id_opcion, id_evento, id_tipo_saldo, monto,
          cuota_congelada, tipo_apuesta, estado, fecha_registro, id_movimiento, clave_idempotencia)
       SELECT id_apuesta, id_usuario, id_opcion, id_evento, id_tipo_saldo, monto,
              cuota_congelada, tipo_apuesta, estado, fecha_registro, id_movimiento, clave_idempotencia
         FROM OPENJSON(@json) WITH (
           id_apuesta BIGINT '$.id_apuesta',
           id_usuario INT '$.id_usuario',
           id_opcion INT '$.id_opcion',
           id_evento INT '$.id_evento',
           id_tipo_saldo INT '$.id_tipo_saldo',
           monto DECIMAL(18,2) '$.monto',
           cuota_congelada DECIMAL(10,2) '$.cuota_congelada',
           tipo_apuesta VARCHAR(20) '$.tipo_apuesta',
           estado VARCHAR(20) '$.estado',
           fecha_registro DATETIME2(3) '$.fecha_registro',
           id_movimiento BIGINT '$.id_movimiento',
           clave_idempotencia VARCHAR(120) '$.clave_idempotencia'
         )`,
    );

    const reqLiquidaciones = new sql.Request(tx);
    reqLiquidaciones.input('json', sql.NVarChar(sql.MAX), JSON.stringify(liquidacionesRm));
    await reqLiquidaciones.query(
      `INSERT INTO dbo.RM_Liquidacion
         (id_apuesta, id_liquidacion, id_resultado, resultado, monto_premio, fecha_hora, estado)
       SELECT id_apuesta, id_liquidacion, id_resultado, resultado, monto_premio, fecha_hora, estado
         FROM OPENJSON(@json) WITH (
           id_apuesta BIGINT '$.id_apuesta',
           id_liquidacion BIGINT '$.id_liquidacion',
           id_resultado INT '$.id_resultado',
           resultado VARCHAR(20) '$.resultado',
           monto_premio DECIMAL(18,2) '$.monto_premio',
           fecha_hora DATETIME2(3) '$.fecha_hora',
           estado VARCHAR(20) '$.estado'
         )`,
    );

    const sync = new sql.Request(tx);
    sync.input('apuestas', sql.Int, apuestas.length);
    sync.input('liquidaciones', sql.Int, liquidaciones.length);
    sync.input('detalle', sql.NVarChar(400), sinEvento ? `${sinEvento} apuesta(s) sin id_evento` : null);
    await sync.query(
      `MERGE dbo.RM_SyncState AS t
       USING (SELECT 'mongo' AS origen) AS s ON t.origen = s.origen
       WHEN MATCHED THEN UPDATE SET ultima_sync = SYSUTCDATETIME(), apuestas = @apuestas,
                                    liquidaciones = @liquidaciones, detalle = @detalle
       WHEN NOT MATCHED THEN INSERT (origen, ultima_sync, apuestas, liquidaciones, detalle)
            VALUES ('mongo', SYSUTCDATETIME(), @apuestas, @liquidaciones, @detalle);`,
    );

    await tx.commit();
    return { apuestas: apuestas.length, liquidaciones: liquidaciones.length, sinEvento, ms: Date.now() - inicio };
  } catch (error) {
    try { await tx.rollback(); } catch (_e) { /* rollback silencioso */ }
    throw error;
  }
}

module.exports = { refrescar };
