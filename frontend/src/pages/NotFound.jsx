import { Link } from 'react-router-dom';

import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Pagina 404. Ruta: * (cualquier direccion no declarada).
 * Ofrece el camino de regreso segun haya sesion o no.
 */
export default function NotFound() {
  const { estaAutenticado, esAdministrador } = useAuth();

  const destino = estaAutenticado ? (esAdministrador ? '/admin' : '/dashboard') : '/login';

  return (
    <div className="app-shell">
      <main className="app-contenido">
        <div className="contenedor">
          <div className="card" style={{ maxWidth: 560, margin: '10vh auto' }}>
            <EmptyState
              icono="🧭"
              titulo="404 - Pagina no encontrada"
              mensaje="La direccion solicitada no existe en ApuestaDB. Verifica el enlace o vuelve al panel."
              accion={
                <>
                  <Link className="btn btn--primario" to={destino}>
                    {estaAutenticado ? 'Ir al panel' : 'Iniciar sesion'}
                  </Link>
                  <Link className="btn btn--secundario" to="/eventos">
                    Ver eventos activos
                  </Link>
                </>
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
