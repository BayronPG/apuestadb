import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './InicioSesion.css'

function InicioSesion() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refrescar } = useAuth()

  // Mensaje de exito proveniente de otra pantalla (p. ej. tras registrarse)
  const aviso = location.state?.aviso

  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, clave }),
      })
      const d = await r.json().catch(() => ({}))

      if (r.ok) {
        await refrescar()
        navigate('/home')
        return
      }
      // Mensajes claros cuando las credenciales son incorrectas
      setError(d.mensaje || 'No se pudo iniciar sesión. Inténtalo de nuevo.')
    } catch {
      setError('No se pudo conectar con el servidor. Verifica que el backend esté activo (npm start en src/backend).')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="pagina-login">
      <div className="card">
        <div className="logo">
          <div className="logo-badge">AD</div>
          <div>
            <h1>ApuestaDB</h1>
            <p>apuestas deportivas simuladas</p>
          </div>
        </div>

        <p className="subtitulo">
          Inicia sesión para ver los eventos disponibles y gestionar tu saldo ficticio.
        </p>

        {aviso && <div className="aviso-exito">{aviso}</div>}
        {error && <div className="alerta">⚠️ {error}</div>}

        <form onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              type="email"
              id="correo"
              name="correo"
              placeholder="estudiante@correo.edu.co"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="clave">Contraseña</label>
            <input
              type="password"
              id="clave"
              name="clave"
              placeholder="••••••••"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="fila">
            <label>
              <input type="checkbox" /> Recordarme
            </label>
            <Link to="/recuperar">¿Olvidaste tu contraseña?</Link>
          </div>

          <button type="submit" className="btn" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="nota">
          ¿No tienes cuenta? <Link to="/registrar">Regístrate</Link>
        </p>
      </div>

      <footer className="app-footer">
        Proyecto académico — Bases de Datos 2 · Tecnológico de Antioquia<br />
        Saldo ficticio. No se utiliza ni se gestiona dinero real.
      </footer>
    </div>
  )
}

export default InicioSesion
