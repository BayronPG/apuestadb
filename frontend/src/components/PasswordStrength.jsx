import { evaluarContrasena } from '../utils/validaciones.js';

const ETIQUETAS = { debil: 'Débil', media: 'Media', fuerte: 'Fuerte' };
const COLORES = {
  debil: 'var(--color-error)',
  media: 'var(--color-advertencia)',
  fuerte: 'var(--color-exito)',
};
const CRITERIOS = [
  ['longitud', '8 caracteres'],
  ['mayuscula', 'Una mayuscula'],
  ['minuscula', 'Una minuscula'],
  ['numero', 'Un numero'],
  ['simbolo', 'Un simbolo'],
];

/** Indicador visual de fortaleza y criterios de la contrasena. */
export default function PasswordStrength({ valor }) {
  if (!valor) return null;
  const { criterios, cumplidos, total, nivel } = evaluarContrasena(valor);
  const color = COLORES[nivel];

  return (
    <div className="pila" style={{ gap: 6, marginTop: 4 }} aria-live="polite">
      <div className="fila" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="texto-pequeno">
          Seguridad: <strong style={{ color }}>{ETIQUETAS[nivel]}</strong>
        </span>
        <span className="texto-pequeno texto-suave">
          {cumplidos}/{total} criterios
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Fortaleza de la contrasena"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={cumplidos}
        style={{ height: 6, background: 'var(--color-borde)', borderRadius: 999, overflow: 'hidden' }}
      >
        <div
          style={{
            width: `${(cumplidos / total) * 100}%`,
            height: '100%',
            background: color,
            borderRadius: 999,
            transition: 'width 0.2s ease',
          }}
        />
      </div>
      <ul
        className="texto-pequeno texto-suave"
        style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
      >
        {CRITERIOS.map(([clave, texto]) => {
          const cumple = criterios[clave];
          return (
            <li key={clave} style={{ color: cumple ? color : undefined, opacity: cumple ? 1 : 0.55 }}>
              {cumple ? '✓' : '○'} {texto}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
