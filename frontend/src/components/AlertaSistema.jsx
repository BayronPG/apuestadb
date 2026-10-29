import Icono from './Icono.jsx';

/**
 * Aviso compacto del panel (alertas del sistema y del negocio).
 *
 * Props:
 *   - titulo  : string
 *   - detalle : string|ReactNode  (opcional)
 *   - tono    : 'exito' | 'info' | 'advertencia' | 'error'
 *   - icono   : string  Nombre del icono en Icono.jsx.
 *
 * Ejemplo:
 *   <AlertaSistema tono="advertencia" icono="alerta" titulo="4 apuestas pendientes" detalle="Sin resultado oficial." />
 */
export default function AlertaSistema({ titulo, detalle, tono = 'info', icono = 'alerta' }) {
  return (
    <div className={`alerta-mini alerta-mini--${tono}`}>
      <span className="alerta-mini__icono" aria-hidden="true">
        <Icono nombre={icono} tamano={18} />
      </span>
      <div className="alerta-mini__cuerpo">
        <strong className="alerta-mini__titulo">{titulo}</strong>
        {detalle && <p className="alerta-mini__detalle">{detalle}</p>}
      </div>
    </div>
  );
}
