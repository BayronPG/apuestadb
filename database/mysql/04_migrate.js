'use strict';

/**
 * APUESTADB - database/mysql/04_migrate.js
 * Migracion del catalogo deportivo desde SQL Server (origen, solo lectura)
 * hacia MySQL (destino). Fase 15.
 *
 * - Conserva los identificadores originales.
 * - Inserta en orden de dependencias y por lotes.
 * - Idempotente: INSERT ... ON DUPLICATE KEY UPDATE por PK.
 * - Convierte fechas a UTC con milisegundos para no perder precision.
 * - Solo imprime conteos y estados; nunca credenciales.
 *
 * Uso (desde la raiz del proyecto, con MYSQL_* en el entorno):
 *   node database/mysql/04_migrate.js
 *
 * Requiere: 01_schema.sql y 02_constraints_indexes.sql aplicados.
 */

const mysql = require('../../backend/node_modules/mysql2/promise');
const { consultar } = require('../../backend/config/database');

const TABLAS = [
  { nombre: 'Pais', pk: 'id_pais' },
  { nombre: 'Ciudad', pk: 'id_ciudad' },
  { nombre: 'Estadio', pk: 'id_estadio' },
  { nombre: 'Deporte', pk: 'id_deporte' },
  { nombre: 'Liga', pk: 'id_liga' },
  { nombre: 'Temporada', pk: 'id_temporada' },
  { nombre: 'Equipo', pk: 'id_equipo' },
  { nombre: 'Arbitro', pk: 'id_arbitro' },
  { nombre: 'Evento', pk: 'id_evento' },
  { nombre: 'CalendarioArbitro', pk: 'id_calendario' },
  { nombre: 'Mercado', pk: 'id_mercado' },
  { nombre: 'OpcionApuesta', pk: 'id_opcion' },
  { nombre: 'HistorialCuota', pk: 'id_historial' },
  { nombre: 'Resultado', pk: 'id_resultado' },
  { nombre: 'FavoritoEquipo', pk: 'id_favorito' },
];

const LOTE = 500;

function fechaUtc(valor) {
  if (!(valor instanceof Date)) return valor;
  if (Number.isNaN(valor.getTime())) return null;
  const iso = valor.toISOString(); // YYYY-MM-DDTHH:mm:ss.sssZ
  return `${iso.slice(0, 10)} ${iso.slice(11, 23)}`;
}

function normalizar(fila) {
  const salida = {};
  for (const [clave, valor] of Object.entries(fila)) {
    salida[clave] = valor instanceof Date ? fechaUtc(valor) : valor;
  }
  return salida;
}

function crearPoolMysql() {
  const obligatorias = ['MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD'];
  const faltan = obligatorias.filter((clave) => !process.env[clave]);
  if (faltan.length > 0) {
    throw new Error(`Variables MySQL incompletas: ${faltan.join(', ')}`);
  }
  return mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number.parseInt(process.env.MYSQL_PORT || '3307', 10),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    connectionLimit: 4,
    waitForConnections: true,
  });
}

async function migrarTabla(pool, tabla) {
  const origen = await consultar(`SELECT * FROM dbo.${tabla.nombre} ORDER BY ${tabla.pk}`);
  const filas = origen.registros.map(normalizar);
  if (filas.length === 0) return { tabla: tabla.nombre, origen: 0, destino: 0 };

  const columnas = Object.keys(filas[0]);
  const marcadores = columnas.map(() => '?').join(', ');
  const actualizaciones = columnas
    .filter((c) => c !== tabla.pk)
    .map((c) => `${c} = nuevo.${c}`)
    .join(', ');

  for (let i = 0; i < filas.length; i += LOTE) {
    const lote = filas.slice(i, i + LOTE);
    const valores = lote.map((fila) => columnas.map((c) => fila[c]));
    const tuplas = lote.map(() => `(${marcadores})`).join(', ');
    const sqlBase =
      `INSERT INTO ${tabla.nombre} (${columnas.join(', ')}) VALUES ${tuplas} ` +
      `AS nuevo ON DUPLICATE KEY UPDATE ${actualizaciones}`;
    await pool.query(sqlBase, valores.flat());
  }

  const [destino] = await pool.query(`SELECT COUNT(*) AS n FROM ${tabla.nombre}`);
  const [origenPk] = await pool.query(
    `SELECT COUNT(DISTINCT ${tabla.pk}) AS n FROM ${tabla.nombre}`,
  );
  return {
    tabla: tabla.nombre,
    origen: filas.length,
    destino: destino[0].n,
    distintas: origenPk[0].n,
  };
}

(async () => {
  const pool = crearPoolMysql();
  const resultados = [];
  let error = null;

  try {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const tabla of TABLAS) {
      const r = await migrarTabla(pool, tabla);
      resultados.push(r);
      if (r.origen !== r.destino || r.destino !== r.distintas) {
        throw new Error(`Diferencia de filas en ${r.tabla}: origen=${r.origen} destino=${r.destino}`);
      }
    }
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (e) {
    error = e;
  } finally {
    for (const r of resultados) {
      console.log(
        `${r.tabla}: origen=${r.origen} destino=${r.destino} distintas=${r.distintas ?? '-'}`,
      );
    }
    const total = resultados.reduce((suma, r) => suma + r.origen, 0);
    console.log(`TOTAL_MIGRADO=${total}`);
    await pool.end();
  }

  if (error) {
    console.error(`MIGRACION_FALLIDA: ${error.message}`);
    process.exit(1);
  }
  console.log('MIGRACION_OK');
  process.exit(0);
})().catch((e) => {
  console.error(`MIGRACION_FALLIDA: ${e.message}`);
  process.exit(1);
});
