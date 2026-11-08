'use strict';

/**
 * Bootstrap de datos multibase para Azure VM.
 * Ejecuta, en orden: migracion MySQL + semilla de Jugador, migracion
 * PostgreSQL y migracion MongoDB. Todos los scripts son idempotentes.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const mysql = require('/repo/backend/node_modules/mysql2/promise');

const BASE = path.resolve(__dirname, '..');

function ejecutar(script) {
  console.log(`Ejecutando ${path.relative(BASE, script)}`);
  execFileSync(process.execPath, [script], { stdio: 'inherit', env: process.env });
}

async function sembrarJugadores() {
  const archivo = path.join(BASE, 'mysql', '03_seed.sql');
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    multipleStatements: true,
  });
  await pool.query(fs.readFileSync(archivo, 'utf8'));
  const [filas] = await pool.query('SELECT COUNT(*) AS n FROM Jugador');
  console.log(`Jugadores sembrados: ${filas[0].n}`);
  await pool.end();
}

(async () => {
  try {
    ejecutar(path.join(BASE, 'mysql', '04_migrate.js'));
    await sembrarJugadores();
    ejecutar(path.join(BASE, 'postgresql', '04_migrate.js'));
    ejecutar(path.join(BASE, 'mongodb', '02_migrate.js'));
    console.log('DATA_INIT_OK');
    process.exit(0);
  } catch (e) {
    console.error(`DATA_INIT_FALLIDA: ${e.message}`);
    process.exit(1);
  }
})();
