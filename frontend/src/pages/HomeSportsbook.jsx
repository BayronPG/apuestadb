import { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import EventoCard from '../components/EventoCard.jsx';
import Loader from '../components/Loader.jsx';
import Icono from '../components/Icono.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { listarEquipos } from '../services/equipoService.js';
import { listarEventosActivos, obtenerOpcionesEvento } from '../services/eventoService.js';
import { ESTADOS_OPERABLES } from '../utils/constantes.js';
import { hora } from '../utils/formato.js';
import '../styles/sportsbook.css';

const LOGO_POR_DEFECTO = '/assets/logo-equipo-default.svg';
const ESTADOS_VIVO = ['en_vivo', 'en_juego', 'en_curso'];
const RANGO_ETIQUETA = {
  local: 0,
  '1': 0,
  empate: 1,
  x: 1,
  visitante: 2,
  '2': 2,
};

const mismoDia = (valor) => {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return false;
  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
};

const esVivo = (estado) => ESTADOS_VIVO.includes(estado);

/** Primer mercado abierto del evento, con sus 3 primeras opciones en orden 1-X-2. */
function resumirCuotas(datos) {
  const mercados = datos?.mercados || [];
  const mercado =
    mercados.find(
      (item) => item.estado === ESTADOS_OPERABLES.mercado && (item.opciones?.length || 0) > 0,
    ) || mercados.find((item) => (item.opciones?.length || 0) > 0);
  if (!mercado) return [];

  return [...mercado.opciones]
    .sort((a, b) => {
      const ra = RANGO_ETIQUETA[String(a.etiqueta).toLowerCase()] ?? 9;
      const rb = RANGO_ETIQUETA[String(b.etiqueta).toLowerCase()] ?? 9;
      return ra - rb;
    })
    .slice(0, 3)
    .map((opcion) => ({
      clave: String(opcion.idOpcion),
      etiqueta: opcion.etiqueta,
      valor: opcion.cuotaVigente,
      mercado: mercado.nombre,
      deshabilitada:
        mercado.estado !== ESTADOS_OPERABLES.mercado ||
        opcion.estado !== ESTADOS_OPERABLES.opcion,
    }));
}

function enlaceApuesta(evento, cuota) {
  const parametros = new URLSearchParams({
    evento: String(evento.id_evento),
    mercado: cuota.mercado || '',
    opcion: String(cuota.clave),
    cuota: Number(cuota.valor).toFixed(2),
  });
  return `/apuestas/nueva?${parametros.toString()}`;
}

function useOpcionesEvento(idEvento) {
  const cargar = useCallback(() => obtenerOpcionesEvento(idEvento), [idEvento]);
  return usePeticion(cargar, [idEvento]);
}

function Escudo({ nombre, logos, tamano = 28 }) {
  return (
    <img
      className="sb-fila__escudo"
      style={{ width: tamano, height: tamano }}
      src={(logos && logos.get(nombre)) || LOGO_POR_DEFECTO}
      alt=""
      loading="lazy"
      onError={(imagen) => {
        imagen.currentTarget.src = LOGO_POR_DEFECTO;
      }}
    />
  );
}

/** Tarjeta grande de partido destacado (reutiliza EventoCard). */
function TarjetaDestacada({ evento, logos }) {
  const navegar = useNavigate();
  const { datos, cargando } = useOpcionesEvento(evento.id_evento);
  const cuotas = useMemo(() => resumirCuotas(datos), [datos]);

  return (
    <EventoCard
      evento={evento}
      logos={logos}
      cuotas={cuotas}
      cargandoCuotas={cargando && cuotas.length === 0}
      onSeleccionarCuota={(cuota) => navegar(enlaceApuesta(evento, cuota))}
      onAbrirMercados={() => navegar('/eventos')}
      etiquetaMercados="Todos los mercados"
      acciones={
        <Link className="btn btn--primario btn--sm" to={`/apuestas/nueva?evento=${evento.id_evento}`}>
          Apostar
        </Link>
      }
    />
  );
}

/** Fila compacta de partido (en vivo / hoy / proximos). */
function FilaEvento({ evento, logos }) {
  const { datos, cargando } = useOpcionesEvento(evento.id_evento);
  const cuotas = useMemo(() => resumirCuotas(datos), [datos]);
  const vivo = esVivo(evento.estado);

  return (
    <article className="sb-fila">
      <div className="sb-fila__cuando">
        <span className={`sb-fila__hora ${vivo ? 'sb-fila__hora--vivo' : ''}`.trim()}>
          {vivo ? 'EN VIVO' : hora(evento.fecha_hora_inicio)}
        </span>
        <span className="sb-fila__liga">{evento.liga}</span>
      </div>

      <div className="sb-fila__equipos">
        <span className="sb-fila__equipo">
          <Escudo nombre={evento.equipo_local} logos={logos} />
          {evento.equipo_local}
        </span>
        <span className="sb-fila__equipo">
          <Escudo nombre={evento.equipo_visitante} logos={logos} />
          {evento.equipo_visitante}
        </span>
      </div>

      <div className="sb-fila__cuotas">
        {cargando && cuotas.length === 0 && (
          <>
            <span className="sb-cuota-hueco" />
            <span className="sb-cuota-hueco" />
            <span className="sb-cuota-hueco" />
          </>
        )}

        {!cargando &&
          cuotas.map((cuota) =>
            cuota.deshabilitada || cuota.valor === null ? (
              <span key={cuota.clave} className="sb-mini-cuota sb-mini-cuota--off">
                {cuota.etiqueta}
              </span>
            ) : (
              <Link key={cuota.clave} className="sb-mini-cuota" to={enlaceApuesta(evento, cuota)}>
                <span className="sb-mini-cuota__etiqueta">{cuota.etiqueta}</span>
                <span className="sb-mini-cuota__valor">{Number(cuota.valor).toFixed(2)}</span>
              </Link>
            ),
          )}

        {!cargando && cuotas.length === 0 && (
          <Link className="sb-fila__ver" to={`/apuestas/nueva?evento=${evento.id_evento}`}>
            Ver cuotas <Icono nombre="flecha" tamano={13} />
          </Link>
        )}
      </div>
    </article>
  );
}

function Seccion({ titulo, extra, children }) {
  return (
    <section className="sb-seccion">
      <header className="sb-seccion__cabecera">
        <h2 className="sb-seccion__titulo">{titulo}</h2>
        {extra}
      </header>
      {children}
    </section>
  );
}

/**
 * Home del sportsbook. Ruta: /dashboard
 *
 * Sustituye el panel de metricas por una portada de casa de apuestas:
 * hero, partidos destacados, eventos en vivo y la cartelera de hoy/proximos.
 * Usa los mismos endpoints de eventos; no toca apuestas, saldo ni Wompi.
 */
export default function HomeSportsbook() {
  const cargarEventos = useCallback(() => listarEventosActivos(), []);
  const { datos, cargando, error } = usePeticion(cargarEventos, []);

  const cargarEquipos = useCallback(() => listarEquipos(), []);
  const { datos: datosEquipos } = usePeticion(cargarEquipos, []);
  const logos = useMemo(
    () => new Map((datosEquipos?.equipos || []).map((equipo) => [equipo.nombre, equipo.logoUrl])),
    [datosEquipos],
  );

  const eventos = datos?.eventos || [];

  const enVivo = useMemo(() => eventos.filter((evento) => esVivo(evento.estado)), [eventos]);

  const destacados = useMemo(() => {
    const hoy = eventos.filter(
      (evento) => !esVivo(evento.estado) && mismoDia(evento.fecha_hora_inicio),
    );
    const resto = eventos.filter((evento) => !esVivo(evento.estado));
    return [...hoy, ...resto.filter((evento) => !hoy.includes(evento))].slice(0, 3);
  }, [eventos]);

  const hoy = useMemo(
    () =>
      eventos.filter(
        (evento) =>
          !esVivo(evento.estado) &&
          mismoDia(evento.fecha_hora_inicio) &&
          !destacados.some((item) => item.id_evento === evento.id_evento),
      ),
    [eventos, destacados],
  );

  const proximos = useMemo(
    () =>
      eventos
        .filter(
          (evento) =>
            !esVivo(evento.estado) &&
            !mismoDia(evento.fecha_hora_inicio) &&
            !destacados.some((item) => item.id_evento === evento.id_evento),
        )
        .slice(0, 6),
    [eventos, destacados],
  );

  const ligaHero = destacados[0]?.liga || enVivo[0]?.liga || 'Cartelera ApuestaDB';
  const hero = destacados[0] || enVivo[0] || eventos[0] || null;
  const listaHoy = hoy.length > 0 ? hoy : proximos;
  const tituloLista = hoy.length > 0 ? 'Partidos de hoy' : 'Proximos partidos';

  return (
    <div className="sb-home">
      <section className="sb-hero">
        <div className="sb-hero__texto">
          <span className="sb-hero__etiqueta">{ligaHero}</span>
          <h1>Vive el partido. Haz tu jugada.</h1>
          <p>
            Cuotas de la cartelera en un solo lugar. Saldo ficticio para practicar, sin dinero
            real.
          </p>
          <div className="sb-hero__acciones">
            <Link className="btn btn--primario" to="/eventos">
              Apostar ahora
            </Link>
            <Link className="btn btn--secundario" to="/eventos">
              Ver cartelera
            </Link>
          </div>
        </div>

        {hero && (
          <div className="sb-hero__ficha">
            <span className="sb-hero__ficha-liga">{hero.liga}</span>
            <div className="sb-hero__ficha-equipos">
              <span className="sb-hero__ficha-equipo">
                <Escudo nombre={hero.equipo_local} logos={logos} tamano={40} />
                {hero.equipo_local}
              </span>
              <span className="sb-hero__ficha-vs">vs</span>
              <span className="sb-hero__ficha-equipo">
                <Escudo nombre={hero.equipo_visitante} logos={logos} tamano={40} />
                {hero.equipo_visitante}
              </span>
            </div>
            <span className="sb-hero__ficha-hora">
              {esVivo(hero.estado) ? 'En vivo' : `Hoy ${hora(hero.fecha_hora_inicio)}`} ·{' '}
              {hero.estadio}
            </span>
            <Link className="btn btn--primario" to={`/apuestas/nueva?evento=${hero.id_evento}`}>
              Apostar en este partido
            </Link>
          </div>
        )}
      </section>

      {cargando && <Loader bloque texto="Cargando cartelera..." />}

      {!cargando && error && (
        <p className="sb-home__aviso">No se pudo cargar la cartelera. Intenta de nuevo.</p>
      )}

      {!cargando && !error && eventos.length === 0 && (
        <p className="sb-home__aviso">No hay eventos disponibles por ahora.</p>
      )}

      {destacados.length > 0 && (
        <Seccion
          titulo="Partidos destacados"
          extra={
            <Link className="sb-seccion__ver" to="/eventos">
              Ver todos <Icono nombre="flecha" tamano={13} />
            </Link>
          }
        >
          <div className="sb-destacados">
            {destacados.map((evento) => (
              <TarjetaDestacada key={evento.id_evento} evento={evento} logos={logos} />
            ))}
          </div>
        </Seccion>
      )}

      {enVivo.length > 0 && (
        <Seccion
          titulo="En vivo"
          extra={<span className="sb-seccion__punto">Ahora mismo</span>}
        >
          <div className="sb-lista">
            {enVivo.slice(0, 6).map((evento) => (
              <FilaEvento key={evento.id_evento} evento={evento} logos={logos} />
            ))}
          </div>
        </Seccion>
      )}

      {listaHoy.length > 0 && (
        <Seccion
          titulo={tituloLista}
          extra={
            <Link className="sb-seccion__ver" to="/eventos">
              Toda la cartelera <Icono nombre="flecha" tamano={13} />
            </Link>
          }
        >
          <div className="sb-lista">
            {listaHoy.slice(0, 6).map((evento) => (
              <FilaEvento key={evento.id_evento} evento={evento} logos={logos} />
            ))}
          </div>
        </Seccion>
      )}
    </div>
  );
}
