import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Contenedor movil del slip.
 *
 * - Barra inferior fija (siempre visible en <= 1024px) con el resumen y el
 *   boton para abrir el panel.
 * - Drawer de 85vh con velo, cierre por boton, clic en el velo y tecla Escape.
 *
 * No conoce la logica de la apuesta: recibe el resumen ya formateado y el
 * contenido del slip como children.
 *
 * Props:
 *   - abierto    : boolean
 *   - onAbrir    : () => void
 *   - onCerrar   : () => void
 *   - haySeleccion: boolean
 *   - resumen    : { titulo: string, detalle: string }  Texto de la barra.
 *   - children   : ReactNode  Contenido (normalmente <SlipApuesta variante="drawer" />).
 */
export default function SlipDrawer({
  abierto = false,
  onAbrir,
  onCerrar,
  haySeleccion = false,
  resumen = { titulo: '', detalle: '' },
  children = null,
}) {
  const cerrarRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    const alPulsarTecla = (evento) => {
      if (evento.key === 'Escape') onCerrar?.();
    };

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', alPulsarTecla);
    cerrarRef.current?.focus();

    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener('keydown', alPulsarTecla);
    };
  }, [abierto, onCerrar]);

  return (
    <>
      <div className="sb-barra" role="region" aria-label="Resumen de la apuesta">
        <div className="sb-barra__texto">
          <span className="sb-barra__titulo">
            {haySeleccion ? resumen.titulo || '1 seleccion' : 'Elige una cuota para comenzar'}
          </span>
          {haySeleccion && resumen.detalle && (
            <span className="sb-barra__detalle">{resumen.detalle}</span>
          )}
        </div>
        <button type="button" className="btn btn--primario btn--sm" onClick={onAbrir}>
          {haySeleccion ? 'Ver apuesta' : 'Abrir'}
        </button>
      </div>

      {abierto &&
        createPortal(
          <div className="sb-drawer">
            <button
              type="button"
              className="sb-drawer__velo"
              onClick={onCerrar}
              aria-label="Cerrar la apuesta"
              tabIndex={-1}
            />
            <div
              className="sb-drawer__hoja"
              role="dialog"
              aria-modal="true"
              aria-label="Tu apuesta"
            >
              <header className="sb-drawer__cabecera">
                <span className="sb-drawer__agarre" aria-hidden="true" />
                <button
                  type="button"
                  className="sb-drawer__cerrar"
                  onClick={onCerrar}
                  aria-label="Cerrar"
                  ref={cerrarRef}
                >
                  ×
                </button>
              </header>
              <div className="sb-drawer__contenido">{children}</div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
