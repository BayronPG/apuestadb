import { Link } from 'react-router-dom';

import { moneda } from '../utils/formato.js';

/** Montos rapidos ofrecidos en el slip (saldo ficticio). */
export const MONTOS_RAPIDOS = [10000, 20000, 50000, 100000];

/** Premio potencial con la misma formula que dbo.fn_PremioPotencial. */
export function calcularPremio(monto, cuota) {
  const valorMonto = Number(monto);
  const valorCuota = Number(cuota);
  if (!Number.isFinite(valorMonto) || !Number.isFinite(valorCuota)) return 0;
  if (valorMonto <= 0 || valorCuota <= 0) return 0;
  return Math.round(valorMonto * valorCuota * 100) / 100;
}

/**
 * Slip de apuesta (una sola seleccion: el backend admite una opcion por apuesta).
 *
 * Presentacional: recibe la seleccion ya resuelta y el monto; no consulta la API
 * ni registra apuestas.
 *
 * Props:
 *   - seleccion      : { idEvento, liga, equipoLocal, equipoVisitante, mercado, etiqueta, cuota } | null
 *   - monto          : string|number
 *   - onMonto        : (valor:string) => void
 *   - onQuitar       : () => void
 *   - variante       : 'panel' | 'drawer'   (solo cambia el estilo del contenedor)
 *   - enlaceContinuar: string|null          Ruta a la pantalla de apuesta.
 */
export default function SlipApuesta({
  seleccion = null,
  monto = '',
  onMonto,
  onQuitar,
  variante = 'panel',
  enlaceContinuar = null,
}) {
  const cuota = seleccion ? Number(seleccion.cuota) : 0;
  const premio = seleccion ? calcularPremio(monto, cuota) : 0;
  const montoNumerico = Number(monto);
  const idCampo = `sb-monto-${variante}`;

  return (
    <section
      className={`sb-slip ${variante === 'drawer' ? 'sb-slip--drawer' : 'sb-slip--panel'}`}
      aria-label="Apuesta seleccionada"
    >
      <header className="sb-slip__cabecera">
        <div>
          <h2 className="sb-slip__titulo">Cupon de apuesta</h2>
          <p className="sb-slip__subtitulo">{seleccion ? '1 seleccion' : 'Sin selecciones'}</p>
        </div>
        {seleccion && (
          <button
            type="button"
            className="sb-slip__quitar"
            onClick={onQuitar}
            aria-label="Quitar la seleccion"
            title="Quitar la seleccion"
          >
            ×
          </button>
        )}
      </header>

      {!seleccion && (
        <div className="sb-slip__vacio">
          <span className="sb-slip__vacio-icono" aria-hidden="true">
            🎯
          </span>
          <p className="sb-slip__vacio-titulo">Elige una cuota para comenzar</p>
          <p className="sb-slip__vacio-texto">
            Toca una cuota de la cartelera y aparecera aqui, lista para apostar.
          </p>
        </div>
      )}

      {seleccion && (
        <>
          <div className="sb-slip__pick">
            <span className="sb-slip__liga">{seleccion.liga || 'Evento'}</span>
            <p className="sb-slip__equipos">
              {seleccion.equipoLocal} <span className="sb-slip__vs">vs</span>{' '}
              {seleccion.equipoVisitante}
            </p>
            <p className="sb-slip__mercado">{seleccion.mercado || 'Mercado'}</p>
            <div className="sb-slip__opcion">
              <span className="sb-slip__etiqueta">{seleccion.etiqueta}</span>
              <span className="sb-slip__cuota">{cuota.toFixed(2)}</span>
            </div>
          </div>

          <div className="sb-slip__monto">
            <label className="sb-slip__etiqueta-campo" htmlFor={idCampo}>
              Monto
            </label>
            <input
              id={idCampo}
              className="sb-slip__input"
              type="number"
              inputMode="numeric"
              min="1"
              step="1000"
              placeholder="0"
              value={monto}
              onChange={(evento) => onMonto && onMonto(evento.target.value)}
            />
            <div className="sb-slip__chips">
              {MONTOS_RAPIDOS.map((valor) => (
                <button
                  key={valor}
                  type="button"
                  className={`sb-chip ${montoNumerico === valor ? 'sb-chip--activo' : ''}`.trim()}
                  onClick={() => onMonto && onMonto(String(valor))}
                  aria-pressed={montoNumerico === valor}
                >
                  {moneda(valor)}
                </button>
              ))}
            </div>
          </div>

          <dl className="sb-slip__resumen">
            <div className="sb-slip__fila">
              <dt>Cuota</dt>
              <dd>{cuota.toFixed(2)}</dd>
            </div>
            <div className="sb-slip__fila">
              <dt>Monto</dt>
              <dd>{montoNumerico > 0 ? moneda(montoNumerico) : '—'}</dd>
            </div>
            <div className="sb-slip__fila sb-slip__fila--total">
              <dt>Premio potencial</dt>
              <dd>{premio > 0 ? moneda(premio) : '—'}</dd>
            </div>
          </dl>

          {enlaceContinuar && (
            <Link className="btn btn--primario btn--bloque sb-slip__cta" to={enlaceContinuar}>
              Apostar
            </Link>
          )}

          <p className="sb-slip__nota">
            Saldo ficticio. La cuota definitiva la congela la base al registrar la apuesta.
          </p>
        </>
      )}
    </section>
  );
}
