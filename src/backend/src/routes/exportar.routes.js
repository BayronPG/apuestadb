import { Router } from 'express'
import fs from 'node:fs'
import { getPool, sql } from '../db.js'
import { requiereSesion, requiereAdmin } from '../middleware/auth.js'
import { exportarTablasAXlsx } from '../services/exportador.js'

const router = Router()

// GET /api/exportar/tablas — lista segura de tablas exportables (solo admin)
router.get('/tablas', requiereSesion, requiereAdmin, async (_req, res) => {
  try {
    const pool = await getPool()
    const r = await pool.request().query(
      `SELECT t.name AS nombre,
              (SELECT SUM(s.row_count)
               FROM sys.dm_db_partition_stats s
               WHERE s.object_id = t.object_id AND s.index_id IN (0, 1)) AS filas
       FROM sys.tables t
       ORDER BY t.name`,
    )
    return res.json({
      tablas: r.recordset.map((x) => ({ nombre: x.nombre, filas: Number(x.filas ?? 0) })),
    })
  } catch (err) {
    console.error('Error listando tablas:', err)
    return res.status(500).json({ mensaje: 'Error al consultar las tablas de la base de datos.' })
  }
})

// GET /api/exportar?tablas=Usuario,Rol,... — genera el .xlsx (solo admin)
router.get('/', requiereSesion, requiereAdmin, async (req, res) => {
  try {
    const solicitadas = String(req.query.tablas ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (solicitadas.length === 0) {
      return res.status(400).json({ mensaje: 'Selecciona al menos una tabla para exportar.' })
    }

    // Lista segura: solo se aceptan nombres de tablas que existen realmente en la BD.
    const pool = await getPool()
    const r = await pool.request().query('SELECT name FROM sys.tables')
    const existentes = new Set(r.recordset.map((x) => x.name))

    const invalidas = solicitadas.filter((t) => !existentes.has(t))
    if (invalidas.length > 0) {
      return res
        .status(400)
        .json({ mensaje: `Las siguientes tablas no existen en la base de datos: ${invalidas.join(', ')}` })
    }

    const { ruta, nombreArchivo } = await exportarTablasAXlsx(solicitadas)

    res.download(ruta, nombreArchivo, (err) => {
      if (err) console.error('Error al enviar el archivo:', err)
      // Limpieza del archivo temporal
      fs.unlink(ruta, () => {})
    })
  } catch (err) {
    console.error('Error exportando:', err)
    if (!res.headersSent) {
      return res.status(500).json({ mensaje: `Error al exportar: ${err.message}` })
    }
    return res.end()
  }
})

export default router
