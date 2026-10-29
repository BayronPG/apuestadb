import { NavLink } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

/**
 * Navegacion lateral de la aplicacion autenticada.
 *
 * Props:
 *   - abierto  : boolean    Controla el panel deslizante en pantallas <= 1024px.
 *   - onCerrar : () => void Se invoca al elegir un enlace o tocar el velo.
 *
 * Los enlaces de administracion solo se muestran al rol `administrador`
 * (la proteccion real la aplica RoleRoute).
 */

const ENLACES_USUARIO = [
  { a: '/dashboard', etiqueta: 'Panel', icono: '🏠' },
  { a: '/eventos', etiqueta: 'Eventos activos', icono: '⚽' },
  { a: '/eventos/finalizados', etiqueta: 'Eventos finalizados', icono: '🏁' },
  { a: '/apuestas/nueva', etiqueta: 'Crear apuesta', icono: '🎫' },
  { a: '/apuestas', etiqueta: 'Historial de apuestas', icono: '📄' },
  { a: '/saldo', etiqueta: 'Mi saldo', icono: '💰' },
  { a: '/saldo/movimientos', etiqueta: 'Movimientos', icono: '🔁' },
  { a: '/notificaciones', etiqueta: 'Notificaciones', icono: '🔔' },
  { a: '/perfil', etiqueta: 'Mi perfil', icono: '👤' },
];

const ENLACES_ADMIN = [
  { a: '/admin', etiqueta: 'Panel administrativo', icono: '🛠️' },
  { a: '/admin/reportes', etiqueta: 'Reportes', icono: '📊' },
  { a: '/ranking', etiqueta: 'Ranking de usuarios', icono: '🏆' },
];

export default function Sidebar({ abierto = false, onCerrar = () => {} }) {
  const { esAdministrador } = useAuth();

  const clase = abierto ? 'sidebar sidebar--abierto' : 'sidebar';

  const enlace = ({ a, etiqueta, icono }) => (
    <NavLink
      key={a}
      to={a}
      end={a === '/admin' || a === '/dashboard' || a === '/apuestas' || a === '/saldo' || a === '/eventos'}
      className={({ isActive }) => (isActive ? 'sidebar__enlace activo' : 'sidebar__enlace')}
      onClick={onCerrar}
    >
      <span className="sidebar__icono" aria-hidden="true">
        {icono}
      </span>
      {etiqueta}
    </NavLink>
  );

  return (
    <nav className={clase} id="navegacion-lateral" aria-label="Navegacion principal">
      <span className="sidebar__grupo-titulo">Operacion</span>
      {ENLACES_USUARIO.map(enlace)}

      {esAdministrador && (
        <>
          <span className="sidebar__grupo-titulo">Administracion</span>
          {ENLACES_ADMIN.map(enlace)}
        </>
      )}

      <span className="sidebar__grupo-titulo">Ayuda</span>
      <span className="sidebar__enlace" style={{ cursor: 'default' }}>
        <span className="sidebar__icono" aria-hidden="true">
          ⚠️
        </span>
        Saldo ficticio, sin dinero real
      </span>
    </nav>
  );
}
