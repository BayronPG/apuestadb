import ExcelJS from 'exceljs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPool, sql } from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TMP_DIR = path.resolve(__dirname, '../../tmp')

function dos(n) {
  return String(n).padStart(2, '0')
}

/**
 * Exporta las tablas indicadas (ya validadas contra la BD) a un libro .xlsx.
 * - Una hoja por tabla, con los nombres de columna como encabezados.
 * - Lectura en streaming (tablas grandes no se cargan completas en memoria).
 * - Escritura con WorkbookWriter de ExcelJS (streaming a archivo temporal).
 * Devuelve { ruta, nombreArchivo }.
 */
export async function exportarTablasAXlsx(tablasValidas) {
  fs.mkdirSync(TMP_DIR, { recursive: true })

  const ahora = new Date()
  const sello = `${ahora.getFullYear()}${dos(ahora.getMonth() + 1)}${dos(ahora.getDate())}_${dos(ahora.getHours())}${dos(ahora.getMinutes())}${dos(ahora.getSeconds())}`
  // Nombre base (formato solicitado). Si ya existe un archivo del mismo segundo,
  // se agrega un sufijo numerico para evitar colisiones y perdida de datos.
  let nombreArchivo = `ApuestaDB_exportacion_${sello}.xlsx`
  let contador = 2
  while (fs.existsSync(path.join(TMP_DIR, nombreArchivo))) {
    nombreArchivo = `ApuestaDB_exportacion_${sello}_${contador}.xlsx`
    contador += 1
  }
  const ruta = path.join(TMP_DIR, nombreArchivo)

  const pool = await getPool()
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: ruta, useStyles: true })

  for (const tabla of tablasValidas) {
    // Columnas reales de la tabla (orden de definicion) -> encabezados
    const col = await pool
      .request()
      .input('tabla', sql.NVarChar(128), tabla)
      .query(
        `SELECT c.name
         FROM sys.columns c
         JOIN sys.tables t ON t.object_id = c.object_id
         WHERE t.name = @tabla
         ORDER BY c.column_id`,
      )
    const columnas = col.recordset.map((r) => r.name)

    const hoja = workbook.addWorksheet(tabla, { views: [{ state: 'frozen', ySplit: 1 }] })

    // Fila de encabezados en negrita
    const filaEncabezados = hoja.addRow(columnas)
    filaEncabezados.eachCell((celda) => {
      celda.font = { bold: true }
    })
    filaEncabezados.commit()

    // Datos en streaming (SELECT * de la tabla, con nombres de columna)
    await new Promise((resolve, reject) => {
      const req = pool.request()
      req.stream = true
      req.useColumnNames = true

      req.on('error', reject)
      req.on('row', (fila) => {
        const valores = columnas.map((nombreCol) => {
          const v = fila[nombreCol]
          // null/undefined quedan como celda vacia; fechas/JS Date, numeros y
          // booleanos conservan su tipo nativo (ExcelJS los escribe correctamente).
          return v === null || v === undefined ? null : v
        })
        hoja.addRow(valores).commit()
      })
      req.on('done', async () => {
        try {
          hoja.commit()
          resolve()
        } catch (err) {
          reject(err)
        }
      })

      // Tabla ya validada contra sys.tables: el identificador va entre corchetes y
      // no puede contener caracteres de cierre (validacion previa por nombre exacto).
      req.query(`SELECT * FROM [${tabla}]`)
    })
  }

  await workbook.commit()
  return { ruta, nombreArchivo }
}
