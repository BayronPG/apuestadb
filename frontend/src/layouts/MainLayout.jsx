import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';

import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { consultarSaldo } from '../services/saldoService.js';

/**
 * Layout principal de la zona autenticada: navbar + sidebar + contenido + footer.
 *
 * El sidebar es fijo en escritorio (> 1024px) y un panel deslizante con velo en
 * tablet y movil. El chip de saldo del navbar usa GET /api/saldo (una unica
 * peticion por montaje del layout).
 */
export default function MainLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cargarSaldo = useCallback(() => consultarSaldo(), []);
  const { datos: saldo } = usePeticion(cargarSaldo, []);

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="app-shell">
      <a className="enlace-saltar" href="#contenido-principal">
        Saltar al contenido principal
      </a>

      <Navbar onAbrirMenu={() => setMenuAbierto(true)} saldoTotal={saldo?.saldoTotal ?? null} />

      <div className="app-cuerpo">
        <Sidebar abierto={menuAbierto} onCerrar={cerrarMenu} />

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

      <Footer />
    </div>
  );
}
