import { Link } from 'react-router-dom'
import './Registro.css'

function Registro() {
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

        {/* Ejemplo de mensaje de error (se muestra cuando la validación falla) */}
        <div className="alerta">⚠️ Las contraseñas no coinciden. Revísalas e inténtalo de nuevo.</div>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="campo">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              placeholder="Nombre y apellidos"
              defaultValue="Jhon Bayron Peláez Guerra"
            />
          </div>

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
              placeholder="Mínimo 8 caracteres"
              defaultValue="12345678"
            />
            <span className="ayuda">Mínimo 8 caracteres. No se almacena en texto plano (se guarda un hash).</span>
          </div>

          <div className="campo">
            <label htmlFor="clave2">Confirmar contraseña</label>
            <input
              type="password"
              id="clave2"
              name="clave2"
              placeholder="Repite la contraseña"
              defaultValue="12345678"
            />
          </div>

          <label className="terminos">
            <input type="checkbox" defaultChecked />
            <span>
              Acepto que este es un proyecto académico: el saldo y las apuestas son ficticios y no se utiliza dinero real.
            </span>
          </label>

          <button type="submit" className="btn">Crear cuenta</button>
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
