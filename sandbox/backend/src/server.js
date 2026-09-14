import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import authRoutes from './routes/auth.routes.js'
import { getPool } from './db.js'

const app = express()
app.use(express.json())

// Sesion del usuario guardada en el servidor; el navegador conserva solo una
// cookie httpOnly (no legible desde JS del frontend).
// MemoryStore es suficiente para el sandbox academico: las sesiones se pierden
// al reiniciar el proceso. Para produccion se usaria un store persistente.
app.use(
  session({
    name: 'apuestadb.sid',
    secret: process.env.SESSION_SECRET || 'secreto-sandbox-local',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // solo HTTP local (desarrollo)
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
    },
  }),
)

// Rutas
app.use('/api/auth', authRoutes)

// GET /api/health — verifica que el backend responde y que la BD es alcanzable
app.get('/api/health', async (_req, res) => {
  try {
    const pool = await getPool()
    await pool.request().query('SELECT 1 AS ok')
    return res.json({ ok: true, bd: process.env.DB_NAME, hora: new Date().toISOString() })
  } catch (err) {
    console.error('Health check fallido:', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// 404 JSON para rutas /api desconocidas
app.use('/api', (_req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' })
})

// Manejador de errores global (JSON)
app.use((err, _req, res, _next) => {
  console.error('Error no controlado:', err)
  if (res.headersSent) return
  res.status(500).json({ mensaje: 'Error interno del servidor.' })
})

const PORT = Number(process.env.PORT || 3000)
app.listen(PORT, () => {
  console.log(`Backend ApuestaDB escuchando en http://localhost:${PORT}`)
})
