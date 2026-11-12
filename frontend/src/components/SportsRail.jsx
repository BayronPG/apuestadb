import { Link, useLocation } from 'react-router-dom';

/**
 * Carril de deportes del sportsbook.
 *
 * Cada chip lleva el filtro al listado de eventos (`?deporte=`), que
 * EventosActivos lee al montar. No inventa deportes con datos: si no hay
 * eventos de ese deporte, la cartelera muestra su estado vacio.
 */

const DEPORTES = [
  { clave: '', etiqueta: 'Todos' },
  { clave: 'Futbol', etiqueta: 'Futbol' },
  { clave: 'Baloncesto', etiqueta: 'Baloncesto' },
  { clave: 'Tenis', etiqueta: 'Tenis' },
  { clave: 'eSports', etiqueta: 'eSports' },
];

export default function SportsRail() {
  const { pathname, search } = useLocation();
  const parametros = new URLSearchParams(search);
  const activo = parametros.get('deporte') || '';
  const enEventos = pathname.startsWith('/eventos');

  return (
    <nav className="sb-rail" aria-label="Deportes disponibles">
      <div className="sb-rail__pista">
        {DEPORTES.map((deporte) => {
          const seleccionado = enEventos && activo === deporte.clave;
          return (
            <Link
              key={deporte.etiqueta}
              to={deporte.clave ? `/eventos?deporte=${encodeURIComponent(deporte.clave)}` : '/eventos'}
              className={`sb-rail__chip ${seleccionado ? 'sb-rail__chip--activo' : ''}`.trim()}
              aria-current={seleccionado ? 'page' : undefined}
            >
              {deporte.etiqueta}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
