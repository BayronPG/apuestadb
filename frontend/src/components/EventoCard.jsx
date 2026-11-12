import '../styles/sportsbook.css';

import Badge from './Badge.jsx';
import CuotaBoton from './CuotaBoton.jsx';
import Icono from './Icono.jsx';
import { fecha, hora, textoEstado, tipoBadgeEstado } from '../utils/formato.js';

const LOGO_POR_DEFECTO = '/assets/logo-equipo-default.svg';
const ESTADOS_EN_VIVO = ['en_vivo', 'en_juego', 'en_curso'];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Etiqueta corta de fecha: Hoy, Manana o "Vie 13 Nov". */
function etiquetaDia(valor) {
  const fechaValor = new Date(valor);
  if (Number.isNaN(fechaValor.getTime())) return fecha(valor);

  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const inicioEvento = new Date(
    fechaValor.getFullYear(),
    fechaValor.getMonth(),
    fechaValor.getDate(),
  );
  const diferencia = Math.round((inicioEvento - inicioHoy) / 86400000);

  if (diferencia === 0) return 'Hoy';
  if (diferencia === 1) return 'Manana';
  return `${DIAS[fechaValor.getDay()]} ${fechaValor.getDate()} ${MESES[fechaValor.getMonth()]}`;
}

/**
 * Tarjeta de evento con estética de casa de apuestas (átomo visual).
 *
 * No consulta la API, no navega y no registra apuestas: recibe el evento ya
 * cargado y las cuotas ya resueltas. La lógica de selección vive en el
 * consumidor (estado de la página o del slip).
 *
 * `evento` usa el snake_case de `GET /api/eventos/activos`
 * (`id_evento`, `liga`, `temporada`, `deporte`, `equipo_local`,
 * `equipo_visitante`, `estadio`, `fecha_hora_inicio`, `estado`,
 * `mercados_abiertos`).
 *
 * Props:
 *   - evento            : object  Fila del evento (requerido).
 *   - logos             : Map<string,string>|null  Nombre de equipo -> URL del escudo.
 *   - cuotas            : Array<{ clave, etiqueta, valor, detalle?, deshabilitada?, seleccionada? }>
 *   - onSeleccionarCuota: (cuota) => void
 *   - onAbrirMercados   : (() => void)|null  Muestra el enlace "Todos los mercados".
 *   - maxCuotas         : number  Cuántas cuotas mostrar (por defecto 3).
 *   - acciones          : ReactNode  Contenido opcional para el pie de la tarjeta.
 *   - cargandoCuotas    : boolean  Muestra esqueletos mientras llegan las cuotas.
 *   - etiquetaMercados  : string   Texto del enlace de mercados.
 *   - children          : ReactNode  Detalle expandido (mercados completos).
 *
 * Ejemplo:
 *   <EventoCard evento={evento} cuotas={cuotas} onSeleccionarCuota={elegir} />
 */
export default function EventoCard({
  evento,
  logos = null,
  cuotas = [],
  onSeleccionarCuota = null,
  onAbrirMercados = null,
  maxCuotas = 3,
  acciones = null,
  cargandoCuotas = false,
  etiquetaMercados = 'Todos los mercados',
  children = null,
}) {
  if (!evento) return null;

  const enVivo = ESTADOS_EN_VIVO.includes(evento.estado);
  const visibles = cuotas.slice(0, maxCuotas);
  const mercados = evento.mercados_abiertos ?? 0;

  return (
    <article className={`sb-evento ${enVivo ? 'sb-evento--en-vivo' : ''}`.trim()}>
      <header className="sb-evento__cabecera">
        <div className="sb-evento__liga">
          {(evento.liga || evento.deporte || 'Liga').toUpperCase()}
          {evento.temporada && <span className="sb-evento__temporada"> · {evento.temporada}</span>}
        </div>
        <div className="sb-evento__estado">
          {enVivo && <span className="sb-evento__vivo">En vivo</span>}
          <Badge tipo={tipoBadgeEstado(evento.estado)}>{textoEstado(evento.estado)}</Badge>
        </div>
      </header>

      <div className="sb-evento__equipos">
        <div className="sb-evento__equipo">
          <span className="sb-evento__escudo">
            <img
              className="sb-evento__escudo-img"
              src={(logos && logos.get(evento.equipo_local)) || LOGO_POR_DEFECTO}
              alt=""
              loading="lazy"
              onError={(imagen) => {
                imagen.currentTarget.src = LOGO_POR_DEFECTO;
              }}
            />
          </span>
          <span className="sb-evento__nombre">{evento.equipo_local}</span>
        </div>
        <div className="sb-evento__equipo">
          <span className="sb-evento__escudo">
            <img
              className="sb-evento__escudo-img"
              src={(logos && logos.get(evento.equipo_visitante)) || LOGO_POR_DEFECTO}
              alt=""
              loading="lazy"
              onError={(imagen) => {
                imagen.currentTarget.src = LOGO_POR_DEFECTO;
              }}
            />
          </span>
          <span className="sb-evento__nombre">{evento.equipo_visitante}</span>
        </div>
      </div>

      <div className="sb-evento__datos">
        <span className="sb-evento__dato">
          <Icono nombre="reloj" tamano={13} /> {etiquetaDia(evento.fecha_hora_inicio)} ·{' '}
          {hora(evento.fecha_hora_inicio)}
        </span>
        {evento.estadio && (
          <span className="sb-evento__dato sb-evento__dato--recortado">{evento.estadio}</span>
        )}
        {evento.deporte && <span className="sb-evento__dato">{evento.deporte}</span>}
      </div>

      {cargandoCuotas && (
        <div className="sb-evento__cuotas sb-evento__cuotas--cargando" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}

      {!cargandoCuotas && visibles.length > 0 && (
        <div className="sb-evento__cuotas">
          {visibles.map((cuota, indice) => (
            <CuotaBoton
              key={cuota.clave ?? `${evento.id_evento}-${cuota.etiqueta}-${indice}`}
              etiqueta={cuota.etiqueta}
              valor={cuota.valor}
              detalle={cuota.detalle || null}
              seleccionada={Boolean(cuota.seleccionada)}
              deshabilitada={Boolean(cuota.deshabilitada)}
              nombreMercado={cuota.mercado || ''}
              onSeleccionar={() => {
                if (typeof onSeleccionarCuota === 'function') onSeleccionarCuota(cuota);
              }}
            />
          ))}
        </div>
      )}

      {!cargandoCuotas && visibles.length === 0 && (
        <p className="sb-evento__sin-cuotas">Sin cuotas publicadas para este evento.</p>
      )}

      <footer className="sb-evento__pie">
        <span className="sb-evento__mercados">
          {mercados} {mercados === 1 ? 'mercado abierto' : 'mercados abiertos'}
        </span>
        <div className="sb-evento__acciones">
          {acciones}
          {onAbrirMercados && (
            <button type="button" className="sb-evento__mas" onClick={onAbrirMercados}>
              {etiquetaMercados}
              <Icono nombre="flecha" tamano={13} />
            </button>
          )}
        </div>
      </footer>

      {children && <div className="sb-evento__detalle">{children}</div>}
    </article>
  );
}
