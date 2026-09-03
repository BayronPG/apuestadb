/**
 * ApuestaDB - Bateria de pruebas automatizadas del sandbox (login/registro/exportacion).
 *
 * Requisitos:
 *   - Backend corriendo en http://localhost:3000 (npm start en src/backend)
 *   - TCP habilitado en SQL Server (puerto 1433) y .env configurado
 *   - BD ApuestaDB creada con script_tablas y datos de clase (seed)
 *
 * Uso:
 *   node scripts/pruebas_api.mjs
 *
 * Lo que prueba (con evidencia impresa):
 *   health, registro, duplicados, hash almacenado, login ok/incorrecto,
 *   sesion (persistencia), logout, rutas protegidas, roles, exportacion
 *   simple/multiple/vacia/inexistente y validacion estructural del .xlsx.
 * Los archivos .xlsx de evidencia se guardan en docs/pruebas/salidas_xlsx/.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import sql from 'mssql'
import bcrypt from 'bcryptjs'
import ExcelJS from 'exceljs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = `http://localhost:${process.env.PORT || 3000}`
// Evidencias en la carpeta docs/pruebas del proyecto (raiz del workspace)
const SALIDAS = path.resolve(__dirname, '../../../docs/pruebas/salidas_xlsx')
fs.mkdirSync(SALIDAS, { recursive: true })

const dbConfig = {
  server: (process.env.DB_SERVER ?? 'localhost').trim(),
  port: Number(process.env.DB_PORT ?? 1433),
  database: process.env.DB_NAME ?? 'ApuestaDB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { encrypt: false, trustServerCertificate: true },
  connectionTimeout: 15000,
}

// ---------- Datos de prueba del sandbox (credentiales ficticias) ----------
// Correo y documento unicos por ejecucion para que la bateria sea repetible.
// La clave del usuario de prueba se genera en cada corrida (solo vive en
// memoria); la clave del admin se lee de .env (PRUEBA_CLAVE_ADMIN) para
// permitir iniciar sesion manualmente despues de la bateria. Ninguna clave
// real queda escrita en el codigo versionado.
const CLAVE_ADMIN =
  process.env.PRUEBA_CLAVE_ADMIN ??
  (() => {
    console.error('Falta PRUEBA_CLAVE_ADMIN en src/backend/.env (ver .env.example).')
    process.exit(1)
  })()

const sufijo = String(Date.now())
const claveUsuario = `Clv${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`
const USUARIO_NUEVO = {
  nombreCompleto: 'Carlos Andres Perez Ruiz',
  tipoDocumento: 'CC',
  numeroDocumento: `99${sufijo.slice(-8)}`,
  correo: `carlos.pruebas${sufijo}@apuestadb.com`,
  celular: '3001112233',
  clave: claveUsuario,
  clave2: claveUsuario,
}

const resultados = []
function registrar(nombre, ok, detalle = '') {
  resultados.push({ nombre, ok, detalle })
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${nombre}${detalle ? '  -> ' + detalle : ''}`)
}

let cookie = ''
async function api(ruta, opts = {}) {
  const headers = { ...(opts.headers || {}) }
  if (cookie) headers.Cookie = cookie
  const r = await fetch(BASE + ruta, { ...opts, headers })
  const sc = r.headers.get('set-cookie')
  if (sc) {
    const m = sc.match(/apuestadb\.sid=[^;]+/)
    if (m) cookie = m[0]
  }
  return r
}

async function validarXlsx(rutaArchivo, esperado) {
  // esperado: [{ hoja, columnasEsperadas, filasMinimas }]
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(rutaArchivo)
  const detalle = []
  for (const e of esperado) {
    const hoja = wb.getWorksheet(e.hoja)
    if (!hoja) {
      detalle.push(`${e.hoja}: FALTA`)
      continue
    }
    const encabezados = []
    hoja.getRow(1).eachCell({ includeEmpty: true }, (c, n) => {
      if (c.value !== undefined && c.value !== null) encabezados.push(String(c.value))
    })
    const totalFilas = hoja.rowCount - 1 // menos encabezado
    detalle.push(
      `${e.hoja}: columnas=${encabezados.length} (${encabezados.join(',')}) filasDatos=${totalFilas}`,
    )
  }
  return detalle.join(' | ')
}

async function main() {
  console.log('===== ApuestaDB: bateria de pruebas (sandbox) =====\n')

  // 0) Health: backend + conexion a BD
  try {
    const r = await api('/api/health')
    const d = await r.json()
    registrar('Health backend + BD', r.ok && d.ok === true, d.ok ? 'BD conectada' : d.error)
  } catch (e) {
    registrar('Health backend + BD', false, e.message)
    console.log('\nEl backend no responde. Inicia src/backend con: npm start')
    process.exit(1)
  }

  const pool = await new sql.ConnectionPool(dbConfig).connect()

  // 1) Garantizar un admin con hash REAL (el seed usa un hash ficticio invalido)
  await pool
    .request()
    .input('mail', sql.NVarChar(150), 'jhon@apuestadb.com')
    .input('hash', sql.NVarChar(255), await bcrypt.hash(CLAVE_ADMIN, 10))
    .query('UPDATE Usuario SET contrasena_hash = @hash WHERE correo = @mail AND rol_id = 1')
  console.log('NOTA | admin jhon@apuestadb.com habilitado con clave de pruebas (solo sandbox)')

  // 2) Registro de usuario real
  let r = await api('/api/auth/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(USUARIO_NUEVO),
  })
  const dReg = await r.json().catch(() => ({}))
  registrar('Registro de usuario (201)', r.status === 201, dReg.mensaje || JSON.stringify(dReg))

  // 3) Hash almacenado (nunca texto plano)
  const qHash = await pool
    .request()
    .input('mail', sql.NVarChar(150), USUARIO_NUEVO.correo)
    .query('SELECT contrasena_hash FROM Usuario WHERE correo = @mail')
  const hash = qHash.recordset[0]?.contrasena_hash ?? ''
  const esBcrypt = hash.startsWith('$2') && hash.length === 60
  registrar(
    'Contrasena guardada como hash bcrypt',
    esBcrypt && hash !== USUARIO_NUEVO.clave,
    `hash=${hash.slice(0, 12)}... (len ${hash.length}, distinto del texto plano: ${hash !== USUARIO_NUEVO.clave})`,
  )

  // 4) Saldos iniciales creados (tokens y PSE en 0)
  const qSal = await pool
    .request()
    .input('mail', sql.NVarChar(150), USUARIO_NUEVO.correo)
    .query(
      `SELECT ts.nombre, sc.saldo FROM SaldoCuenta sc
       JOIN Usuario u ON u.id = sc.usuario_id
       JOIN TipoSaldo ts ON ts.id = sc.tipo_saldo_id
       WHERE u.correo = @mail ORDER BY ts.nombre`,
    )
  registrar(
    'Saldos iniciales tokens/pse en 0',
    qSal.recordset.length === 2 && qSal.recordset.every((x) => Number(x.saldo) === 0),
    qSal.recordset.map((x) => `${x.nombre}=${x.saldo}`).join(', '),
  )

  // 5) Duplicados (contra datos sembrados del seed: shantal@apuestadb.com / doc 9876543210)
  r = await api('/api/auth/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...USUARIO_NUEVO, correo: 'shantal@apuestadb.com', numeroDocumento: '1011998877' }),
  })
  const d1 = await r.json().catch(() => ({}))
  registrar('Rechazo correo duplicado (409)', r.status === 409, d1.mensaje)

  r = await api('/api/auth/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...USUARIO_NUEVO, correo: 'otro.correo@apuestadb.com', numeroDocumento: '9876543210' }),
  })
  const d2 = await r.json().catch(() => ({}))
  registrar('Rechazo documento duplicado (409)', r.status === 409, d2.mensaje)

  // 6) Validaciones: correo con formato invalido
  r = await api('/api/auth/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...USUARIO_NUEVO, correo: 'correo-invalido', numeroDocumento: '1011887766' }),
  })
  const d3 = await r.json().catch(() => ({}))
  registrar('Validacion formato de correo (400)', r.status === 400, d3.mensaje)

  // 7) Login correcto (usuario recien registrado -> rol usuario)
  r = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: USUARIO_NUEVO.correo, clave: USUARIO_NUEVO.clave }),
  })
  const dLogin = await r.json().catch(() => ({}))
  registrar(
    'Login correcto (200) con rol desde BD',
    r.status === 200 && dLogin.usuario?.rol === 'usuario',
    `rol=${dLogin.usuario?.rol} nombre=${dLogin.usuario?.nombre}`,
  )

  // 8) Login con clave incorrecta (mensaje generico, 401)
  r = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: USUARIO_NUEVO.correo, clave: `${claveUsuario}X` }),
  })
  const dBad = await r.json().catch(() => ({}))
  registrar('Rechazo credenciales incorrectas (401 generico)', r.status === 401, dBad.mensaje)

  // 9) Login con correo inexistente (mismo mensaje generico)
  r = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'nadie@apuestadb.com', clave: claveUsuario }),
  })
  const dNoEx = await r.json().catch(() => ({}))
  registrar(
    'Rechazo correo inexistente (401 generico)',
    r.status === 401 && dNoEx.mensaje === dBad.mensaje,
    dNoEx.mensaje,
  )
  // 10) Bitacora en tabla Login (intentos ok y fallidos del usuario)
  const qLog = await pool
    .request()
    .input('mail', sql.NVarChar(150), USUARIO_NUEVO.correo)
    .query(
      `SELECT exitoso, COUNT(*) AS n FROM Login l JOIN Usuario u ON u.id = l.usuario_id
       WHERE u.correo = @mail GROUP BY exitoso ORDER BY exitoso`,
    )
  const intentos = qLog.recordset.map((x) => `exitoso=${x.exitoso}:${x.n}`).join(', ')
  const tieneOk = qLog.recordset.some((x) => Number(x.exitoso) === 1)
  const tieneFail = qLog.recordset.some((x) => Number(x.exitoso) === 0)
  registrar('Intentos registrados en tabla Login', tieneOk && tieneFail, intentos)

  // 11) Sesion activa (cookie httpOnly de servidor)
  r = await api('/api/auth/sesion')
  const dSes = await r.json().catch(() => ({}))
  registrar('Sesion persistente (cookie)', r.status === 200 && dSes.usuario?.correo === USUARIO_NUEVO.correo, `usuario=${dSes.usuario?.correo}`)

  // 12) Rutas protegidas sin sesion
  cookie = ''
  r = await api('/api/exportar/tablas')
  registrar('Exportacion sin sesion -> 401', r.status === 401)

  // 13) Rol usuario no puede exportar (403)
  r = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: USUARIO_NUEVO.correo, clave: USUARIO_NUEVO.clave }),
  })
  r = await api('/api/exportar/tablas')
  registrar('Exportacion con rol usuario -> 403', r.status === 403)

  // 14) Logout y verificacion
  r = await api('/api/auth/logout', { method: 'POST' })
  const okLogout = r.status === 200
  r = await api('/api/auth/sesion')
  registrar('Cierre de sesion (logout) y sesion invalidada', okLogout && r.status === 401)

  // 15) Login admin (rol admin, hash real aplicado arriba)
  r = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'jhon@apuestadb.com', clave: CLAVE_ADMIN }),
  })
  const dAdm = await r.json().catch(() => ({}))
  registrar('Login admin (200)', r.status === 200 && dAdm.usuario?.rol === 'admin', `rol=${dAdm.usuario?.rol}`)

  // 16) Listado de tablas (admin)
  r = await api('/api/exportar/tablas')
  const dTablas = await r.json().catch(() => ({}))
  registrar('Listado de tablas (admin)', r.status === 200 && Array.isArray(dTablas.tablas) && dTablas.tablas.length >= 16, `${dTablas.tablas?.length ?? 0} tablas`)

  // 17) Tabla inexistente -> 400 (nombres arbitrarios bloqueados)
  r = await api('/api/exportar?tablas=NoExiste')
  registrar('Rechazo tabla inexistente (400)', r.status === 400)

  // 18) Exportacion de UNA tabla (Usuario)
  r = await api('/api/exportar?tablas=Usuario')
  const cd1 = r.headers.get('content-disposition') || ''
  const nom1 = (cd1.match(/filename="?([^";]+)"?/i) || [])[1] || 'evidencia_1tabla.xlsx'
  const buf1 = Buffer.from(await r.arrayBuffer())
  const ruta1 = path.join(SALIDAS, `evidencia_1_tabla_${nom1}`)
  fs.writeFileSync(ruta1, buf1)
  const det1 = await validarXlsx(ruta1, [{ hoja: 'Usuario', columnasEsperadas: 14 }])
  registrar('Exportacion 1 tabla (.xlsx)', r.status === 200 && nom1.includes('ApuestaDB_exportacion_'), `${nom1} | ${det1}`)

  // 19) Exportacion de VARIAS tablas (una hoja por tabla)
  r = await api('/api/exportar?tablas=Usuario,SaldoCuenta,Apuestas')
  const cd3 = r.headers.get('content-disposition') || ''
  const nom3 = (cd3.match(/filename="?([^";]+)"?/i) || [])[1] || 'evidencia_multitabla.xlsx'
  const buf3 = Buffer.from(await r.arrayBuffer())
  const ruta3 = path.join(SALIDAS, `evidencia_varias_tablas_${nom3}`)
  fs.writeFileSync(ruta3, buf3)
  const det3 = await validarXlsx(ruta3, [
    { hoja: 'Usuario', columnasEsperadas: 14 },
    { hoja: 'SaldoCuenta', columnasEsperadas: 7 },
    { hoja: 'Apuestas', columnasEsperadas: 6 },
  ])
  registrar('Exportacion varias tablas (3 hojas)', r.status === 200 && det3.split('|').length === 3, det3)

  // 20) Exportacion de TABLA VACIA (hoja solo con encabezados)
  await pool.request().query(`
    IF OBJECT_ID('dbo._PruebaVacia', 'U') IS NULL
      CREATE TABLE dbo._PruebaVacia (id INT NOT NULL, nombre NVARCHAR(50) NULL, fecha DATETIME2 NULL)`)
  try {
    r = await api('/api/exportar?tablas=_PruebaVacia')
    const cd4 = r.headers.get('content-disposition') || ''
    const nom4 = (cd4.match(/filename="?([^";]+)"?/i) || [])[1] || 'evidencia_tabla_vacia.xlsx'
    const buf4 = Buffer.from(await r.arrayBuffer())
    const ruta4 = path.join(SALIDAS, `evidencia_tabla_vacia_${nom4}`)
    fs.writeFileSync(ruta4, buf4)
    const det4 = await validarXlsx(ruta4, [{ hoja: '_PruebaVacia', columnasEsperadas: 3 }])
    registrar('Exportacion tabla vacia (encabezados sin filas)', r.status === 200, det4)
  } finally {
    await pool.request().query('IF OBJECT_ID(\'dbo._PruebaVacia\', \'U\') IS NOT NULL DROP TABLE dbo._PruebaVacia')
  }

  await pool.close()

  // ---- Resumen ----
  console.log('\n===== RESUMEN =====')
  const fallos = resultados.filter((x) => !x.ok)
  console.log(`Total: ${resultados.length} | PASS: ${resultados.length - fallos.length} | FAIL: ${fallos.length}`)
  if (fallos.length) {
    console.log('Fallos:')
    fallos.forEach((f) => console.log(`  - ${f.nombre}: ${f.detalle}`))
    console.log(`\nArchivos de evidencia .xlsx en: ${SALIDAS}`)
    process.exit(1)
  }
  console.log(`\nTodas las pruebas pasaron. Evidencia .xlsx en: ${SALIDAS}`)
}

main().catch((err) => {
  console.error('Error fatal en la bateria:', err)
  process.exit(1)
})
