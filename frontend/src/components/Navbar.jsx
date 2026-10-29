import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { iniciales, nombreCompleto, moneda } from '../utils/formato.js';
import Badge from './Badge.jsx';

/**
 * Barra superior de la aplicacion autenticada.
 *
 * Props:
 *   - onAbrirMenu : () => void  Abre el sidebar en pantallas pequenas.
 *   - saldoTotal  : number|null Saldo consolidado que muestra el chip (opcional).
 *
 * Incluye: marca, boton de menu (movil), chip de saldo, campana de
 * notificaciones y menu desplegable del usuario con cierre de sesion.
 */
export default function Navbar({ onAbrirMenu, saldoTotal = null }) {
  const { usuario, logout, esAdministrador } = useAuth();
  const navegar = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
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

  const cerrarSesion = () => {
    setMenuAbierto(false);
    logout();
    navegar('/login', { replace: true });
  };

  return (
    <header className="navbar" ref={contenedor}>
      <button
        type="button"
        className="btn btn--fantasma btn--sm navbar__boton-menu"
        onClick={onAbrirMenu}
        aria-label="Abrir menu de navegacion"
      >
        ☰
      </button>

      <Link to={esAdministrador ? '/admin' : '/dashboard'} className="navbar__marca">
        <span className="navbar__logo" aria-hidden="true">
          AD
        </span>
        <span className="navbar__titulo">
          <strong>ApuestaDB</strong>
          <span>Apuestas simuladas · Bases de Datos 2</span>
        </span>
      </Link>

      <div className="navbar__envios">
        {saldoTotal !== null && (
          <div className="navbar__saldo">
            <span className="etiqueta">Saldo ficticio</span>
            <span className="valor">{moneda(saldoTotal)}</span>
          </div>
        )}

        <Link className="btn btn--fantasma btn--sm" to="/notificaciones" aria-label="Notificaciones">
          🔔 <span className="solo-lectores">Notificaciones</span>
        </Link>

        <button
          type="button"
          className="navbar__avatar"
          onClick={() => setMenuAbierto((valor) => !valor)}
          aria-haspopup="menu"
          aria-expanded={menuAbierto}
          aria-label="Menu del usuario"
        >
          {iniciales(usuario?.nombres, usuario?.apellidos)}
        </button>

        {menuAbierto && (
          <div className="navbar__desplegable" role="menu">
            <div className="pila" style={{ gap: 4, padding: '8px 12px 12px' }}>
              <strong>{nombreCompleto(usuario)}</strong>
              <span className="texto-suave texto-pequeno">{usuario?.correo}</span>
              <Badge tipo={esAdministrador ? 'primario' : 'info'}>{usuario?.rol}</Badge>
            </div>
            <hr className="separador" style={{ margin: '4px 0' }} />
            <Link to="/perfil" role="menuitem" onClick={() => setMenuAbierto(false)}>
              Mi perfil
            </Link>
            <Link to="/saldo" role="menuitem" onClick={() => setMenuAbierto(false)}>
              Mi saldo
            </Link>
            <Link to="/apuestas" role="menuitem" onClick={() => setMenuAbierto(false)}>
              Mis apuestas
            </Link>
            <button type="button" role="menuitem" onClick={cerrarSesion}>
              Cerrar sesion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
