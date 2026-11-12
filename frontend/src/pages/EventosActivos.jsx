import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import EmptyState from '../components/EmptyState.jsx';
import EventoCard from '../components/EventoCard.jsx';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import SlipApuesta, { calcularPremio } from '../components/SlipApuesta.jsx';
import SlipDrawer from '../components/SlipDrawer.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { listarEventosActivos, obtenerOpcionesEvento } from '../services/eventoService.js';
import { listarEquipos } from '../services/equipoService.js';
import { fechaHora, moneda, textoEstado } from '../utils/formato.js';
import { ESTADOS_OPERABLES } from '../utils/constantes.js';
import '../styles/sportsbook.css';

/** Máximo de cuotas que se muestran en el resumen de la tarjeta. */
const MAX_CUOTAS_RESUMEN = 3;

/** Etiqueta fija 1 | X | 2 para el resumen de la cartelera. */
const ETIQUETA_FIJA = {
  local: '1',
  '1': '1',
  empate: 'X',
  x: 'X',
  visitante: '2',
  '2': '2',
};
const ORDEN_ETIQUETA = { '1': 0, X: 1, '2': 2 };

/** Carga las opciones de la tarjeta solo cuando entra en el viewport. */
function useEnVista() {
  const ref = useRef(null);
  const [enVista, setEnVista] = useState(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || typeof IntersectionObserver === 'undefined') {
      setEnVista(true);
      return undefined;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          setEnVista(true);
          observador.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  return [ref, enVista];
}

/**
 * Primer mercado con opciones del evento -> cuotas del resumen.
 * Los valores salen del endpoint existente; no se inventan cuotas.
 */
function resumirCuotas(mercados, idEvento, seleccion) {
  const mercado =
    mercados.find(
      (item) => item.estado === ESTADOS_OPERABLES.mercado && (item.opciones?.length || 0) > 0,
    ) || mercados.find((item) => (item.opciones?.length || 0) > 0);

  if (!mercado) return [];

  const mercadoAbierto = mercado.estado === ESTADOS_OPERABLES.mercado;

  const opciones = [...mercado.opciones]
    .map((opcion) => ({
      opcion,
      etiquetaFija: ETIQUETA_FIJA[String(opcion.etiqueta).toLowerCase()] || String(opcion.etiqueta),
    }))
    .sort(
      (a, b) =>
        (ORDEN_ETIQUETA[a.etiquetaFija] ?? 9) - (ORDEN_ETIQUETA[b.etiquetaFija] ?? 9),
    )
    .slice(0, MAX_CUOTAS_RESUMEN);

  return opciones.map(({ opcion, etiquetaFija }) => {
    const clave = String(opcion.idOpcion);
    const operable = mercadoAbierto && opcion.estado === ESTADOS_OPERABLES.opcion;
    return {
      clave,
      etiqueta: etiquetaFija,
      valor: opcion.cuotaVigente,
      mercado: mercado.nombre,
      deshabilitada: !operable,
      seleccionada: seleccion?.idEvento === idEvento && seleccion?.clave === clave,
    };
  });
}

/** Mercados completos del evento (mismo marcado que usaba la pantalla). */
function DetalleMercados({ mercados, cargando, error, onReintentar }) {
  if (cargando && mercados.length === 0) return <Loader texto="Cargando cuotas..." />;

  if (error) {
    return (
      <Alert tipo="error" titulo="No se pudieron cargar las cuotas">
        {error.mensaje}
        <div className="fila" style={{ marginTop: 'var(--esp-3)' }}>
          <button type="button" className="btn btn--secundario btn--sm" onClick={onReintentar}>
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
                const operable = mercadoAbierto && opcion.estado === ESTADOS_OPERABLES.opcion;
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
 * Tarjeta de la cartelera: envuelve EventoCard y mantiene la carga diferida
 * (`GET /api/eventos/:id/opciones` se pide al entrar en el viewport y se
 * reutiliza para el resumen y para el detalle expandido).
 */
function EventoTarjeta({ evento, logos, expandido, onAlternar, seleccion, onSeleccionar }) {
  const [ref, enVista] = useEnVista();
  const cargar = useCallback(() => obtenerOpcionesEvento(evento.id_evento), [evento.id_evento]);
  const { datos, cargando, error, recargar } = usePeticion(cargar, [evento.id_evento], {
    inmediato: false,
  });

  useEffect(() => {
    if (enVista) recargar();
  }, [enVista, recargar]);

  const mercados = datos?.mercados || [];
  const cuotas = useMemo(
    () => resumirCuotas(mercados, evento.id_evento, seleccion),
    [mercados, evento.id_evento, seleccion],
  );

  return (
    <div className="sb-cartelera__item" ref={ref}>
      <EventoCard
        evento={evento}
        logos={logos}
        cuotas={cuotas}
        cargandoCuotas={enVista && cargando && mercados.length === 0}
        onSeleccionarCuota={(cuota) => onSeleccionar(evento, cuota)}
        onAbrirMercados={onAlternar}
        etiquetaMercados={expandido ? '− mercados' : '+ mercados'}
        acciones={
          <Link className="btn btn--primario btn--sm" to={`/apuestas/nueva?evento=${evento.id_evento}`}>
            Apostar
          </Link>
        }
      >
        {expandido && (
          <DetalleMercados
            mercados={mercados}
            cargando={cargando}
            error={error}
            onReintentar={() => recargar()}
          />
        )}
      </EventoCard>
    </div>
  );
}

/**
 * Cartelera de eventos activos. Ruta: /eventos
 *
 * Endpoints (sin cambios):
 *   GET /api/eventos/activos                    -> { eventos[], total }  (snake_case)
 *   GET /api/eventos/:id/opciones               -> { evento, mercados[] } (camelCase)
 *
 * Las cuotas del resumen salen del mismo endpoint de opciones y se piden cuando
 * la tarjeta entra en el viewport; el detalle de mercados se renderiza solo al
 * desplegar la tarjeta.
 */
export default function EventosActivos() {
  const [parametros] = useSearchParams();
  const [deporte, setDeporte] = useState(parametros.get('deporte') || '');
  const [busqueda, setBusqueda] = useState(parametros.get('q') || '');
  const [expandido, setExpandido] = useState(null);
  const [seleccion, setSeleccion] = useState(null);
  const [monto, setMonto] = useState('');
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  const cargar = useCallback(() => listarEventosActivos(), []);
  const { datos, cargando, error, recargar } = usePeticion(cargar, []);

  const eventos = datos?.eventos || [];

  const cargarEquipos = useCallback(() => listarEquipos(), []);
  const { datos: datosEquipos } = usePeticion(cargarEquipos, []);
  const logos = useMemo(
    () => new Map((datosEquipos?.equipos || []).map((equipo) => [equipo.nombre, equipo.logoUrl])),
    [datosEquipos],
  );

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

  const alternarExpandido = (idEvento) => {
    setExpandido((actual) => (String(actual) === String(idEvento) ? null : idEvento));
  };

  const alternarSeleccion = (evento, cuota) => {
    const repetida =
      seleccion && seleccion.idEvento === evento.id_evento && seleccion.clave === cuota.clave;

    if (repetida) {
      setSeleccion(null);
      return;
    }

    setSeleccion({
      idEvento: evento.id_evento,
      clave: cuota.clave,
      liga: evento.liga,
      equipoLocal: evento.equipo_local,
      equipoVisitante: evento.equipo_visitante,
      mercado: cuota.mercado,
      etiqueta: cuota.etiqueta,
      cuota: Number(cuota.valor),
    });

    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches) {
      setDrawerAbierto(true);
    }
  };

  const quitarSeleccion = () => setSeleccion(null);

  const premio = seleccion ? calcularPremio(monto, seleccion.cuota) : 0;
  const enlaceContinuar = useMemo(() => {
    if (!seleccion) return null;
    const parametros = new URLSearchParams({
      evento: String(seleccion.idEvento),
      mercado: seleccion.mercado || '',
      opcion: seleccion.clave,
      cuota: Number(seleccion.cuota).toFixed(2),
    });
    if (Number(monto) > 0) parametros.set('monto', String(Math.trunc(Number(monto))));
    return `/apuestas/nueva?${parametros.toString()}`;
  }, [seleccion, monto]);

  const propsSlip = {
    seleccion,
    monto,
    onMonto: setMonto,
    onQuitar: quitarSeleccion,
    enlaceContinuar,
  };

  return (
    <>
      <div className="sb-con-layout">
        <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Eventos activos</h1>
          <p>
            Cartelera de eventos programados o en curso. Elige una cuota y continua en la pantalla
            de apuesta cuando quieras registrar el monto.
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
          <div className="sb-cartelera">
            {filtrados.map((evento) => (
              <EventoTarjeta
                key={evento.id_evento}
                evento={evento}
                logos={logos}
                expandido={String(expandido) === String(evento.id_evento)}
                onAlternar={() => alternarExpandido(evento.id_evento)}
                seleccion={seleccion}
                onSeleccionar={alternarSeleccion}
              />
            ))}
          </div>

          <p className="texto-pequeno texto-suave">
            {filtrados.length} de {eventos.length} evento(s) mostrados.
          </p>
        </>
      )}
        </div>

        <aside className="sb-slip-lateral" aria-label="Apuesta en curso">
          <SlipApuesta {...propsSlip} />
        </aside>
      </div>

      <SlipDrawer
        abierto={drawerAbierto}
        onAbrir={() => setDrawerAbierto(true)}
        onCerrar={() => setDrawerAbierto(false)}
        haySeleccion={Boolean(seleccion)}
        resumen={{
          titulo: seleccion ? `${seleccion.etiqueta} · ${Number(seleccion.cuota).toFixed(2)}` : '',
          detalle:
            seleccion && Number(monto) > 0
              ? `${moneda(Number(monto))} · premio ${moneda(premio)}`
              : '',
        }}
      >
        <SlipApuesta variante="drawer" {...propsSlip} />
      </SlipDrawer>
    </>
  );
}
