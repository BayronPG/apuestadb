import { Navigate, Route, Routes } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout.jsx';
import MainLayout from '../layouts/MainLayout.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import RoleRoute from '../components/RoleRoute.jsx';

import Login from '../pages/Login.jsx';
import Registro from '../pages/Registro.jsx';
import RecuperarContrasena from '../pages/RecuperarContrasena.jsx';
import DashboardUsuario from '../pages/DashboardUsuario.jsx';
import DashboardAdministrador from '../pages/DashboardAdministrador.jsx';
import EventosActivos from '../pages/EventosActivos.jsx';
import EventosFinalizados from '../pages/EventosFinalizados.jsx';
import CrearApuesta from '../pages/CrearApuesta.jsx';
import HistorialApuestas from '../pages/HistorialApuestas.jsx';
import SaldoUsuario from '../pages/SaldoUsuario.jsx';
import HistorialMovimientos from '../pages/HistorialMovimientos.jsx';
import Notificaciones from '../pages/Notificaciones.jsx';
import PerfilUsuario from '../pages/PerfilUsuario.jsx';
import RankingUsuarios from '../pages/RankingUsuarios.jsx';
import ReportesAdministrativos from '../pages/ReportesAdministrativos.jsx';
import NotFound from '../pages/NotFound.jsx';

/**
 * Arbol de rutas.
 *
 *   /login, /registro, /recuperar      -> AuthLayout (publicas)
 *   resto                               -> ProtectedRoute + MainLayout
 *   /admin, /admin/reportes, /ranking   -> ademas RoleRoute('administrador')
 *   *                                   -> NotFound
 *
 * La ruta /ranking y las acciones administrativas requieren rol administrador,
 * igual que en el backend (middlewares/roles.js).
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* ---------------------------- Publicas ---------------------------- */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar" element={<RecuperarContrasena />} />
      </Route>

      {/* ------------------------- Zona autenticada ----------------------- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<DashboardUsuario />} />
          <Route path="/eventos" element={<EventosActivos />} />
          <Route path="/eventos/finalizados" element={<EventosFinalizados />} />
          <Route path="/apuestas/nueva" element={<CrearApuesta />} />
          <Route path="/apuestas" element={<HistorialApuestas />} />
          <Route path="/saldo" element={<SaldoUsuario />} />
          <Route path="/saldo/movimientos" element={<HistorialMovimientos />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/perfil" element={<PerfilUsuario />} />

          {/* ------------------- Solo administrador ------------------------ */}
          <Route element={<RoleRoute rol="administrador" />}>
            <Route path="/admin" element={<DashboardAdministrador />} />
            <Route path="/admin/reportes" element={<ReportesAdministrativos />} />
            <Route path="/ranking" element={<RankingUsuarios />} />
          </Route>
        </Route>
      </Route>

      {/* ----------------------------- 404 ----------------------------- */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
