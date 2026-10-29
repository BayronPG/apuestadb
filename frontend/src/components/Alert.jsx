/**
 * Mensaje de retroalimentacion.
 *
 * Props:
 *   - tipo     : 'error' | 'exito' | 'advertencia' | 'info'
 *   - titulo   : string (opcional; si falta se muestra solo el contenido)
 *   - children : ReactNode | string
 *   - onCerrar : () => void (opcional; agrega boton de cierre)
 *
 * Ejemplo:
 *   <Alert tipo="error" titulo="No fue posible iniciar sesion">{mensaje}</Alert>
 */
export default function Alert({ tipo = 'info', titulo, children, onCerrar, className = '' }) {
  if (!children && !titulo) return null;

  return (
    <div className={`alert alert--${tipo} ${className}`.trim()} role={tipo === 'error' ? 'alert' : 'status'}>
      <span aria-hidden="true">
        {tipo === 'error' ? '⛔' : tipo === 'exito' ? '✅' : tipo === 'advertencia' ? '⚠️' : 'ℹ️'}
      </span>

      <div className="alert__cuerpo">
        {titulo && <strong className="alert__titulo">{titulo}</strong>}
        {children}
      </div>

      {onCerrar && (
        <button type="button" className="alert__cerrar" onClick={onCerrar} aria-label="Cerrar mensaje">
          ×
        </button>
      )}
    </div>
  );
}
