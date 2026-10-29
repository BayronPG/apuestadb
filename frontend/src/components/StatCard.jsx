import Icono from './Icono.jsx';
import Loader from './Loader.jsx';

/**
 * Tarjeta de indicador (KPI) del dashboard.
 *
 * Props:
 *   - etiqueta  : string            Texto superior del indicador.
 *   - valor     : string|number     Dato principal ya formateado.
 *   - detalle   : string            Texto secundario (opcional).
 *   - icono     : string            Nombre del icono en Icono.jsx (opcional).
 *   - tono      : 'neutro' | 'exito' | 'error' | 'advertencia' | 'info' | 'primario'
 *   - enlace    : { to, texto }     Acceso al detalle (opcional).
 *   - indicador : { texto, tono }   Etiqueta de tendencia (opcional).
 *   - cargando  : boolean
 *
 * Ejemplo:
 *   <StatCard etiqueta="Saldo total" valor={moneda(saldo)} tono="exito" icono="saldo" />
 */
export default function StatCard({
  etiqueta,
  valor,
  detalle,
  icono,
  tono = 'neutro',
  enlace,
  indicador,
  cargando = false,
}) {
  const claseTono = tono === 'neutro' ? '' : `kpi--${tono}`;

  return (
    <article className={`kpi ${claseTono}`.trim()}>
      <div className="kpi__cabecera">
        {icono && (
          <span className="kpi__icono" aria-hidden="true">
            <Icono nombre={icono} tamano={22} />
          </span>
        )}
        <p className="kpi__etiqueta">{etiqueta}</p>
      </div>

      {cargando ? (
        <Loader tamano="sm" texto="Consultando..." />
      ) : (
        <span className="kpi__valor">{valor}</span>
      )}

      {detalle && <span className="kpi__detalle">{detalle}</span>}

      {indicador && (
        <span className={`indicador indicador--${indicador.tono || 'neutro'}`}>
          <Icono nombre="tendencia" tamano={14} />
          {indicador.texto}
        </span>
      )}

      {enlace && (
        <a className="kpi__enlace" href={enlace.to}>
          {enlace.texto} <Icono nombre="flecha" tamano={13} />
        </a>
      )}
    </article>
  );
}
