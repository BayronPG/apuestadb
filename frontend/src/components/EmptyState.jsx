/**
 * Estado vacio para listas y tablas sin datos.
 *
 * Props:
 *   - titulo   : string
 *   - mensaje  : string
 *   - icono    : string  Emoji o texto corto.
 *   - accion   : ReactNode (opcional)
 *
 * Ejemplo:
 *   <EmptyState titulo="Sin eventos" mensaje="No hay eventos programados." icono="⚽" />
 */
export default function EmptyState({ titulo = 'Sin datos', mensaje, icono = '📭', accion, className = '' }) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <span className="empty-state__icono" aria-hidden="true">
        {icono}
      </span>
      <h3>{titulo}</h3>
      {mensaje && <p>{mensaje}</p>}
      {accion && <div className="fila">{accion}</div>}
    </div>
  );
}
