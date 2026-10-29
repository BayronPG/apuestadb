'use strict';

/**
 * Acceso a SQL Server con `mssql` (driver tedious).
 *
 * Responsabilidades de esta capa:
 *   1. Mantener un unico pool de conexiones (singleton perezoso).
 *   2. Ofrecer dos primitivas parametrizadas: `ejecutar` (procedimientos
 *      almacenados) y `consultar` (SELECT de lectura).
 *   3. Normalizar la forma del resultado para los repositorios.
 *
 * Ninguna capa superior construye SQL concatenado: los valores viajan siempre
 * como parametros (request.input), lo que evita inyeccion SQL.
 */

const sql = require('mssql');
const config = require('./index');

let pool = null;
let conexionEnCurso = null;

/**
 * Define un parametro para mssql.
 * @param {*} tipo Tipo de dato de mssql (sql.Int, sql.Decimal(18,2), ...).
 * @param {*} valor Valor del parametro.
 */
function p(tipo, valor) {
  return { tipo, valor };
}

function construirConfiguracion() {
  const bd = config.bd;

  const opciones = {
    server: bd.servidor,
    port: bd.puerto,
    database: bd.baseDatos,
    connectionTimeout: bd.tiempoConexion,
    requestTimeout: bd.tiempoPeticion,
    pool: {
      max: bd.poolMax,
      min: bd.poolMin,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: bd.cifrar,
      trustServerCertificate: bd.confiarCertificadoServidor,
      enableArithAbort: true,
      appName: 'ApuestaDB-API',
    },
  };

  if (bd.modoAutenticacion === 'windows') {
    // Autenticacion integrada de Windows. El driver por defecto (tedious)
    // no la soporta: requiere el driver opcional msnodesqlv8, fuera del
    // stack obligatorio del proyecto.
    opciones.options.trustedConnection = true;
  } else {
    opciones.user = bd.usuario;
    opciones.password = bd.contrasena;
  }

  return opciones;
}

/** Devuelve (creando si hace falta) el pool compartido de conexiones. */
async function obtenerPool() {
  if (pool && pool.connected) return pool;
  if (conexionEnCurso) return conexionEnCurso;

  const nuevoPool = new sql.ConnectionPool(construirConfiguracion());

  conexionEnCurso = nuevoPool
    .connect()
    .then((conectado) => {
      pool = conectado;
      conexionEnCurso = null;
      return conectado;
    })
    .catch((error) => {
      conexionEnCurso = null;
      throw error;
    });

  return conexionEnCurso;
}

/** Cierra el pool (apagado ordenado del proceso). */
async function cerrarPool() {
  if (!pool) return;
  const cerrando = pool;
  pool = null;
  conexionEnCurso = null;
  try {
    await cerrando.close();
  } catch (error) {
    console.error('[bd] Error al cerrar el pool:', error.message);
  }
}

/**
 * Devuelve el ultimo conjunto de resultados de un procedimiento.
 * Necesario porque varios procedimientos invocan otros que tambien hacen
 * SELECT (por ejemplo usp_Notificacion_Crear) antes de emitir su resultado.
 */
function ultimoRecordset(recordsets) {
  if (!Array.isArray(recordsets) || recordsets.length === 0) return [];
  return recordsets[recordsets.length - 1] || [];
}

/**
 * Ejecuta un procedimiento almacenado con parametros de entrada y salida.
 * @param {string} nombre Nombre completo, por ejemplo 'dbo.usp_Saldo_Consultar'.
 * @param {Object} entradas Mapa { nombreParametro: p(tipo, valor) }.
 * @param {Object} salidas Mapa { nombreParametro: tipo } para parametros OUTPUT.
 */
async function ejecutar(nombre, entradas = {}, salidas = {}) {
  const conexion = await obtenerPool();
  const peticion = conexion.request();

  for (const [clave, definicion] of Object.entries(entradas)) {
    peticion.input(clave, definicion.tipo, definicion.valor);
  }
  for (const [clave, tipo] of Object.entries(salidas)) {
    peticion.output(clave, tipo);
  }

  const resultado = await peticion.execute(nombre);

  return {
    registros: ultimoRecordset(resultado.recordsets),
    primerRecordset: resultado.recordset || null,
    recordsets: resultado.recordsets || [],
    salidas: resultado.output || {},
    filasAfectadas: resultado.rowsAffected || [],
  };
}

/**
 * Ejecuta una consulta SQL parametrizada (solo lectura).
 * @param {string} texto Sentencia SELECT con parametros @nombre.
 * @param {Object} parametros Mapa { nombreParametro: p(tipo, valor) }.
 */
async function consultar(texto, parametros = {}) {
  const conexion = await obtenerPool();
  const peticion = conexion.request();

  for (const [clave, definicion] of Object.entries(parametros)) {
    peticion.input(clave, definicion.tipo, definicion.valor);
  }

  const resultado = await peticion.query(texto);

  return {
    registros: resultado.recordset || [],
    recordsets: resultado.recordsets || [],
    filasAfectadas: resultado.rowsAffected || [],
  };
}

/** Comprueba la conectividad con SQL Server (usada por GET /api/health). */
async function probarConexion() {
  const conexion = await obtenerPool();
  const resultado = await conexion.request().query('SELECT 1 AS conectado');
  return resultado.recordset && resultado.recordset[0] ? resultado.recordset[0].conectado === 1 : false;
}

module.exports = {
  sql,
  p,
  obtenerPool,
  cerrarPool,
  ejecutar,
  consultar,
  probarConexion,
};
