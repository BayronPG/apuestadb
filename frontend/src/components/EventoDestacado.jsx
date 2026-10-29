import { Link } from 'react-router-dom';

import Badge from './Badge.jsx';
import CuotaDestacada from './CuotaDestacada.jsx';
import Icono from './Icono.jsx';
import Loader from './Loader.jsx';
import { fechaHora, textoEstado, tipoBadgeEstado } from '../utils/formato.js';

/**
 * Evento destacado del panel: enfrentamiento, metadatos y cuotas vigentes.
 *
 * `evento` usa el formato snake_case de `GET /api/eventos/activos`
 * (`id_evento`, `deporte`, `liga`, `temporada`, `equipo_local`,
 * `equipo_visitante`, `estadio`, `fecha_hora_inicio`, `estado`,
 * `mercados_abiertos`).
 *
 * Props:
 *   - evento      : object   Fila del evento.
 *   - cuotas       : Array<{ clave, mercado, etiqueta, valor, deshabilitada? }>
 *                    Salen de `GET /api/eventos/:id/opciones`; nunca se inventan.
 *   - cargandoCuotas : boolean
 *   - errorCuotas : string   Mensaje a mostrar si fallo la consulta de cuotas.
 *   - maxCuotas   : number   Cuantas cuotas mostrar (por defecto 3).
 *
 * Ejemplo:
 *   <EventoDestacado evento={evento} cuotas={cuotas} cargandoCuotas={cargando} />
 */
export default function EventoDestacado({
  evento,
  cuotas = [],
  cargandoCuotas = false,
  errorCuotas = null,
  maxCuotas = 3,
}) {
  if (!evento) return null;

  const visibles = cuotas.slice(0, maxCuotas);
  const rutaApuesta = `/apuestas/nueva?evento=${evento.id_evento}`;

  return (
    <article className="evento-destacado">
      <div className="evento-destacado__meta">
        <Badge tipo={tipoBadgeEstado(evento.estado)}>{textoEstado(evento.estado)}</Badge>
        <span className="evento-destacado__liga">{evento.liga}</span>
        {evento.temporada && <span>· {evento.temporada}</span>}
      </div>

      <div className="evento-destacado__equipos">
        <span className="evento-destacado__equipo evento-destacado__equipo--local">
          {evento.equipo_local}
        </span>
        <span className="evento-destacado__vs" aria-hidden="true">
          vs
        </span>
        <span className="evento-destacado__equipo evento-destacado__equipo--visitante">
          {evento.equipo_visitante}
        </span>
      </div>

      <div className="evento-destacado__datos">
        <span>
          <Icono nombre="reloj" tamano={13} /> {fechaHora(evento.fecha_hora_inicio)}
        </span>
        {evento.estadio && <span>{evento.estadio}</span>}
        <span>{evento.deporte}</span>
      </div>

      {cargandoCuotas && <Loader tamano="sm" texto="Consultando cuotas..." />}

      {!cargandoCuotas && errorCuotas && (
        <p className="texto-pequeno texto-suave" style={{ margin: 0 }}>
          {errorCuotas}
        </p>
      )}

      {!cargandoCuotas && !errorCuotas && visibles.length > 0 && (
        <div className="cuotas-destacadas">
          {visibles.map((cuota) => (
            <CuotaDestacada
              key={cuota.clave ?? `${cuota.mercado}-${cuota.etiqueta}`}
              mercado={cuota.mercado}
              etiqueta={cuota.etiqueta}
              valor={cuota.valor}
              detalle={cuota.detalle}
              deshabilitada={cuota.deshabilitada}
            />
          ))}
        </div>
      )}

      {!cargandoCuotas && !errorCuotas && visibles.length === 0 && (
        <p className="texto-pequeno texto-suave" style={{ margin: 0 }}>
          Sin mercados abiertos para este evento.
        </p>
      )}

      <div className="evento-destacado__pie">
        <span className="texto-pequeno texto-suave">
          {evento.mercados_abiertos ?? 0} mercado(s) abierto(s)
        </span>
        <Link className="btn btn--primario btn--sm" to={rutaApuesta}>
          <span className="btn__icono">
            <Icono nombre="apuestas" tamano={15} />
          </span>
          Apostar
        </Link>
      </div>
    </article>
  );
}
