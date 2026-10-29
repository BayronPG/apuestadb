/**
 * Barra de progreso etiquetada (proporciones del resumen del dashboard).
 *
 * Props:
 *   - etiqueta    : string
 *   - valor       : number   Valor alcanzado.
 *   - total       : number   Base del calculo (si es 0, la barra queda en 0 %).
 *   - textoValor  : string   Texto del extremo derecho (por defecto "valor/total").
 *   - detalle     : string   Nota bajo la barra (opcional).
 *   - tono        : 'normal' | 'exito' | 'error' | 'advertencia' | 'info'
 *
 * Ejemplo:
 *   <ProgressBar etiqueta="Apuestas ganadas" valor={7} total={11} tono="exito" />
 */
export default function ProgressBar({
  etiqueta,
  valor = 0,
  total = 0,
  textoValor,
  detalle,
  tono = 'normal',
}) {
  const base = Number(total) || 0;
  const alcanzado = Number(valor) || 0;
  const porcentaje = base > 0 ? Math.min(100, Math.round((alcanzado / base) * 100)) : 0;
  const claseTono = tono === 'normal' ? '' : `progreso--${tono}`;

  return (
    <div className={`progreso ${claseTono}`.trim()}>
      <div className="progreso__cabecera">
        <span className="progreso__etiqueta">{etiqueta}</span>
        <span className="progreso__valor">
          {textoValor || `${porcentaje}%`}
        </span>
      </div>

      <div
        className="progreso__riel"
        role="progressbar"
        aria-label={etiqueta}
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progreso__relleno" style={{ width: `${porcentaje}%` }} />
      </div>

      {detalle && <span className="progreso__detalle">{detalle}</span>}
    </div>
  );
}
