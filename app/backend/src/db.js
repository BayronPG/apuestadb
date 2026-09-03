import sql from 'mssql'
import 'dotenv/config'

// Configuracion de conexion a SQL Server (ApuestaDB, instancia local SQLEXPRESS01).
// Valores sensibles se leen de .env (no versionado).
const config = {
  server: (process.env.DB_SERVER ?? 'localhost').trim(),
  port: Number(process.env.DB_PORT ?? 1433),
  database: process.env.DB_NAME ?? 'ApuestaDB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    // Instancia local sin TLS: encrypt desactivado. Solo desarrollo/sandbox.
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
  requestTimeout: 120000,
}

let pool = null

/**
 * Devuelve un pool conectado (creandolo la primera vez).
 * Si el pool se cae, se limpia para poder reconectarse en la siguiente llamada.
 */
export async function getPool() {
  if (pool && pool.connected) return pool
  if (pool) {
    // Pool anterior cerrado/roto: liberar referencia para crear uno nuevo
    try { await pool.close() } catch { /* sin efecto */ }
    pool = null
  }
  pool = await new sql.ConnectionPool(config).connect()
  pool.on('error', () => { pool = null })
  return pool
}

export { sql }
