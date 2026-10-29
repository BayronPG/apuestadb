import { Link, Outlet } from 'react-router-dom';

/**
 * Layout de las pantallas publicas de autenticacion
 * (/login, /registro, /recuperar).
 *
 * Columna izquierda informativa (solo escritorio) y columna derecha con el
 * formulario. No aplica navbar/sidebar porque no hay sesion.
 */
export default function AuthLayout() {
  return (
    <div className="auth">
      <aside className="auth__lateral">
        <span className="navbar__logo" aria-hidden="true">
          AD
        </span>
        <h2>ApuestaDB</h2>
        <p className="texto-suave">
          Simulador academico de apuestas deportivas para la asignatura Bases de Datos 2 del
          Tecnologico de Antioquia.
        </p>
        <ul>
          <li>Saldo ficticio (tokens y PSE), sin dinero real.</li>
          <li>Cuotas, mercados y liquidacion calculados en SQL Server.</li>
          <li>Historial de apuestas, movimientos, notificaciones y ranking.</li>
        </ul>
        <p className="texto-pequeno texto-suave">
          El acceso usa autenticacion JWT contra la API local
          (<code>http://localhost:4000/api</code>).
        </p>
      </aside>

      <section className="auth__panel">
        <div className="auth__caja">
          <div className="auth__marca">
            <span className="navbar__logo" aria-hidden="true">
              AD
            </span>
            <div className="navbar__titulo">
              <strong>ApuestaDB</strong>
              <span>Bases de Datos 2 · Tecnologico de Antioquia</span>
            </div>
          </div>

          <Outlet />

          <hr className="separador" />
          <p className="texto-pequeno texto-suave centrado">
            Proyecto academico · <Link to="/login">Volver al inicio de sesion</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
