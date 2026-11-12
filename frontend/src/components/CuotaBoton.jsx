import '../styles/sportsbook.css';

/**
 * Cuota táctil del sportsbook (átomo visual).
 *
 * Solo presentación: no conoce endpoints ni estado global. El consumidor decide
 * qué cuota está seleccionada y qué hacer al pulsarla.
 *
 * Props:
 *   - etiqueta      : string            Texto de la opción ("1", "X", "2", "Local").
 *   - valor         : number|string|null Cuota vigente; null = sin cuota.
 *   - detalle       : string|null        Línea secundaria opcional (ej. premio).
 *   - seleccionada  : boolean            Estado seleccionado.
 *   - deshabilitada : boolean            Estado no operable.
 *   - onSeleccionar : () => void         Callback al pulsar (no se llama si está inactiva).
 *   - nombreMercado : string             Contexto para lectores de pantalla.
 *
 * Ejemplo:
 *   <CuotaBoton etiqueta="1" valor={2.1} onSeleccionar={() => ...} />
 */
export default function CuotaBoton({
  etiqueta,
  valor = null,
  detalle = null,
  seleccionada = false,
  deshabilitada = false,
  onSeleccionar,
  nombreMercado = '',
  className = '',
  ...resto
}) {
  const numero = Number(valor);
  const sinCuota = valor === null || valor === undefined || !Number.isFinite(numero);
  const inactiva = deshabilitada || sinCuota;
  const valorVisible = sinCuota ? '—' : numero.toFixed(2);
  const descripcion = `${nombreMercado ? `${nombreMercado}: ` : ''}${etiqueta || 'opción'}, cuota ${
    sinCuota ? 'no disponible' : valorVisible
  }`;

  const clases = ['sb-cuota'];
  if (seleccionada) clases.push('sb-cuota--seleccionada');
  if (inactiva) clases.push('sb-cuota--deshabilitada');
  if (className) clases.push(className);

  return (
    <button
      type="button"
      className={clases.join(' ')}
      onClick={() => {
        if (inactiva || typeof onSeleccionar !== 'function') return;
        onSeleccionar();
      }}
      disabled={inactiva}
      aria-pressed={seleccionada}
      aria-label={descripcion}
      title={inactiva ? 'Cuota no disponible' : descripcion}
      {...resto}
    >
      <span className="sb-cuota__etiqueta">{etiqueta}</span>
      <span className="sb-cuota__valor">{valorVisible}</span>
      {detalle && <span className="sb-cuota__detalle">{detalle}</span>}
    </button>
  );
}
