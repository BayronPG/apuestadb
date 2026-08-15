import { Link } from 'react-router-dom'
import './InicioSesion.css'

function InicioSesion() {
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

        {/* Ejemplo de mensaje de error (se muestra cuando las credenciales no coinciden) */}
        <div className="alerta">⚠️ Credenciales incorrectas. Verifica tu correo y contraseña.</div>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="campo">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              type="email"
              id="correo"
              name="correo"
              placeholder="estudiante@correo.edu.co"
              defaultValue="jhon@correo.edu.co"
            />
          </div>

          <div className="campo">
            <label htmlFor="clave">Contraseña</label>
            <input
              type="password"
              id="clave"
              name="clave"
              placeholder="••••••••"
              defaultValue="12345678"
            />
          </div>

          <div className="fila">
            <label>
              <input type="checkbox" /> Recordarme
            </label>
            <Link to="/recuperar">¿Olvidaste tu contraseña?</Link>
          </div>

          <button type="submit" className="btn">Ingresar</button>
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
