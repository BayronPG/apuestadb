/**
 * Indicador de carga.
 *
 * Props:
 *   - texto  : string  Texto que acompana al aro (opcional).
 *   - tamano : 'sm' | 'md' | 'lg'
 *   - bloque : boolean  Centra el indicador en un bloque de altura propia.
 *
 * Ejemplo:
 *   <Loader bloque texto="Consultando eventos..." />
 */
export default function Loader({ texto = '', tamano = 'md', bloque = false }) {
  const clases = ['loader'];
  if (tamano !== 'md') clases.push(`loader--${tamano}`);
  if (bloque) clases.push('loader--bloque');

  return (
    <div className={clases.join(' ')} role="status" aria-live="polite">
      <span className="loader__aro" aria-hidden="true" />
      {texto && <span>{texto}</span>}
      {!texto && <span className="solo-lectores">Cargando</span>}
    </div>
  );
}
