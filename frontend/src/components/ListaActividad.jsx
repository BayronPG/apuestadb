import Badge from './Badge.jsx';
import EmptyState from './EmptyState.jsx';
import Icono from './Icono.jsx';

/**
 * Lista de actividad (movimientos, notificaciones, auditoria, eventos).
 *
 * Props:
 *   - items    : Array<{
 *                  clave, icono, tono, titulo, meta, valor, valorTono, badge
 *                }>
 *                `titulo` y `meta` admiten ReactNode; `badge` es { texto, tipo }.
 *   - vacio    : { titulo, mensaje, icono }  Estado vacio.
 *   - cargando : boolean
 *
 * Ejemplo:
 *   <ListaActividad items={[{ clave: 1, icono: 'reloj', titulo: 'Recarga', meta: '12/09', valor: '$50.000', valorTono: 'abono' }]} />
 */
export default function ListaActividad({ items = [], vacio = {}, cargando = false }) {
  if (cargando) {
    return (
      <ul className="actividad" aria-busy="true">
        <li className="actividad__item">
          <span className="actividad__icono">
            <Icono nombre="reloj" tamano={18} />
          </span>
          <span className="actividad__cuerpo">
            <span className="actividad__titulo">Cargando...</span>
          </span>
        </li>
      </ul>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        titulo={vacio.titulo || 'Sin actividad'}
        mensaje={vacio.mensaje || 'No hay registros para mostrar.'}
        icono={vacio.icono || '📭'}
      />
    );
  }

  return (
    <ul className="actividad">
      {items.map((item) => (
        <li className="actividad__item" key={item.clave}>
          <span
            className={`actividad__icono ${
              item.tono && item.tono !== 'neutro' ? `actividad__icono--${item.tono}` : ''
            }`.trim()}
            aria-hidden="true"
          >
            <Icono nombre={item.icono || 'reloj'} tamano={18} />
          </span>

          <span className="actividad__cuerpo">
            <span className="actividad__titulo">{item.titulo}</span>
            {item.meta && <span className="actividad__meta">{item.meta}</span>}
          </span>

          {(item.valor || item.badge) && (
            <span className="actividad__lateral">
              {item.valor && (
                <span className={`monto ${item.valorTono ? `monto--${item.valorTono}` : ''}`.trim()}>
                  {item.valor}
                </span>
              )}
              {item.badge && <Badge tipo={item.badge.tipo}>{item.badge.texto}</Badge>}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
