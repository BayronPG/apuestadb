import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { iniciales, moneda, nombreCompleto } from '../utils/formato.js';
import Badge from './Badge.jsx';
import Icono from './Icono.jsx';

/**
 * Barra superior del sportsbook (zona de usuario).
 *
 * Reemplaza al navbar + sidebar en las pantallas de juego: marca, accesos de
 * deportes, buscador, saldo y menu de cuenta.
 *
 * Props:
 *   - saldoTotal : number|null  Saldo consolidado (GET /api/saldo en el layout).
 */
export default function TopBar({ saldoTotal = null }) {
  const { usuario, logout, esAdministrador } = useAuth();
  const navegar = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const contenedor = useRef(null);

  useEffect(() => {
    function alClicFuera(evento) {
      if (contenedor.current && !contenedor.current.contains(evento.target)) {
        setMenuAbierto(false);
      }
    }
    function alEscape(evento) {
      if (evento.key === 'Escape') setMenuAbierto(false);
    }
    document.addEventListener('mousedown', alClicFuera);
    document.addEventListener('keydown', alEscape);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      document.removeEventListener('keydown', alEscape);
    };
  }, []);

  const buscar = (evento) => {
    evento.preventDefault();
    const texto = busqueda.trim();
    navegar(texto ? `/eventos?q=${encodeURIComponent(texto)}` : '/eventos');
  };

  const cerrarSesion = () => {
    setMenuAbierto(false);
    logout();
    navegar('/login', { replace: true });
  };

  return (
    <header className="sb-topbar" ref={contenedor}>
      <Link to="/dashboard" className="sb-topbar__marca">
        <span className="sb-topbar__logo" aria-hidden="true">
          AD
        </span>
        <span className="sb-topbar__nombre">ApuestaDB</span>
      </Link>

      <nav className="sb-topbar__nav" aria-label="Deportes">
        <Link to="/eventos" className="sb-topbar__enlace">
          Deportes
        </Link>
        <Link to="/eventos" className="sb-topbar__enlace sb-topbar__enlace--vivo">
          <span className="sb-punto-vivo" aria-hidden="true" />
          En vivo
        </Link>
        <Link to="/eventos" className="sb-topbar__enlace">
          Proximos
        </Link>
      </nav>

      <form className="sb-topbar__buscador" onSubmit={buscar} role="search">
        <Icono nombre="buscar" tamano={16} />
        <input
          type="search"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar equipo o liga"
          aria-label="Buscar equipo o liga"
        />
      </form>

      <div className="sb-topbar__acciones">
        <Link to="/saldo" className="sb-topbar__saldo">
          <span className="sb-topbar__saldo-etiqueta">Saldo</span>
          <strong>{saldoTotal === null ? '—' : moneda(saldoTotal)}</strong>
        </Link>

        <Link to="/notificaciones" className="sb-topbar__icono" aria-label="Notificaciones">
          <Icono nombre="campana" tamano={18} />
        </Link>

        <button
          type="button"
          className="sb-topbar__avatar"
          onClick={() => setMenuAbierto((valor) => !valor)}
          aria-haspopup="menu"
          aria-expanded={menuAbierto}
          aria-label="Menu de la cuenta"
        >
          {iniciales(usuario?.nombres, usuario?.apellidos)}
        </button>

        {menuAbierto && (
          <div className="sb-topbar__menu" role="menu">
            <div className="sb-topbar__menu-cabecera">
              <strong>{nombreCompleto(usuario)}</strong>
              <span>{usuario?.correo}</span>
              <Badge tipo={esAdministrador ? 'primario' : 'info'}>{usuario?.rol}</Badge>
            </div>
            <Link to="/apuestas" role="menuitem" onClick={() => setMenuAbierto(false)}>
              Mis apuestas
            </Link>
            <Link to="/saldo" role="menuitem" onClick={() => setMenuAbierto(false)}>
              Mi saldo
            </Link>
            <Link to="/saldo/movimientos" role="menuitem" onClick={() => setMenuAbierto(false)}>
              Movimientos
            </Link>
            <Link to="/perfil" role="menuitem" onClick={() => setMenuAbierto(false)}>
              Mi perfil
            </Link>
            <Link to="/ranking" role="menuitem" onClick={() => setMenuAbierto(false)}>
              Ranking
            </Link>
            {esAdministrador && (
              <Link to="/admin" role="menuitem" onClick={() => setMenuAbierto(false)}>
                Panel administrador
              </Link>
            )}
            <button type="button" role="menuitem" onClick={cerrarSesion}>
              Cerrar sesion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
