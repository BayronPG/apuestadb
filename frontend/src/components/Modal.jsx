import { useEffect, useRef } from 'react';

/**
 * Ventana modal accesible y controlada por el padre.
 *
 * Props:
 *   - abierto  : boolean
 *   - titulo   : string
 *   - onCerrar : () => void  (se dispara con Escape, con el velo y con el boton ×)
 *   - pie      : ReactNode   Botones de accion.
 *   - tamano   : 'sm' | 'md' | 'lg'
 *   - children : ReactNode
 *
 * Ejemplo:
 *   <Modal abierto={abierto} titulo="Registrar resultado" onCerrar={cerrar}
 *          pie={<><button className="btn btn--secundario" onClick={cerrar}>Cancelar</button></>}>
 *     ...
 *   </Modal>
 */
export default function Modal({
  abierto = false,
  titulo,
  onCerrar = () => {},
  pie,
  tamano = 'md',
  children,
}) {
  const caja = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    function alEscape(evento) {
      if (evento.key === 'Escape') onCerrar();
    }

    document.addEventListener('keydown', alEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alEscape);
      document.body.style.overflow = '';
    };
  }, [abierto, onCerrar]);

  useEffect(() => {
    if (abierto && caja.current) {
      const enfocable = caja.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (enfocable) enfocable.focus();
    }
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div
      className="modal__velo"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <div
        className={`modal modal--${tamano}`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo || 'Ventana de dialogo'}
        ref={caja}
      >
        <header className="modal__cabecera">
          <h2>{titulo}</h2>
          <button type="button" className="alert__cerrar" onClick={onCerrar} aria-label="Cerrar ventana">
            ×
          </button>
        </header>

        <div className="modal__cuerpo">{children}</div>

        {pie && <footer className="modal__pie">{pie}</footer>}
      </div>
    </div>
  );
}
