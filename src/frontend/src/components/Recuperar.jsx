import { Link } from 'react-router-dom'
import './Recuperar.css'

function Recuperar() {
  return (
    <div className="pagina-recuperar">
      <div className="card">
        <div className="logo">
          <div className="logo-badge">AD</div>
          <div>
            <h1>ApuestaDB</h1>
            <p>apuestas deportivas simuladas</p>
          </div>
        </div>

        <h2 className="titulo">Recuperar contraseña</h2>
        <p className="descripcion">
          Ingresa el correo con el que te registraste y te enviaremos un enlace
          para restablecer tu contraseña.{' '}
          <em>
            (Simulado: en el proyecto académico el envío de correo real queda pendiente de definir.)
          </em>
        </p>

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
          <button type="submit" className="btn">Enviar enlace de recuperación</button>
        </form>

        {/* Ejemplo de mensaje de éxito (se muestra tras enviar) */}
        <div className="exito">
          ✅ Si el correo existe, recibirás un enlace para restablecer tu contraseña (simulado).
        </div>

        <span className="volver">
          <Link to="/">← Volver a iniciar sesión</Link>
        </span>
      </div>

      <footer className="app-footer">
        Proyecto académico — Bases de Datos 2 · Tecnológico de Antioquia<br />
        Saldo ficticio. No se utiliza ni se gestiona dinero real.
      </footer>
    </div>
  )
}

export default Recuperar
