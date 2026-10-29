import { numero } from '../utils/formato.js';

/**
 * Grafica de barras agrupadas del panel (sin librerias externas).
 *
 * Dibuja una columna por etiqueta y una barra por serie dentro de la columna.
 * Las alturas son proporcionales al maximo de todas las series; una barra con
 * valor 0 se marca como vacia (`.grafica__barra--vacia`).
 *
 * Props:
 *   - etiquetas     : string[]                       Etiquetas del eje horizontal.
 *   - series        : Array<{ nombre, valores:number[], tono? }>
 *                     tono: 'primario' | 'acento' | 'advertencia' | 'error'.
 *   - formatoValor  : (n:number) => string           Formato del tooltip (por defecto numero()).
 *   - altura        : number                          Alto del area de barras en px.
 *   - descripcion   : string                          Texto accesible y pie de la grafica.
 *   - cargando      : boolean
 *
 * Ejemplo:
 *   <GraficaBarras
 *     etiquetas={['Lun', 'Mar']}
 *     series={[{ nombre: 'Apostado', valores: [1000, 2500] }]}
 *     descripcion="Monto apostado por dia"
 *   />
 */
export default function GraficaBarras({
  etiquetas = [],
  series = [],
  formatoValor = numero,
  altura = 190,
  descripcion = 'Grafica de barras',
  cargando = false,
}) {
  const valoresPlanos = series.flatMap((serie) =>
    (serie.valores || []).map((valor) => Number(valor) || 0),
  );
  const maximo = Math.max(1, ...valoresPlanos);
  const hayDatos = valoresPlanos.some((valor) => valor !== 0);

  if (cargando) {
    return (
      <div className="grafica" aria-busy="true">
        <div className="grafica__lienzo" style={{ height: `${altura}px` }}>
          {etiquetas.map((etiqueta) => (
            <div className="grafica__columna" key={etiqueta}>
              <div className="grafica__barras">
                <span className="grafica__barra grafica__barra--vacia" style={{ height: '12%' }} />
              </div>
              <span className="grafica__etiqueta">{etiqueta}</span>
            </div>
          ))}
        </div>
        <p className="grafica__pie">Cargando datos...</p>
      </div>
    );
  }

  return (
    <figure className="grafica">
      <div
        className="grafica__lienzo"
        style={{ height: `${altura}px` }}
        role="img"
        aria-label={descripcion}
      >
        {etiquetas.map((etiqueta, indice) => (
          <div className="grafica__columna" key={`${etiqueta}-${indice}`}>
            <div className="grafica__barras">
              {series.map((serie) => {
                const valor = Number(serie.valores?.[indice]) || 0;
                const porcentaje = maximo > 0 ? Math.round((valor / maximo) * 100) : 0;
                const alto = valor > 0 ? Math.max(4, porcentaje) : 0;
                return (
                  <span
                    key={serie.nombre}
                    className={`grafica__barra${
                      valor > 0 ? '' : ' grafica__barra--vacia'
                    }${serie.tono && serie.tono !== 'primario' ? ` grafica__barra--${serie.tono}` : ''}`}
                    style={{ height: `${alto}%` }}
                    title={`${serie.nombre} · ${etiqueta}: ${formatoValor(valor)}`}
                  />
                );
              })}
            </div>
            <span className="grafica__etiqueta">{etiqueta}</span>
          </div>
        ))}
      </div>

      <div className="grafica__maximo" aria-hidden="true">
        <span>0</span>
        <span>Maximo: {formatoValor(maximo)}</span>
      </div>

      {series.length > 0 && (
        <div className="grafica__leyenda">
          {series.map((serie) => (
            <span className="grafica__leyenda-item" key={serie.nombre}>
              <span
                className={`grafica__punto${
                  serie.tono && serie.tono !== 'primario' ? ` grafica__punto--${serie.tono}` : ''
                }`}
                aria-hidden="true"
              />
              {serie.nombre}
            </span>
          ))}
        </div>
      )}

      <figcaption className="grafica__pie">
        {descripcion}
        {!hayDatos && ' · sin movimientos registrados en el periodo'}
      </figcaption>
    </figure>
  );
}
