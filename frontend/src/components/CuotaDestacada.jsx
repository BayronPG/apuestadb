import { Link } from 'react-router-dom';

/**
 * Cuota destacada: pieza compacta con el mercado, la etiqueta de la opcion y el
 * valor de la cuota vigente.
 *
 * Props:
 *   - mercado    : string        Nombre del mercado (ej. "Ganador del partido").
 *   - etiqueta   : string        Etiqueta de la opcion (ej. "Local").
 *   - valor      : number|string Cuota vigente (null -> "sin cuota").
 *   - detalle    : string        Nota opcional (opcional).
 *   - tono       : 'primario' | 'acento'
 *   - to         : string        Ruta interna; con valor la pieza es un enlace.
 *   - deshabilitada : boolean    Marca la cuota como no operable.
 *
 * Ejemplo:
 *   <CuotaDestacada mercado="Ganador" etiqueta="Local" valor={1.85} to="/apuestas/nueva?evento=1" />
 */
export default function CuotaDestacada({
  mercado,
  etiqueta,
  valor,
  detalle,
  tono = 'primario',
  to,
  deshabilitada = false,
}) {
  const sinCuota = valor === null || valor === undefined || valor === '';
  const numeroCuota = sinCuota ? null : Number(valor);

  const clases = [
    'cuota-destacada',
    tono === 'acento' ? 'cuota-destacada--acento' : '',
    to ? 'cuota-destacada--enlace' : '',
    deshabilitada ? 'cuota-destacada--deshabilitada' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const contenido = (
    <>
      {mercado && <span className="cuota-destacada__mercado">{mercado}</span>}
      <span className="cuota-destacada__etiqueta">{etiqueta}</span>
      <span
        className={`cuota-destacada__valor${
          tono === 'acento' ? ' cuota-destacada__valor--acento' : ''
        }${sinCuota ? ' cuota-destacada__valor--apagado' : ''}`}
      >
        {sinCuota ? 'sin cuota' : numeroCuota.toFixed(2)}
      </span>
      {detalle && <span className="cuota-destacada__detalle">{detalle}</span>}
    </>
  );

  if (to) {
    return (
      <Link className={clases} to={to}>
        {contenido}
      </Link>
    );
  }

  return <span className={clases}>{contenido}</span>;
}
