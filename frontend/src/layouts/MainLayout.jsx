import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';

import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import SportsRail from '../components/SportsRail.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { consultarSaldo } from '../services/saldoService.js';

/**
 * Layout principal de la zona autenticada.
 *
 * - Usuario: shell de sportsbook (TopBar + SportsRail + contenido + footer).
 * - Administrador: navbar + sidebar de backoffice, porque necesita los modulos
 *   de administracion.
 *
 * El chip de saldo usa GET /api/saldo (una unica peticion por montaje).
 */
export default function MainLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { esAdministrador } = useAuth();

  const cargarSaldo = useCallback(() => consultarSaldo(), []);
  const { datos: saldo } = usePeticion(cargarSaldo, []);

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="app-shell">
      <a className="enlace-saltar" href="#contenido-principal">
        Saltar al contenido principal
      </a>

      {esAdministrador ? (
        <Navbar onAbrirMenu={() => setMenuAbierto(true)} saldoTotal={saldo?.saldoTotal ?? null} />
      ) : (
        <>
          <TopBar saldoTotal={saldo?.saldoTotal ?? null} />
          <SportsRail />
        </>
      )}

      <div className="app-cuerpo">
        {esAdministrador && <Sidebar abierto={menuAbierto} onCerrar={cerrarMenu} />}

        {menuAbierto && (
          <button
            type="button"
            className="velo"
            aria-label="Cerrar menu de navegacion"
            onClick={cerrarMenu}
          />
        )}

        <main className="app-contenido" id="contenido-principal">
          <div className="contenedor">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer variante={esAdministrador ? 'sistema' : 'usuario'} />
    </div>
  );
}
