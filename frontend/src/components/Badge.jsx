/**
 * Etiqueta de estado.
 *
 * Props:
 *   - tipo     : 'neutro' | 'exito' | 'error' | 'advertencia' | 'info' | 'primario'
 *   - children : ReactNode
 *
 * Ejemplo:
 *   <Badge tipo="advertencia">Pendiente</Badge>
 */
export default function Badge({ tipo = 'neutro', children, className = '' }) {
  return <span className={`badge badge--${tipo} ${className}`.trim()}>{children}</span>;
}
