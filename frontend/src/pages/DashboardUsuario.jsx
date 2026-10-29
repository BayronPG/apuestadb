import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';

import AccionRapida from '../components/AccionRapida.jsx';
import Alert from '../components/Alert.jsx';
import AlertaSistema from '../components/AlertaSistema.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import CuotaDestacada from '../components/CuotaDestacada.jsx';
import EmptyState from '../components/EmptyState.jsx';
import EventoDestacado from '../components/EventoDestacado.jsx';
import GraficaBarras from '../components/GraficaBarras.jsx';
import Icono from '../components/Icono.jsx';
import ListaActividad from '../components/ListaActividad.jsx';
import Loader from '../components/Loader.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import StatCard from '../components/StatCard.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { consultarSaldo, cuentasNormalizadas, consultarMovimientos } from '../services/saldoService.js';
import { listarApuestas } from '../services/apuestaService.js';
import { listarEventosActivos, obtenerOpcionesEvento } from '../services/eventoService.js';
import { listarNotificaciones } from '../services/notificacionService.js';
import { ESTADOS_OPERABLES } from '../utils/constantes.js';
import {
  fechaHora,
  hora,
  moneda,
  nombreCompleto,
  numero,
  textoEstado,
  tipoBadgeEstado,
} from '../utils/formato.js';

/**
 * Panel del usuario autenticado (rediseno premium Fase 11.3). Ruta: /dashboard
 *
 * Endpoints consumidos (todos de solo lectura, sin cambios en la API):
 *   GET /api/saldo                     -> cuentas y saldo consolidado
 *   GET /api/apuestas                  -> historial completo del usuario
 *   GET /api/eventos/activos           -> proximos eventos
 *   GET /api/eventos/:id/opciones      -> cuotas vigentes de los eventos destacados
 *   GET /api/saldo/movimientos         -> ultimos movimientos
 *   GET /api/notificaciones            -> notificaciones recientes
 */

/** Icono y tono por tipo de notificacion (dbo.Notificacion.tipo). */
const PRESENTACION_NOTIFICACION = {
  liquidacion: { icono: 'premio', tono: 'exito' },
  recarga: { icono: 'saldo', tono: 'info' },
  apuesta: { icono: 'apuestas', tono: 'advertencia' },
  bienvenida: { icono: 'usuario', tono: 'neutro' },
};

/** Cuantos eventos se muestran en la franja de destacados. */
const EVENTOS_DESTACADOS = 3;

/** Dias que cubre la grafica de rendimiento. */
const DIAS_RENDIMIENTO = 7;

/** Clave local (ano-mes-dia) para agrupar por dia calendario del usuario. */
function claveDia(fecha) {
  return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
}

export default function DashboardUsuario() {
  const { usuario } = useAuth();

  const cargarSaldo = useCallback(() => consultarSaldo(), []);
  const cargarApuestas = useCallback(() => listarApuestas(), []);
  const cargarEventos = useCallback(() => listarEventosActivos(), []);
  const cargarMovimientos = useCallback(() => consultarMovimientos(), []);
  const cargarNotificaciones = useCallback(() => listarNotificaciones({ limite: 6 }), []);

  const saldo = usePeticion(cargarSaldo, []);
  const apuestas = usePeticion(cargarApuestas, []);
  const eventos = usePeticion(cargarEventos, []);
  const movimientos = usePeticion(cargarMovimientos, []);
  const notificaciones = usePeticion(cargarNotificaciones, []);

  // GET /api/saldo devuelve las cuentas en camelCase (contrato Fase 10.1).
  const cuentas = useMemo(() => cuentasNormalizadas(saldo.datos), [saldo.datos]);
  const listaApuestas = useMemo(() => apuestas.datos?.apuestas || [], [apuestas.datos]);
  const listaEventos = eventos.datos?.eventos || [];
  const listaMovimientos = movimientos.datos?.movimientos || [];
  const listaNotificaciones = notificaciones.datos?.notificaciones || [];

  const ultimasApuestas = listaApuestas.slice(0, 5);

  // ---------------------------------------------------------------- destacados --
  const destacados = listaEventos.slice(0, EVENTOS_DESTACADOS);
  const claveDestacados = destacados.map((evento) => evento.id_evento).join(',');

  /**
   * Cuotas de los eventos destacados. Se consulta el catalogo real
   * (GET /api/eventos/:id/opciones) una vez por evento, en paralelo; no se
   * simula ninguna cuota.
   */
  const cargarCuotasDestacadas = useCallback(() => {
    const ids = claveDestacados ? claveDestacados.split(',') : [];
    if (ids.length === 0) return Promise.resolve([]);
    return Promise.all(ids.map((id) => obtenerOpcionesEvento(id)));
  }, [claveDestacados]);

  const cuotasDestacadas = usePeticion(cargarCuotasDestacadas, [claveDestacados]);

  /** Mapa idEvento -> cuotas operables (mercado abierto + opcion habilitada). */
  const cuotasPorEvento = useMemo(() => {
    const mapa = new Map();
    const ids = claveDestacados ? claveDestacados.split(',') : [];
    ids.forEach((id, indice) => {
      const resultado = cuotasDestacadas.datos?.[indice];
      const mercados = (resultado?.mercados || []).slice(0, 2);
      const lista = [];
      mercados.forEach((mercado) => {
        const abierto = mercado.estado === ESTADOS_OPERABLES.mercado;
        (mercado.opciones || []).slice(0, 3).forEach((opcion) => {
          lista.push({
            clave: opcion.idOpcion,
            mercado: mercado.nombre,
            etiqueta: opcion.etiqueta,
            valor: opcion.cuotaVigente,
            deshabilitada: !(abierto && opcion.estado === ESTADOS_OPERABLES.opcion),
          });
        });
      });
      mapa.set(id, lista);
    });
    return mapa;
  }, [cuotasDestacadas.datos, claveDestacados]);

  /** Franja de cuotas destacadas: las mejores cuotas vigentes de la cartelera. */
  const mejoresCuotas = useMemo(() => {
    const filas = [];
    destacados.forEach((evento) => {
      (cuotasPorEvento.get(evento.id_evento) || []).forEach((cuota) => {
        if (cuota.deshabilitada || cuota.valor === null || cuota.valor === undefined) return;
        filas.push({
          ...cuota,
          clave: `${evento.id_evento}-${cuota.clave}`,
          evento: `${evento.equipo_local} vs ${evento.equipo_visitante}`,
          idEvento: evento.id_evento,
        });
      });
    });
    return filas.sort((a, b) => Number(b.valor) - Number(a.valor)).slice(0, 6);
  }, [destacados, cuotasPorEvento]);

  // ------------------------------------------------------------------ resumen --
  /** Resumen de ganancias y perdidas calculado con el historial ya cargado. */
  const resumen = useMemo(() => {
    const sumar = (filas, campo) =>
      filas.reduce((total, fila) => total + (Number(fila[campo]) || 0), 0);
    const porEstado = (estado) => listaApuestas.filter((fila) => fila.estado === estado);

    const ganadas = porEstado('ganada');
    const perdidas = porEstado('perdida');
    const pendientes = porEstado('pendiente');

    const premios = sumar(ganadas, 'monto_premio');
    const apostadoGanadas = sumar(ganadas, 'monto');
    const apostadoPerdidas = sumar(perdidas, 'monto');

    return {
      total: listaApuestas.length,
      ganadas: { n: ganadas.length, premios, apostado: apostadoGanadas },
      perdidas: { n: perdidas.length, apostado: apostadoPerdidas },
      pendientes: { n: pendientes.length, apostado: sumar(pendientes, 'monto') },
      invertido: sumar(listaApuestas, 'monto'),
    };
  }, [listaApuestas]);

  /** Resultado neto real: premios cobrados menos todo lo apostado. */
  const resultadoNeto = resumen.ganadas.premios - resumen.invertido;

  /** Porcentaje de acierto sobre las apuestas ya liquidadas. */
  const liquidadas = resumen.ganadas.n + resumen.perdidas.n;
  const acierto = liquidadas > 0 ? Math.round((resumen.ganadas.n / liquidadas) * 100) : 0;

  /** Rendimiento diario de los ultimos 7 dias (apostado vs premios cobrados). */
  const rendimiento = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const dias = [];
    for (let i = DIAS_RENDIMIENTO - 1; i >= 0; i -= 1) {
      const fechaDia = new Date(hoy.getTime() - i * 86400000);
      dias.push({
        clave: claveDia(fechaDia),
        etiqueta: fechaDia.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
        apostado: 0,
        premios: 0,
      });
    }

    const indice = new Map(dias.map((dia) => [dia.clave, dia]));
    listaApuestas.forEach((apuesta) => {
      const fecha = new Date(apuesta.fecha_hora_registro);
      if (Number.isNaN(fecha.getTime())) return;
      const dia = indice.get(claveDia(fecha));
      if (!dia) return;
      dia.apostado += Number(apuesta.monto) || 0;
      if (apuesta.estado === 'ganada') dia.premios += Number(apuesta.monto_premio) || 0;
    });

    return dias;
  }, [listaApuestas]);

  const noLeidas = listaNotificaciones.filter((item) => item.estado === 'no_leida').length;

  const hoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Hola, {nombreCompleto(usuario)}</h1>
          <p>
            {hoy} · Resumen de tu actividad en ApuestaDB. Todo el saldo es ficticio: el proyecto es
            academico y no maneja dinero real.
          </p>
        </div>
        <div className="fila fila--envuelve">
          <Link className="btn btn--primario" to="/eventos">
            <span className="btn__icono">
              <Icono nombre="balon" tamano={17} />
            </span>
            Apostar ahora
          </Link>
          <Link className="btn btn--secundario" to="/saldo">
            <span className="btn__icono">
              <Icono nombre="saldo" tamano={17} />
            </span>
            Mi saldo
          </Link>
        </div>
      </header>

      {saldo.error && (
        <Alert tipo="error" titulo="No se pudo consultar el saldo">
          {saldo.error.mensaje}
        </Alert>
      )}

      {/* ------------------------------------------- hero principal de saldo -- */}
      <section className="hero-panel" aria-labelledby="titulo-saldo">
        <div className="hero-panel__principal">
          <span className="hero-panel__etiqueta" id="titulo-saldo">
            <Icono nombre="saldo" tamano={16} />
            Saldo consolidado (ficticio)
          </span>

          {saldo.cargando ? (
            <Loader texto="Consultando saldo..." />
          ) : (
            <span className="hero-panel__valor">{moneda(saldo.datos?.saldoTotal ?? 0)}</span>
          )}

          <span className="hero-panel__detalle">
            {cuentas.length} cuenta(s) de saldo · {numero(apuestas.datos?.total ?? 0)} apuesta(s) en
            el historial
          </span>

          <div className="hero-panel__acciones">
            <Link className="btn btn--primario btn--sm" to="/eventos">
              <span className="btn__icono">
                <Icono nombre="balon" tamano={15} />
              </span>
              Ver cartelera
            </Link>
            <Link className="btn btn--secundario btn--sm" to="/saldo/movimientos">
              Movimientos
            </Link>
            <Link className="btn btn--secundario btn--sm" to="/notificaciones">
              Notificaciones {noLeidas > 0 && <Badge tipo="info">{noLeidas}</Badge>}
            </Link>
          </div>

          {!saldo.cargando && cuentas.length > 0 && (
            <div className="hero-panel__stats">
              {cuentas.map((cuenta) => (
                <div className="hero-stat" key={cuenta.idSaldoCuenta}>
                  <span className="hero-stat__etiqueta">{cuenta.nombreTipoSaldo}</span>
                  <span className="hero-stat__valor">{moneda(cuenta.saldoActual)}</span>
                  <span className="texto-pequeno texto-suave">
                    {fechaHora(cuenta.fechaUltimaActualizacion)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!saldo.cargando && cuentas.length === 0 && (
            <EmptyState
              icono={<Icono nombre="saldo" tamano={30} />}
              titulo="Sin cuentas de saldo"
              mensaje="Tu usuario no tiene cuentas registradas. Un administrador puede aplicar una recarga ficticia."
            />
          )}
        </div>

        <div className="hero-panel__stats">
          <div className="hero-stat">
            <span className="hero-stat__etiqueta">Apuestas</span>
            <span className="hero-stat__valor">
              {apuestas.cargando ? '...' : numero(resumen.total)}
            </span>
            <span className="texto-pequeno texto-suave">
              Apostado: {moneda(resumen.invertido)}
            </span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat__etiqueta">Acierto</span>
            <span className="hero-stat__valor hero-stat__valor--info">
              {apuestas.cargando ? '...' : `${acierto}%`}
            </span>
            <span className="texto-pequeno texto-suave">
              {resumen.ganadas.n} de {liquidadas} liquidadas
            </span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat__etiqueta">En juego</span>
            <span className="hero-stat__valor hero-stat__valor--advertencia">
              {apuestas.cargando ? '...' : moneda(resumen.pendientes.apostado)}
            </span>
            <span className="texto-pequeno texto-suave">{resumen.pendientes.n} pendiente(s)</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat__etiqueta">Resultado neto</span>
            <span
              className={`hero-stat__valor ${
                resultadoNeto >= 0 ? 'hero-stat__valor--exito' : 'hero-stat__valor--error'
              }`}
            >
              {apuestas.cargando
                ? '...'
                : `${resultadoNeto >= 0 ? '+' : '-'}${moneda(Math.abs(resultadoNeto))}`}
            </span>
            <span className="texto-pequeno texto-suave">Premios - apostado</span>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- indicadores -- */}
      <section className="panel-grid panel-grid--kpi">
        <StatCard
          etiqueta="Apuestas registradas"
          valor={numero(resumen.total)}
          detalle={`Total apostado: ${moneda(resumen.invertido)}`}
          icono="apuestas"
          tono="primario"
          cargando={apuestas.cargando}
        />
        <StatCard
          etiqueta="Apuestas ganadas"
          valor={numero(resumen.ganadas.n)}
          detalle={`Premios cobrados: ${moneda(resumen.ganadas.premios)}`}
          icono="premio"
          tono="exito"
          indicador={
            liquidadas > 0 ? { texto: `${acierto}% de acierto`, tono: acierto >= 50 ? 'exito' : 'advertencia' } : undefined
          }
          cargando={apuestas.cargando}
        />
        <StatCard
          etiqueta="Apuestas perdidas"
          valor={numero(resumen.perdidas.n)}
          detalle={`Monto no recuperado: ${moneda(resumen.perdidas.apostado)}`}
          icono="tendencia"
          tono="error"
          cargando={apuestas.cargando}
        />
        <StatCard
          etiqueta="Apuestas pendientes"
          valor={numero(resumen.pendientes.n)}
          detalle={`En juego: ${moneda(resumen.pendientes.apostado)}`}
          icono="reloj"
          tono="advertencia"
          cargando={apuestas.cargando}
        />
      </section>

      {/* ------------------------------------------ eventos y cuotas destacadas -- */}
      <section className="panel-seccion">
        <div className="panel-seccion__cabecera">
          <div>
            <h2 className="panel-seccion__titulo">
              <Icono nombre="balon" tamano={20} />
              Eventos destacados
            </h2>
            <p className="panel-seccion__subtitulo">
              Cartelera prioritaria con sus cuotas vigentes (GET /api/eventos/:id/opciones)
            </p>
          </div>
          <Link className="btn btn--secundario btn--sm" to="/eventos">
            Ver toda la cartelera
          </Link>
        </div>

        {eventos.error && (
          <Alert tipo="error" titulo="No se pudieron consultar los eventos">
            {eventos.error.mensaje}
          </Alert>
        )}

        {eventos.cargando && <Loader bloque texto="Consultando cartelera..." />}

        {!eventos.cargando && destacados.length === 0 && (
          <Card variante="plana">
            <EmptyState
              icono={<Icono nombre="balon" tamano={30} />}
              titulo="Sin eventos activos"
              mensaje="No hay eventos programados o en curso en este momento."
            />
          </Card>
        )}

        {!eventos.cargando && destacados.length > 0 && (
          <div className="eventos-destacados">
            {destacados.map((evento) => (
              <EventoDestacado
                key={evento.id_evento}
                evento={evento}
                cuotas={cuotasPorEvento.get(evento.id_evento) || []}
                cargandoCuotas={cuotasDestacadas.cargando}
                errorCuotas={
                  cuotasDestacadas.error ? 'No se pudieron cargar las cuotas de este evento.' : null
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------ cuotas top -- */}
      <Card
        titulo="Cuotas destacadas"
        subtitulo="Las mejores cuotas vigentes de la cartelera destacada"
        variante="plana"
      >
        {cuotasDestacadas.cargando && <Loader texto="Consultando cuotas..." />}

        {!cuotasDestacadas.cargando && mejoresCuotas.length === 0 && (
          <EmptyState
            icono={<Icono nombre="tendencia" tamano={30} />}
            titulo="Sin cuotas disponibles"
            mensaje="Los eventos destacados no tienen mercados abiertos con cuota vigente."
          />
        )}

        {!cuotasDestacadas.cargando && mejoresCuotas.length > 0 && (
          <div className="cuotas-destacadas cuotas-destacadas--franja">
            {mejoresCuotas.map((cuota) => (
              <CuotaDestacada
                key={cuota.clave}
                mercado={cuota.mercado}
                etiqueta={cuota.etiqueta}
                valor={cuota.valor}
                detalle={cuota.evento}
                tono="acento"
                to={`/apuestas/nueva?evento=${cuota.idEvento}`}
              />
            ))}
          </div>
        )}
      </Card>

      <div className="panel-grid panel-grid--2-1">
        {/* ---------------------------------------- rendimiento por dia -- */}
        <Card
          titulo="Rendimiento de los ultimos 7 dias"
          subtitulo="Monto apostado y premios cobrados por dia"
          variante="plana"
        >
          <GraficaBarras
            cargando={apuestas.cargando}
            etiquetas={rendimiento.map((dia) => dia.etiqueta)}
            series={[
              { nombre: 'Apostado', valores: rendimiento.map((dia) => dia.apostado) },
              {
                nombre: 'Premios cobrados',
                valores: rendimiento.map((dia) => dia.premios),
                tono: 'acento',
              },
            ]}
            formatoValor={moneda}
            descripcion="Comparacion diaria entre el monto apostado y los premios cobrados."
          />
        </Card>

        {/* ---------------------------------------- resumen ganancias/perdidas -- */}
        <Card
          titulo="Resumen de ganancias y perdidas"
          subtitulo="Calculado con tu historial de apuestas (solo lectura)"
          variante="plana"
        >
          {apuestas.cargando && <Loader texto="Calculando resumen..." />}

          {!apuestas.cargando && resumen.total === 0 && (
            <EmptyState
              icono={<Icono nombre="ranking" tamano={30} />}
              titulo="Sin apuestas todavia"
              mensaje="Cuando registres apuestas veras aqui tus proporciones de exito."
            />
          )}

          {!apuestas.cargando && resumen.total > 0 && (
            <div className="pila">
              <ProgressBar
                etiqueta="Apuestas ganadas"
                valor={resumen.ganadas.n}
                total={resumen.total}
                textoValor={`${resumen.ganadas.n} de ${resumen.total}`}
                detalle={`Premios cobrados: ${moneda(resumen.ganadas.premios)}`}
                tono="exito"
              />
              <ProgressBar
                etiqueta="Apuestas perdidas"
                valor={resumen.perdidas.n}
                total={resumen.total}
                textoValor={`${resumen.perdidas.n} de ${resumen.total}`}
                detalle={`Monto no recuperado: ${moneda(resumen.perdidas.apostado)}`}
                tono="error"
              />
              <ProgressBar
                etiqueta="Apuestas pendientes"
                valor={resumen.pendientes.n}
                total={resumen.total}
                textoValor={`${resumen.pendientes.n} de ${resumen.total}`}
                detalle={`En juego: ${moneda(resumen.pendientes.apostado)}`}
                tono="advertencia"
              />

              <div className="fila fila--entre">
                <span className="texto-pequeno texto-suave">Resultado neto (premios - apostado)</span>
                <span className={`monto ${resultadoNeto >= 0 ? 'monto--abono' : 'monto--debito'}`}>
                  {resultadoNeto >= 0 ? '+' : '-'}
                  {moneda(Math.abs(resultadoNeto))}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="panel-grid panel-grid--2">
        {/* ------------------------------------------ movimientos recientes -- */}
        <Card
          titulo="Movimientos recientes"
          subtitulo="Recargas, debitos por apuesta y premios"
          acciones={
            <Link className="btn btn--secundario btn--sm" to="/saldo/movimientos">
              Ver todos
            </Link>
          }
          variante="plana"
        >
          <ListaActividad
            cargando={movimientos.cargando}
            items={listaMovimientos.slice(0, 5).map((movimiento) => ({
              clave: movimiento.id_movimiento,
              icono: movimiento.naturaleza === 'debito' ? 'apuestas' : 'saldo',
              tono: movimiento.naturaleza === 'debito' ? 'advertencia' : 'exito',
              titulo: movimiento.concepto,
              meta: `${movimiento.tipo_saldo} · ${fechaHora(movimiento.fecha_hora)}`,
              valor: `${movimiento.naturaleza === 'debito' ? '-' : '+'}${moneda(movimiento.monto)}`,
              valorTono: movimiento.naturaleza === 'debito' ? 'debito' : 'abono',
            }))}
            vacio={{
              titulo: 'Sin movimientos',
              mensaje: 'Aun no hay abonos ni debitos.',
              icono: <Icono nombre="reloj" tamano={30} />,
            }}
          />
        </Card>

        {/* -------------------------------------------- notificaciones recientes -- */}
        <Card
          titulo="Notificaciones recientes"
          subtitulo="Ultimos avisos de tu cuenta"
          acciones={
            <Link className="btn btn--secundario btn--sm" to="/notificaciones">
              Bandeja
            </Link>
          }
          variante="plana"
        >
          {notificaciones.error && (
            <AlertaSistema
              tono="advertencia"
              icono="alerta"
              titulo="No se pudieron cargar las notificaciones"
              detalle={notificaciones.error.mensaje}
            />
          )}

          {!notificaciones.error && (
            <ListaActividad
              cargando={notificaciones.cargando}
              items={listaNotificaciones.map((item) => {
                const presentacion = PRESENTACION_NOTIFICACION[item.tipo] || {};
                return {
                  clave: item.id_notificacion,
                  icono: presentacion.icono || 'campana',
                  tono: item.estado === 'no_leida' ? 'info' : 'neutro',
                  titulo: item.mensaje,
                  meta: `${item.tipo} · ${fechaHora(item.fecha_hora)}`,
                  badge: {
                    texto: textoEstado(item.estado),
                    tipo: tipoBadgeEstado(item.estado),
                  },
                };
              })}
              vacio={{
                titulo: 'Sin notificaciones',
                mensaje: 'Aun no hay avisos registrados para tu cuenta.',
                icono: <Icono nombre="campana" tamano={30} />,
              }}
            />
          )}
        </Card>
      </div>

      {/* -------------------------------------------------- accesos rapidos -- */}
      <Card titulo="Acciones rapidas" subtitulo="Las tareas mas frecuentes de tu cuenta" variante="plana">
        <div className="accesos accesos--rail">
          <AccionRapida
            to="/eventos"
            icono="balon"
            titulo="Apostar en un evento"
            descripcion="Cartelera, mercados y cuotas vigentes"
          />
          <AccionRapida
            to="/apuestas"
            icono="apuestas"
            titulo="Mis apuestas"
            descripcion="Historial y estado de cada apuesta"
          />
          <AccionRapida
            to="/saldo/movimientos"
            icono="reloj"
            titulo="Movimientos de saldo"
            descripcion="Recargas, debitos y premios"
          />
          <AccionRapida
            to="/ranking"
            icono="ranking"
            titulo="Ranking de usuarios"
            descripcion="Compara tu rendimiento"
          />
          <AccionRapida
            to="/notificaciones"
            icono="campana"
            titulo="Notificaciones"
            descripcion={`${noLeidas} sin leer de ${listaNotificaciones.length} recientes`}
          />
          <AccionRapida
            to="/perfil"
            icono="usuario"
            titulo="Mi perfil"
            descripcion="Datos de la sesion activa"
          />
        </div>
      </Card>

      {/* ----------------------------------------------- ultimas apuestas -- */}
      <Card
        titulo="Ultimas apuestas"
        subtitulo="Historial reciente de tu cuenta"
        acciones={
          <Link className="btn btn--secundario btn--sm" to="/apuestas">
            Historial completo
          </Link>
        }
        variante="plana"
      >
        <Table
          filas={ultimasApuestas}
          cargando={apuestas.cargando}
          claveFila={(fila) => fila.id_apuesta}
          compacta
          vacio={{
            titulo: 'Sin apuestas registradas',
            mensaje: 'Cuando registres apuestas apareceran aqui.',
            icono: <Icono nombre="apuestas" tamano={30} />,
          }}
          columnas={[
            {
              clave: 'evento',
              titulo: 'Evento',
              render: (fila) => (
                <span>
                  {fila.equipo_local} vs {fila.equipo_visitante}
                  <br />
                  <span className="texto-pequeno texto-suave">
                    {fila.mercado} · {fila.opcion}
                  </span>
                </span>
              ),
            },
            {
              clave: 'fecha_hora_registro',
              titulo: 'Registro',
              render: (fila) => `${fechaHora(fila.fecha_hora_registro)} · ${hora(fila.fecha_hora_registro)}`,
            },
            { clave: 'monto', titulo: 'Monto', alineacion: 'der', render: (fila) => moneda(fila.monto) },
            {
              clave: 'cuota_congelada',
              titulo: 'Cuota',
              alineacion: 'der',
              render: (fila) => Number(fila.cuota_congelada ?? 0).toFixed(2),
            },
            {
              clave: 'monto_premio',
              titulo: 'Premio',
              alineacion: 'der',
              render: (fila) => moneda(fila.monto_premio ?? 0),
            },
            {
              clave: 'estado',
              titulo: 'Estado',
              render: (fila) => (
                <Badge tipo={tipoBadgeEstado(fila.estado)}>{textoEstado(fila.estado)}</Badge>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
