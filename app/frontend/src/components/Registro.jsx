import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Registro.css'

function Registro() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombreCompleto: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    correo: '',
    celular: '',
    clave: '',
    clave2: '',
    aceptaTerminos: false,
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  function cambiar(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function enviar(e) {
    e.preventDefault()
    setError('')

    // Validaciones del lado del cliente (el backend valida de nuevo)
    if (!form.aceptaTerminos) {
      setError('Debes aceptar la condición de proyecto académico para continuar.')
      return
    }
    if (form.clave.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres.')
      return
    }
    if (form.clave !== form.clave2) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    try {
      const r = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCompleto: form.nombreCompleto,
          tipoDocumento: form.tipoDocumento,
          numeroDocumento: form.numeroDocumento,
          correo: form.correo,
          celular: form.celular,
          clave: form.clave,
          clave2: form.clave2,
        }),
      })
      const d = await r.json().catch(() => ({}))

      if (r.ok) {
        navigate('/', { state: { aviso: d.mensaje || 'Cuenta creada correctamente. Ya puedes iniciar sesión.' } })
        return
      }
      // 400 (validacion), 409 (duplicado), 500 (interno): muestra el mensaje del backend
      setError(d.mensaje || 'No se pudo crear la cuenta. Inténtalo de nuevo.')
    } catch {
      setError('No se pudo conectar con el servidor. Verifica que el backend esté activo (npm start en app/backend).')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="pagina-registro">
      <div className="card">
        <div className="logo">
          <div className="logo-badge">AD</div>
          <div>
            <h1>ApuestaDB</h1>
            <p>apuestas deportivas simuladas</p>
          </div>
        </div>

        <p className="subtitulo">
          Crea tu cuenta para ver los eventos disponibles y gestionar tu saldo ficticio.
        </p>

        {error && <div className="alerta">⚠️ {error}</div>}

        <form onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="nombreCompleto">Nombre completo</label>
            <input
              type="text"
              id="nombreCompleto"
              name="nombreCompleto"
              placeholder="Nombres y apellidos"
              value={form.nombreCompleto}
              onChange={cambiar}
              required
            />
          </div>

          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="tipoDocumento">Tipo de documento</label>
              <select
                id="tipoDocumento"
                name="tipoDocumento"
                value={form.tipoDocumento}
                onChange={cambiar}
              >
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="TI">TI</option>
                <option value="PAS">PAS</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="numeroDocumento">Número de documento</label>
              <input
                type="text"
                id="numeroDocumento"
                name="numeroDocumento"
                placeholder="Sin puntos ni espacios"
                value={form.numeroDocumento}
                onChange={cambiar}
                required
              />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              type="email"
              id="correo"
              name="correo"
              placeholder="estudiante@correo.edu.co"
              value={form.correo}
              onChange={cambiar}
              autoComplete="username"
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="celular">Número de celular</label>
            <input
              type="tel"
              id="celular"
              name="celular"
              placeholder="3001234567"
              value={form.celular}
              onChange={cambiar}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="clave">Contraseña</label>
            <input
              type="password"
              id="clave"
              name="clave"
              placeholder="Mínimo 8 caracteres"
              value={form.clave}
              onChange={cambiar}
              autoComplete="new-password"
              required
            />
            <span className="ayuda">
              Mínimo 8 caracteres. No se almacena en texto plano (se guarda un hash con bcrypt).
            </span>
          </div>

          <div className="campo">
            <label htmlFor="clave2">Confirmar contraseña</label>
            <input
              type="password"
              id="clave2"
              name="clave2"
              placeholder="Repite la contraseña"
              value={form.clave2}
              onChange={cambiar}
              autoComplete="new-password"
              required
            />
          </div>

          <label className="terminos">
            <input
              type="checkbox"
              name="aceptaTerminos"
              checked={form.aceptaTerminos}
              onChange={cambiar}
            />
            <span>
              Acepto que este es un proyecto académico: el saldo y las apuestas son ficticios y no se utiliza dinero real.
            </span>
          </label>

          <button type="submit" className="btn" disabled={cargando}>
            {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="nota">
          ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
        </p>
      </div>

      <footer className="app-footer">
        Proyecto académico — Bases de Datos 2 · Tecnológico de Antioquia<br />
        Saldo ficticio. No se utiliza ni se gestiona dinero real.
      </footer>
    </div>
  )
}

export default Registro
