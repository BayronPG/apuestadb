import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { listarEventosActivos, obtenerOpcionesEvento } from '../services/eventoService.js';
import { fechaHora, textoEstado, tipoBadgeEstado } from '../utils/formato.js';
import { ESTADOS_OPERABLES } from '../utils/constantes.js';

/**
 * Cuotas reales de un evento (GET /api/eventos/:id/opciones).
 * Componente local: solo se monta cuando el usuario despliega las cuotas, de modo
 * que la cartelera no dispara una peticion por tarjeta.
 */
function CuotasEvento({ idEvento }) {
  const cargar = useCallback(() => obtenerOpcionesEvento(idEvento), [idEvento]);
  const { datos, cargando, error, recargar } = usePeticion(cargar, [idEvento]);

  const mercados = datos?.mercados || [];

  if (cargando) return <Loader texto="Cargando cuotas..." />;

  if (error) {
    return (
      <Alert tipo="error" titulo="No se pudieron cargar las cuotas">
        {error.mensaje}
        <div className="fila" style={{ marginTop: 'var(--esp-3)' }}>
          <button type="button" className="btn btn--secundario btn--sm" onClick={() => recargar()}>
            Reintentar
          </button>
        </div>
      </Alert>
    );
  }

  if (mercados.length === 0) {
    return (
      <p className="texto-pequeno texto-suave" style={{ margin: 0 }}>
        El evento no tiene mercados cargados.
      </p>
    );
  }

  return (
    <div className="pila" style={{ gap: 'var(--esp-3)' }}>
      {mercados.map((mercado) => {
        const mercadoAbierto = mercado.estado === ESTADOS_OPERABLES.mercado;
        return (
          <div key={mercado.idMercado}>
            <div className="fila fila--entre fila--envuelve">
              <strong className="texto-pequeno">{mercado.nombre}</strong>
              <Badge tipo={mercadoAbierto ? 'exito' : 'neutro'}>{textoEstado(mercado.estado)}</Badge>
            </div>
            <div className="cuotas">
              {mercado.opciones.map((opcion) => {
                const operable =
                  mercadoAbierto && opcion.estado === ESTADOS_OPERABLES.opcion;
                return (
                  <span
                    key={opcion.idOpcion}
                    className={`cuota ${operable ? '' : 'cuota--no-disponible'}`.trim()}
                  >
                    <span className="nombre">{opcion.etiqueta}</span>
                    <span className="valor">
                      {opcion.cuotaVigente === null
                        ? 'sin cuota'
                        : Number(opcion.cuotaVigente).toFixed(2)}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Cartelera de eventos activos. Ruta: /eventos
 *
 * Endpoints:
 *   GET /api/eventos/activos                    -> { eventos[], total }  (snake_case)
 *   GET /api/eventos/:id/opciones               -> { evento, mercados[] } (camelCase)
 *
 * Las cuotas se consultan bajo demanda por evento con el endpoint de la Fase 10.1;
 * no se muestran valores simulados.
 */
export default function EventosActivos() {
  const [deporte, setDeporte] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [desplegado, setDesplegado] = useState(null);

  const cargar = useCallback(() => listarEventosActivos(), []);
  const { datos, cargando, error, recargar } = usePeticion(cargar, []);

  const eventos = datos?.eventos || [];

  const deportes = useMemo(
    () => Array.from(new Set(eventos.map((evento) => evento.deporte).filter(Boolean))).sort(),
    [eventos],
  );

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return eventos.filter((evento) => {
      const coincideDeporte = !deporte || evento.deporte === deporte;
      const coincideTexto =
        !texto ||
        [evento.equipo_local, evento.equipo_visitante, evento.liga, evento.estadio]
          .filter(Boolean)
          .some((valor) => String(valor).toLowerCase().includes(texto));
      return coincideDeporte && coincideTexto;
    });
  }, [eventos, deporte, busqueda]);

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Eventos activos</h1>
          <p>
            Eventos programados o en curso (vista vw_EventosActivos). Despliega un evento para ver
            sus mercados, opciones y cuotas vigentes.
          </p>
        </div>
        <div className="fila fila--envuelve">
          <button type="button" className="btn btn--secundario" onClick={() => recargar()}>
            Actualizar
          </button>
          <Link className="btn btn--primario" to="/apuestas/nueva">
            Crear apuesta
          </Link>
        </div>
      </header>

      {error && (
        <Alert tipo="error" titulo="No se pudieron consultar los eventos">
          {error.mensaje}
        </Alert>
      )}

      <Card titulo="Filtros" subtitulo="Se aplican sobre los datos ya cargados">
        <div className="rejilla-filtros">
          <FormField
            etiqueta="Deporte"
            nombre="deporte"
            tipo="select"
            valor={deporte}
            onChange={(evento) => setDeporte(evento.target.value)}
            opciones={deportes.map((valor) => ({ valor, etiqueta: valor }))}
            placeholder="Todos los deportes"
          />
          <FormField
            etiqueta="Buscar equipo, liga o estadio"
            nombre="busqueda"
            valor={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Ej.: Nacional"
          />
          <div className="fila">
            <button
              type="button"
              className="btn btn--secundario"
              onClick={() => {
                setDeporte('');
                setBusqueda('');
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </Card>

      {cargando && <Loader bloque texto="Consultando cartelera..." />}

      {!cargando && filtrados.length === 0 && (
        <Card>
          <EmptyState
            icono="⚽"
            titulo="Sin eventos para mostrar"
            mensaje={
              eventos.length === 0
                ? 'No hay eventos programados o en curso en la base de datos.'
                : 'Ningun evento coincide con los filtros aplicados.'
            }
            accion={
              <button
                type="button"
                className="btn btn--secundario"
                onClick={() => {
                  setDeporte('');
                  setBusqueda('');
                }}
              >
                Quitar filtros
              </button>
            }
          />
        </Card>
      )}

      {!cargando && filtrados.length > 0 && (
        <>
          <div className="grid grid-2">
            {filtrados.map((evento) => (
              <Card key={evento.id_evento} titulo={evento.liga} subtitulo={evento.temporada}>
                <div className="evento">
                  <div className="evento__meta">
                    <Badge tipo={tipoBadgeEstado(evento.estado)}>{textoEstado(evento.estado)}</Badge>
                    <span>{evento.deporte}</span>
                    <span>·</span>
                    <span>{evento.estadio}</span>
                  </div>

                  <div className="evento__equipos">
                    {evento.equipo_local} <span className="vs">vs</span> {evento.equipo_visitante}
                  </div>

                  <div className="evento__datos">
                    <span>Inicio: {fechaHora(evento.fecha_hora_inicio)}</span>
                    <span>Mercados abiertos: {evento.mercados_abiertos ?? 0}</span>
                  </div>

                  <div className="fila fila--envuelve">
                    <button
                      type="button"
                      className="btn btn--secundario btn--sm"
                      onClick={() =>
                        setDesplegado((actual) =>
                          String(actual) === String(evento.id_evento) ? null : evento.id_evento,
                        )
                      }
                      aria-expanded={String(desplegado) === String(evento.id_evento)}
                    >
                      {String(desplegado) === String(evento.id_evento)
                        ? 'Ocultar cuotas'
                        : 'Ver cuotas'}
                    </button>
                    <Link
                      className="btn btn--primario btn--sm"
                      to={`/apuestas/nueva?evento=${evento.id_evento}`}
                    >
                      Apostar en este evento
                    </Link>
                  </div>

                  {String(desplegado) === String(evento.id_evento) && (
                    <CuotasEvento idEvento={evento.id_evento} />
                  )}
                </div>
              </Card>
            ))}
          </div>

          <p className="texto-pequeno texto-suave">
            {filtrados.length} de {eventos.length} evento(s) mostrados. Las cuotas provienen de
            GET /api/eventos/:id/opciones.
          </p>
        </>
      )}
    </div>
  );
}
