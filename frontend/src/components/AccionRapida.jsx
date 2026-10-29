import { Link } from 'react-router-dom';

import Icono from './Icono.jsx';

/**
 * Acceso rapido del dashboard: tarjeta-enlace con icono, titulo y descripcion.
 *
 * Props:
 *   - to          : string  Ruta interna de React Router.
 *   - titulo      : string
 *   - descripcion : string  (opcional)
 *   - icono       : string  Nombre del icono en Icono.jsx.
 *   - onClick     : () => void  Accion alternativa (se usa si no hay `to`).
 *
 * Ejemplo:
 *   <AccionRapida to="/eventos" icono="balon" titulo="Ver eventos" descripcion="Cartelera activa" />
 */
export default function AccionRapida({ to, titulo, descripcion, icono = 'rayo', onClick }) {
  const contenido = (
    <>
      <span className="acceso__icono" aria-hidden="true">
        <Icono nombre={icono} tamano={20} />
      </span>
      <span className="acceso__texto">
        <span className="acceso__titulo">{titulo}</span>
        {descripcion && <span className="acceso__descripcion">{descripcion}</span>}
      </span>
    </>
  );

  if (to) {
    return (
      <Link className="acceso" to={to}>
        {contenido}
      </Link>
    );
  }

  return (
    <button type="button" className="acceso" onClick={onClick}>
      {contenido}
    </button>
  );
}
