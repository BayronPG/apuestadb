import { Link, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import Card from './Card.jsx';

/**
 * Ruta por rol: exige el rol indicado (por defecto `administrador`).
 * Debe anidarse dentro de ProtectedRoute, porque asume sesion activa.
 *
 * Props:
 *   - rol      : string    Rol requerido ('administrador' por defecto).
 *   - children : ReactNode Opcional; si no se pasa, renderiza <Outlet />.
 *
 * Si el usuario esta autenticado pero no tiene el rol, se muestra un aviso 403
 * en lugar de redirigir, para que el usuario entienda por que no ve la pantalla.
 */
export default function RoleRoute({ rol = 'administrador', children }) {
  const { esAdministrador, rol: rolActual } = useAuth();

  const autorizado = rol === 'administrador' ? esAdministrador : rolActual === rol;

  if (!autorizado) {
    return (
      <Card titulo="Acceso restringido" variante="acento">
        <p className="texto-suave">
          Esta seccion requiere el rol <strong>{rol}</strong>. Tu rol actual es{' '}
          <strong>{rolActual || 'sin sesion'}</strong>.
        </p>
        <Link className="btn btn--primario" to="/dashboard">
          Volver al panel
        </Link>
      </Card>
    );
  }

  return children ?? <Outlet />;
}
