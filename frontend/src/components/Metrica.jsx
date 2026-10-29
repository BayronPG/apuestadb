/**
 * Tarjeta de metrica (indicador numerico destacado).
 *
 * Props:
 *   - etiqueta : string
 *   - valor    : string|number
 *   - detalle  : string (opcional)
 *   - tono     : 'normal' | 'exito' | 'error' | 'advertencia'
 *
 * Ejemplo:
 *   <Metrica etiqueta="Saldo total" valor={moneda(saldo)} tono="exito" />
 */
export default function Metrica({ etiqueta, valor, detalle, tono = 'normal' }) {
  const claseValor = tono === 'normal' ? 'metrica__valor' : `metrica__valor metrica__valor--${tono}`;

  return (
    <div className="metrica">
      <span className="metrica__etiqueta">{etiqueta}</span>
      <span className={claseValor}>{valor}</span>
      {detalle && <span className="metrica__detalle">{detalle}</span>}
    </div>
  );
}
