'use strict';

/**
 * Bootstrap del usuario demo en SQL Server para la VM de Azure.
 * - Toma la contrasena SOLO de DEMO_PASSWORD (nunca se imprime).
 * - Calcula el hash bcrypt y crea/actualiza usuario@apuestadb.local.
 * - Ejecuta 06_demo_data.sql (idempotente) dividiendo por lotes GO.
 */

const fs = require('fs');
const path = require('path');
const sql = require('/repo/backend/node_modules/mssql');
const bcrypt = require('/repo/backend/node_modules/bcrypt');

const DEMO_EMAIL = process.env.DEMO_EMAIL || 'usuario@apuestadb.local';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || '';
const ARCHIVO_DEMO = path.resolve(__dirname, '..', '06_demo_data.sql');

async function ejecutarLotes(pool, texto) {
  const lotes = texto
    .split(/^\s*GO\s*$/gim)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^USE\s+ApuestaDB;?$/i.test(l));
  for (const lote of lotes) {
    await pool.request().batch(lote);
  }
}

(async () => {
  if (!DEMO_PASSWORD) {
    console.log('DEMO_PASSWORD no definida: se omite el usuario demo');
    process.exit(0);
  }

  const pool = new sql.ConnectionPool({
    server: process.env.DB_SERVER || 'sqlserver',
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_NAME || 'ApuestaDB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    options: { encrypt: true, trustServerCertificate: true },
  });

  try {
    await pool.connect();
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const rol = await pool.request().query("SELECT id_rol FROM dbo.Rol WHERE nombre='usuario'");
    if (rol.recordset.length === 0) throw new Error('Falta el rol usuario (05_seed_data)');
    const idRol = rol.recordset[0].id_rol;

    const existe = await pool
      .request()
      .input('correo', sql.NVarChar(150), DEMO_EMAIL)
      .query('SELECT id_usuario FROM dbo.Usuario WHERE correo=@correo');

    if (existe.recordset.length > 0) {
      await pool
        .request()
        .input('correo', sql.NVarChar(150), DEMO_EMAIL)
        .input('hash', sql.VarChar(255), hash)
        .query('UPDATE dbo.Usuario SET contrasena=@hash WHERE correo=@correo');
      console.log('Usuario demo actualizado');
    } else {
      await pool
        .request()
        .input('rol', sql.Int, idRol)
        .input('correo', sql.NVarChar(150), DEMO_EMAIL)
        .input('hash', sql.VarChar(255), hash)
        .query(`INSERT INTO dbo.Usuario (id_rol, nombres, apellidos, correo, contrasena, estado, fecha_registro)
                VALUES (@rol, 'Usuario', 'Demo', @correo, @hash, 'activo', SYSDATETIME())`);
      console.log('Usuario demo creado');
    }

    console.log('DEMO_INIT_OK');
    process.exit(0);
  } catch (e) {
    console.error(`DEMO_INIT_FALLIDA: ${e.message}`);
    process.exit(1);
  } finally {
    await pool.close().catch(() => {});
  }
})();
