'use strict';

/**
 * Arranque del servidor HTTP.
 * 1. Revisa la configuracion (advertencias, no errores fatales).
 * 2. Escucha en el puerto configurado.
 * 3. Intenta verificar la conexion con SQL Server (sin tumbar la API si falla).
 * 4. Cierra el pool ante SIGINT/SIGTERM.
 */

const app = require('./app');
const config = require('./config');
const { probarConexion, cerrarPool } = require('./config/database');

async function iniciar() {
  const problemas = config.validarConfiguracion();
  if (problemas.length > 0) {
    console.warn('[config] Advertencias de configuracion:');
    for (const problema of problemas) console.warn(`  - ${problema}`);
  }

  const servidor = app.listen(config.puerto, () => {
    console.log(
      `ApuestaDB API escuchando en http://localhost:${config.puerto}${config.apiPrefijo}`,
    );
    console.log(
      `Entorno: ${config.entorno} | Base de datos: ${config.bd.baseDatos} @ ${config.bd.servidor}:${config.bd.puerto}`,
    );
  });

  try {
    await probarConexion();
    console.log('[bd] Conexion con SQL Server verificada.');
  } catch (error) {
    console.warn('[bd] No se pudo verificar la conexion con SQL Server:', error.message);
    console.warn(
      '[bd] La API igualmente responde; las rutas que consultan datos fallaran hasta restablecer la conexion.',
    );
  }

  const apagar = (senal) => {
    console.log(`[proceso] Senal ${senal}: cerrando servidor...`);
    servidor.close(async () => {
      await cerrarPool();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => apagar('SIGINT'));
  process.on('SIGTERM', () => apagar('SIGTERM'));

  return servidor;
}

iniciar();

module.exports = { iniciar };
