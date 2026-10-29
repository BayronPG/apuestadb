import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

/**
 * Ruta protegida: exige sesion activa.
 *
 * Uso como envoltura:
 *   <Route element={<ProtectedRoute />}>            ... rutas hijas ...
 * o con children:
 *   <ProtectedRoute><MainLayout /></ProtectedRoute>
 *
 * Sin sesion redirige a /login conservando el destino en `location.state.desde`
 * para volver despues de iniciar sesion.
 */
export default function ProtectedRoute({ children }) {
  const { estaAutenticado } = useAuth();
  const ubicacion = useLocation();

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }

  return children ?? <Outlet />;
}
