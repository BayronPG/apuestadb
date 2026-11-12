import { NavLink } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import Icono from './Icono.jsx';

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
  { a: '/dashboard', etiqueta: 'Panel', icono: 'eventos' },
  { a: '/eventos', etiqueta: 'Eventos activos', icono: 'balon' },
  { a: '/eventos/finalizados', etiqueta: 'Eventos finalizados', icono: 'escudo' },
  { a: '/apuestas/nueva', etiqueta: 'Crear apuesta', icono: 'apuestas' },
  { a: '/apuestas', etiqueta: 'Historial de apuestas', icono: 'reporte' },
  { a: '/saldo', etiqueta: 'Mi saldo', icono: 'saldo' },
  { a: '/saldo/movimientos', etiqueta: 'Movimientos', icono: 'tendencia' },
  { a: '/notificaciones', etiqueta: 'Notificaciones', icono: 'campana' },
  { a: '/perfil', etiqueta: 'Mi perfil', icono: 'usuario' },
];

const ENLACES_ADMIN = [
  { a: '/admin', etiqueta: 'Panel administrativo', icono: 'rayas' },
  { a: '/admin/reportes', etiqueta: 'Reportes', icono: 'reporte' },
  { a: '/ranking', etiqueta: 'Ranking de usuarios', icono: 'ranking' },
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
        <Icono nombre={icono} tamano={18} />
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
          <Icono nombre="alerta" tamano={18} />
        </span>
        Saldo ficticio, sin dinero real
      </span>
    </nav>
  );
}
