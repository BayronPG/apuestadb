import EmptyState from './EmptyState.jsx';
import Loader from './Loader.jsx';

/**
 * Tabla generica con desplazamiento horizontal en pantallas pequenas.
 *
 * Props:
 *   - columnas  : Array<{ clave: string, titulo: string, render?: (fila) => ReactNode,
 *                         alineacion?: 'izq'|'der', ancho?: string }>
 *   - filas     : Array<object>
 *   - cargando  : boolean
 *   - vacio      : { titulo, mensaje, icono? }
 *   - claveFila : (fila, indice) => string|number  Clave estable de React.
 *   - compacta  : boolean
 *   - className : string
 *
 * Ejemplo:
 *   <Table
 *     columnas={[{ clave: 'monto', titulo: 'Monto', alineacion: 'der', render: (f) => moneda(f.monto) }]}
 *     filas={movimientos}
 *     vacio={{ titulo: 'Sin movimientos' }}
 *   />
 */
export default function Table({
  columnas = [],
  filas = [],
  cargando = false,
  vacio = {},
  claveFila,
  compacta = false,
  className = '',
}) {
  if (cargando) {
    return <Loader bloque texto="Cargando datos..." />;
  }

  if (!filas || filas.length === 0) {
    return (
      <EmptyState
        titulo={vacio.titulo || 'Sin resultados'}
        mensaje={vacio.mensaje || 'No hay informacion para mostrar con los filtros actuales.'}
        icono={vacio.icono || '📭'}
      />
    );
  }

  const claseTabla = compacta ? 'tabla tabla--compacta' : 'tabla';

  return (
    <div className={`tabla-envoltura ${className}`.trim()}>
      <table className={claseTabla}>
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th
                key={columna.clave}
                scope="col"
                style={columna.ancho ? { width: columna.ancho } : undefined}
                className={columna.alineacion === 'der' ? 'num' : undefined}
              >
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, indice) => (
            <tr key={claveFila ? claveFila(fila, indice) : indice}>
              {columnas.map((columna) => (
                <td
                  key={columna.clave}
                  className={columna.alineacion === 'der' ? 'num' : undefined}
                >
                  {columna.render ? columna.render(fila, indice) : fila[columna.clave]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
