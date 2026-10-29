import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import AccionRapida from '../components/AccionRapida.jsx';
import Alert from '../components/Alert.jsx';
import AlertaSistema from '../components/AlertaSistema.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import CuotaDestacada from '../components/CuotaDestacada.jsx';
import EmptyState from '../components/EmptyState.jsx';
import EventoDestacado from '../components/EventoDestacado.jsx';
import FormField from '../components/FormField.jsx';
import GraficaBarras from '../components/GraficaBarras.jsx';
import Icono from '../components/Icono.jsx';
import ListaActividad from '../components/ListaActividad.jsx';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import StatCard from '../components/StatCard.jsx';
import Table from '../components/Table.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import {
  listarUsuarios,
  crearRecarga,
  liquidarApuestas,
  consultarAuditoria,
} from '../services/adminService.js';
import {
  registrarResultado,
  listarEventosActivos,
  listarEventosFinalizados,
  obtenerOpcionesEvento,
} from '../services/eventoService.js';
import { consultarSaldo, cuentasNormalizadas } from '../services/saldoService.js';
import { reporteAdministrativo, reporteFinanciero } from '../services/reporteService.js';
import { consultarSalud } from '../services/sistemaService.js';
import { mensajeDeError, normalizarError } from '../utils/errores.js';
import { esMontoValido, esEnteroPositivo } from '../utils/validaciones.js';
import { fechaHora, moneda, numero, textoEstado, tipoBadgeEstado } from '../utils/formato.js';
import { ESTADOS_OPERABLES, ESTADOS_RESULTADO, LIMITACIONES_API } from '../utils/constantes.js';

/**
 * Panel administrativo con rediseno premium (Fase 11.3). Ruta: /admin (solo administrador)
 *
 * Acciones integradas (sin cambios de contrato):
 *   POST /api/eventos/:id/resultado -> registrar marcador (oficial | provisional)
 *   POST /api/liquidaciones         -> liquidar por evento o por apuesta
 *   POST /api/recargas              -> recarga ficticia (idTipoSaldo desde GET /api/saldo)
 *
 * Datos de apoyo (solo lectura):
 *   GET /api/usuarios, /api/eventos/activos, /api/eventos/finalizados,
 *   GET /api/eventos/:id/opciones (cuotas de los eventos destacados),
 *   GET /api/reportes/administrativo, /api/reportes/financiero, /api/saldo,
 *   /api/auditoria (actividad reciente) y /api/health (estado del sistema).
 */

/** Eventos que se muestran en la franja de destacados del panel. */
const EVENTOS_DESTACADOS = 3;

/** Eventos que entran en la grafica comparativa de rendimiento. */
const EVENTOS_GRAFICA = 6;

export default function DashboardAdministrador() {
  // ------------------------------------------------------------------ datos --
  const cargarUsuarios = useCallback(() => listarUsuarios({ limite: 200 }), []);
  const cargarActivos = useCallback(() => listarEventosActivos(), []);
  const cargarFinalizados = useCallback(() => listarEventosFinalizados(), []);
  const cargarAdministrativo = useCallback(() => reporteAdministrativo(), []);
  const cargarFinanciero = useCallback(() => reporteFinanciero(), []);
  const cargarSaldo = useCallback(() => consultarSaldo(), []);
  const cargarAuditoria = useCallback(() => consultarAuditoria({ top: 8 }), []);
  const cargarSalud = useCallback(() => consultarSalud(), []);

  const usuarios = usePeticion(cargarUsuarios, []);
  const activos = usePeticion(cargarActivos, []);
  const finalizados = usePeticion(cargarFinalizados, []);
  const administrativo = usePeticion(cargarAdministrativo, []);
  const financiero = usePeticion(cargarFinanciero, []);
  const saldo = usePeticion(cargarSaldo, []);
  const auditoria = usePeticion(cargarAuditoria, []);
  const salud = usePeticion(cargarSalud, []);

  /** Tipos de saldo reales (idTipoSaldo + nombre) que entrega GET /api/saldo. */
  const tiposSaldo = useMemo(() => {
    const porId = new Map();
    cuentasNormalizadas(saldo.datos).forEach((cuenta) => {
      if (cuenta.idTipoSaldo !== null && !porId.has(cuenta.idTipoSaldo)) {
        porId.set(cuenta.idTipoSaldo, cuenta);
      }
    });
    return Array.from(porId.values());
  }, [saldo.datos]);

  const limitacionCatalogo = LIMITACIONES_API.find((item) => item.id === 'catalogo-tipos-saldo');

  const listaUsuarios = usuarios.datos?.usuarios || [];
  const listaActivos = activos.datos?.eventos || [];
  const listaFinalizados = finalizados.datos?.eventos || [];
  const listaAuditoria = auditoria.datos?.registros || [];
  const filasAdministrativo = administrativo.datos?.filas || [];
  const filasFinanciero = financiero.datos?.filas || [];

  const acumulado = useMemo(() => {
    const filas = filasAdministrativo;
    const financieras = filasFinanciero;
    return {
      apuestas: filas.reduce((total, fila) => total + (Number(fila.apuestas) || 0), 0),
      montoApostado: filas.reduce((total, fila) => total + (Number(fila.monto_apostado) || 0), 0),
      premiosPagados: filas.reduce((total, fila) => total + (Number(fila.premios_pagados) || 0), 0),
      margen: filas.reduce((total, fila) => total + (Number(fila.margen) || 0), 0),
      saldoEnCuentas: financieras.reduce(
        (total, fila) => total + (Number(fila.saldo_en_cuentas) || 0),
        0,
      ),
      totalRecargado: financieras.reduce(
        (total, fila) => total + (Number(fila.total_recargado) || 0),
        0,
      ),
      totalApostado: financieras.reduce(
        (total, fila) => total + (Number(fila.total_apostado) || 0),
        0,
      ),
      totalPremios: financieras.reduce(
        (total, fila) => total + (Number(fila.total_premios) || 0),
        0,
      ),
    };
  }, [filasAdministrativo, filasFinanciero]);

  const estadoBaseDatos = salud.datos?.baseDatos?.estado || null;
  const usuariosInhabilitados = listaUsuarios.filter((fila) => fila.estado !== 'activo');
  const eventosPorLiquidar = listaFinalizados.filter(
    (fila) => (fila.estado_resultado || '') === 'oficial',
  );
  const margenPositivo = acumulado.margen >= 0;

  // ------------------------------------------------------- eventos destacados --
  const destacados = listaActivos.slice(0, EVENTOS_DESTACADOS);
  const claveDestacados = destacados.map((evento) => evento.id_evento).join(',');

  /** Cuotas reales de los eventos destacados (una consulta por evento, en paralelo). */
  const cargarCuotasDestacadas = useCallback(() => {
    const ids = claveDestacados ? claveDestacados.split(',') : [];
    if (ids.length === 0) return Promise.resolve([]);
    return Promise.all(ids.map((id) => obtenerOpcionesEvento(id)));
  }, [claveDestacados]);

  const cuotasDestacadas = usePeticion(cargarCuotasDestacadas, [claveDestacados]);

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

  /** Cuotas vigentes mas altas de la cartelera destacada. */
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

  // ----------------------------------------------------- graficas de gestion --
  /** Eventos con mas movimiento: apostado vs premios pagados. */
  const serieEventos = useMemo(() => {
    const filas = [...filasAdministrativo]
      .sort((a, b) => (Number(b.monto_apostado) || 0) - (Number(a.monto_apostado) || 0))
      .slice(0, EVENTOS_GRAFICA);
    return {
      etiquetas: filas.map(
        (fila) => `${String(fila.equipo_local || '').slice(0, 8)} - ${String(fila.equipo_visitante || '').slice(0, 8)}`,
      ),
      apostado: filas.map((fila) => Number(fila.monto_apostado) || 0),
      premios: filas.map((fila) => Number(fila.premios_pagados) || 0),
    };
  }, [filasAdministrativo]);

  /** Flujo financiero por tipo de saldo (dos series comparables en la practica). */
  const serieFinanciera = useMemo(() => {
    const etiquetas = filasFinanciero.map((fila) => fila.tipo_saldo || `Tipo ${fila.id_tipo_saldo}`);
    return {
      etiquetas,
      series: [
        { nombre: 'Recargado', valores: filasFinanciero.map((f) => Number(f.total_recargado) || 0) },
        {
          nombre: 'Apostado',
          valores: filasFinanciero.map((f) => Number(f.total_apostado) || 0),
          tono: 'acento',
        },
        {
          nombre: 'Premios',
          valores: filasFinanciero.map((f) => Number(f.total_premios) || 0),
          tono: 'advertencia',
        },
      ],
    };
  }, [filasFinanciero]);

  /** Apuestas liquidadas frente al total (indicador de avance del sistema). */
  const porLiquidar = acumulado.apuestas;

  // --------------------------------------------------------------- resultado --
  const [resultado, setResultado] = useState({
    idEvento: '',
    marcadorLocal: '0',
    marcadorVisitante: '0',
    estado: 'oficial',
  });
  const [errorResultado, setErrorResultado] = useState(null);
  const [exitoResultado, setExitoResultado] = useState(null);
  const [enviandoResultado, setEnviandoResultado] = useState(false);

  const guardarResultado = async (evento) => {
    evento.preventDefault();
    setErrorResultado(null);
    setExitoResultado(null);

    if (!esEnteroPositivo(resultado.idEvento)) {
      setErrorResultado('Seleccione el evento al que pertenece el marcador.');
      return;
    }
    if (!/^\d+$/.test(resultado.marcadorLocal) || !/^\d+$/.test(resultado.marcadorVisitante)) {
      setErrorResultado('Los marcadores deben ser enteros mayores o iguales a cero.');
      return;
    }

    setEnviandoResultado(true);
    try {
      const datos = await registrarResultado({
        idEvento: Number(resultado.idEvento),
        marcadorLocal: Number(resultado.marcadorLocal),
        marcadorVisitante: Number(resultado.marcadorVisitante),
        estado: resultado.estado,
      });
      setExitoResultado(datos.mensaje || 'Resultado registrado correctamente.');
      setResultado({ idEvento: '', marcadorLocal: '0', marcadorVisitante: '0', estado: 'oficial' });
      activos.recargar();
      finalizados.recargar();
      administrativo.recargar();
    } catch (excepcion) {
      setErrorResultado(mensajeDeError(excepcion));
    } finally {
      setEnviandoResultado(false);
    }
  };

  // -------------------------------------------------------------- liquidacion --
  const [criterio, setCriterio] = useState('evento');
  const [idEventoLiquidar, setIdEventoLiquidar] = useState('');
  const [idApuestaLiquidar, setIdApuestaLiquidar] = useState('');
  const [errorLiquidacion, setErrorLiquidacion] = useState(null);
  const [exitoLiquidacion, setExitoLiquidacion] = useState(null);
  const [enviandoLiquidacion, setEnviandoLiquidacion] = useState(false);

  const liquidar = async (evento) => {
    evento.preventDefault();
    setErrorLiquidacion(null);
    setExitoLiquidacion(null);

    if (criterio === 'evento' && !esEnteroPositivo(idEventoLiquidar)) {
      setErrorLiquidacion('Seleccione el evento con resultado oficial a liquidar.');
      return;
    }
    if (criterio === 'apuesta' && !esEnteroPositivo(idApuestaLiquidar)) {
      setErrorLiquidacion('Ingrese el identificador de la apuesta a liquidar.');
      return;
    }

    setEnviandoLiquidacion(true);
    try {
      const datos = await liquidarApuestas({
        idEvento: criterio === 'evento' ? Number(idEventoLiquidar) : undefined,
        idApuesta: criterio === 'apuesta' ? Number(idApuestaLiquidar) : undefined,
      });
      setExitoLiquidacion(
        `${datos.mensaje || 'Liquidacion finalizada.'} Apuestas liquidadas: ${
          datos.apuestasLiquidadas ?? 0
        }.`,
      );
      setIdApuestaLiquidar('');
      finalizados.recargar();
      administrativo.recargar();
      financiero.recargar();
      auditoria.recargar();
    } catch (excepcion) {
      setErrorLiquidacion(mensajeDeError(excepcion));
    } finally {
      setEnviandoLiquidacion(false);
    }
  };

  // ----------------------------------------------------------------- recarga --
  const [modalRecarga, setModalRecarga] = useState(false);
  const [recarga, setRecarga] = useState({
    idUsuario: '',
    idTipoSaldo: '',
    monto: '',
    observacion: '',
  });
  const [errorRecarga, setErrorRecarga] = useState(null);
  const [exitoRecarga, setExitoRecarga] = useState(null);
  const [enviandoRecarga, setEnviandoRecarga] = useState(false);

  const abrirRecarga = (idUsuario = '') => {
    setRecarga({
      idUsuario: String(idUsuario || ''),
      idTipoSaldo: tiposSaldo.length > 0 ? String(tiposSaldo[0].idTipoSaldo) : '',
      monto: '',
      observacion: '',
    });
    setErrorRecarga(null);
    setExitoRecarga(null);
    setModalRecarga(true);
    if (!saldo.datos) saldo.recargar();
  };

  const guardarRecarga = async (evento) => {
    evento.preventDefault();
    setErrorRecarga(null);
    setExitoRecarga(null);

    if (!esEnteroPositivo(recarga.idUsuario)) {
      setErrorRecarga('Seleccione el usuario que recibe la recarga ficticia.');
      return;
    }
    if (!esEnteroPositivo(recarga.idTipoSaldo)) {
      setErrorRecarga('Seleccione el tipo de saldo (idTipoSaldo de GET /api/saldo).');
      return;
    }
    if (!esMontoValido(recarga.monto)) {
      setErrorRecarga('El monto debe ser mayor que cero.');
      return;
    }

    setEnviandoRecarga(true);
    try {
      const datos = await crearRecarga({
        idUsuario: Number(recarga.idUsuario),
        idTipoSaldo: Number(recarga.idTipoSaldo),
        monto: Number(recarga.monto),
        observacion: recarga.observacion.trim() || undefined,
      });
      setExitoRecarga(`Recarga #${datos.idRecarga}: ${datos.mensaje}`);
      setRecarga((anterior) => ({ ...anterior, monto: '', observacion: '' }));
      usuarios.recargar();
      administrativo.recargar();
      financiero.recargar();
      saldo.recargar();
      auditoria.recargar();
    } catch (excepcion) {
      const normalizado = normalizarError(excepcion);
      setErrorRecarga(
        `${normalizado.mensaje}${normalizado.codigo ? ` (${normalizado.codigo})` : ''}`,
      );
    } finally {
      setEnviandoRecarga(false);
    }
  };

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Panel administrativo</h1>
          <p>
            Operaciones exclusivas del rol administrador: registrar resultados, liquidar apuestas y
            aplicar recargas ficticias sobre la base ApuestaDB.
          </p>
        </div>
        <div className="fila fila--envuelve">
          <button type="button" className="btn btn--secundario" onClick={() => abrirRecarga()}>
            <span className="btn__icono">
              <Icono nombre="mas" tamano={17} />
            </span>
            Nueva recarga
          </button>
          <Link className="btn btn--primario" to="/admin/reportes">
            <span className="btn__icono">
              <Icono nombre="reporte" tamano={17} />
            </span>
            Ver reportes
          </Link>
        </div>
      </header>

      {usuarios.error && (
        <Alert tipo="error" titulo="No se pudo consultar la lista de usuarios">
          {usuarios.error.mensaje}
        </Alert>
      )}

      {/* ------------------------------------------------ hero del sistema -- */}
      <section className="hero-panel hero-panel--acento" aria-labelledby="titulo-sistema">
        <div className="hero-panel__principal">
          <span className="hero-panel__etiqueta" id="titulo-sistema">
            <Icono nombre="escudo" tamano={16} />
            Saldo consolidado en cuentas (ficticio)
          </span>

          {financiero.cargando ? (
            <Loader texto="Consultando reporte financiero..." />
          ) : (
            <span className="hero-panel__valor">{moneda(acumulado.saldoEnCuentas)}</span>
          )}

          <span className="hero-panel__detalle">
            {numero(usuarios.datos?.total ?? 0)} usuario(s) · {numero(acumulado.apuestas)}{' '}
            apuesta(s) registradas · {numero(listaActivos.length)} evento(s) sin resultado
          </span>

          <span
            className={`hero-panel__pildora hero-panel__pildora--${
              salud.cargando ? 'advertencia' : estadoBaseDatos === 'conectada' ? 'exito' : 'error'
            }`}
          >
            <Icono nombre={estadoBaseDatos === 'conectada' ? 'escudo' : 'alerta'} tamano={14} />
            {salud.cargando
              ? 'Verificando base de datos...'
              : `Base de datos: ${estadoBaseDatos || 'sin respuesta'}`}
          </span>

          <div className="hero-panel__acciones">
            <button type="button" className="btn btn--primario btn--sm" onClick={() => abrirRecarga()}>
              <span className="btn__icono">
                <Icono nombre="mas" tamano={15} />
              </span>
              Nueva recarga ficticia
            </button>
            <Link className="btn btn--secundario btn--sm" to="/admin/reportes">
              Reportes
            </Link>
            <Link className="btn btn--secundario btn--sm" to="/eventos/finalizados">
              Eventos finalizados
            </Link>
          </div>
        </div>

        <div className="hero-panel__stats">
          <div className="hero-stat">
            <span className="hero-stat__etiqueta">Margen del sistema</span>
            <span
              className={`hero-stat__valor ${
                margenPositivo ? 'hero-stat__valor--exito' : 'hero-stat__valor--error'
              }`}
            >
              {administrativo.cargando ? '...' : moneda(acumulado.margen)}
            </span>
            <span className="texto-pequeno texto-suave">Apostado - premios pagados</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat__etiqueta">Premios pagados</span>
            <span className="hero-stat__valor">
              {administrativo.cargando ? '...' : moneda(acumulado.premiosPagados)}
            </span>
            <span className="texto-pequeno texto-suave">Saldo ficticio liquidado</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat__etiqueta">Monto apostado</span>
            <span className="hero-stat__valor hero-stat__valor--info">
              {administrativo.cargando ? '...' : moneda(acumulado.montoApostado)}
            </span>
            <span className="texto-pequeno texto-suave">{numero(porLiquidar)} apuesta(s)</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat__etiqueta">Total recargado</span>
            <span className="hero-stat__valor hero-stat__valor--advertencia">
              {financiero.cargando ? '...' : moneda(acumulado.totalRecargado)}
            </span>
            <span className="texto-pequeno texto-suave">Recargas ficticias aplicadas</span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- indicadores KPI -- */}
      <section className="panel-grid panel-grid--kpi">
        <StatCard
          etiqueta="Total usuarios"
          valor={numero(usuarios.datos?.total ?? 0)}
          detalle={`${usuariosInhabilitados.length} fuera de servicio`}
          icono="usuarios"
          tono="primario"
          cargando={usuarios.cargando}
        />
        <StatCard
          etiqueta="Total apuestas"
          valor={numero(acumulado.apuestas)}
          detalle={`Apostado: ${moneda(acumulado.montoApostado)}`}
          icono="apuestas"
          tono="info"
          cargando={administrativo.cargando}
        />
        <StatCard
          etiqueta="Eventos activos"
          valor={numero(activos.datos?.total ?? 0)}
          detalle="Programados o en curso"
          icono="eventos"
          tono="advertencia"
          indicador={
            listaActivos.length > 0
              ? { texto: `${listaActivos.length} sin resultado`, tono: 'advertencia' }
              : { texto: 'Cartelera al dia', tono: 'exito' }
          }
          cargando={activos.cargando}
        />
        <StatCard
          etiqueta="Eventos finalizados"
          valor={numero(finalizados.datos?.total ?? 0)}
          detalle="Con resultado registrado"
          icono="balon"
          tono="exito"
          indicador={
            eventosPorLiquidar.length > 0
              ? { texto: `${eventosPorLiquidar.length} por liquidar`, tono: 'advertencia' }
              : { texto: 'Sin liquidaciones pendientes', tono: 'exito' }
          }
          cargando={finalizados.cargando}
        />
      </section>

      {/* ---------------------------------------------- graficas de gestion -- */}
      <div className="panel-grid panel-grid--1-2">
        <Card
          titulo="Flujo financiero por tipo de saldo"
          subtitulo="Recargado, apostado y premios (GET /api/reportes/financiero)"
          variante="plana"
        >
          <GraficaBarras
            cargando={financiero.cargando}
            etiquetas={serieFinanciera.etiquetas}
            series={serieFinanciera.series}
            formatoValor={moneda}
            descripcion="Comparacion por tipo de saldo entre lo recargado, lo apostado y los premios."
          />
        </Card>

        <Card
          titulo="Rendimiento por evento"
          subtitulo="Eventos con mas movimiento: apostado frente a premios pagados"
          variante="plana"
        >
          <GraficaBarras
            cargando={administrativo.cargando}
            etiquetas={serieEventos.etiquetas}
            series={[
              { nombre: 'Monto apostado', valores: serieEventos.apostado },
              { nombre: 'Premios pagados', valores: serieEventos.premios, tono: 'acento' },
            ]}
            formatoValor={moneda}
            descripcion="Comparacion por evento entre el monto apostado y los premios pagados."
          />
        </Card>
      </div>

      {/* ------------------------------------------ eventos y cuotas destacadas -- */}
      <section className="panel-seccion">
        <div className="panel-seccion__cabecera">
          <div>
            <h2 className="panel-seccion__titulo">
              <Icono nombre="balon" tamano={20} />
              Eventos destacados de la cartelera
            </h2>
            <p className="panel-seccion__subtitulo">
              Eventos activos con sus cuotas vigentes reales (GET /api/eventos/:id/opciones)
            </p>
          </div>
          <Link className="btn btn--secundario btn--sm" to="/eventos">
            Ver cartelera
          </Link>
        </div>

        {activos.cargando && <Loader bloque texto="Consultando eventos activos..." />}

        {!activos.cargando && destacados.length === 0 && (
          <Card variante="plana">
            <EmptyState
              icono={<Icono nombre="balon" tamano={30} />}
              titulo="Sin eventos activos"
              mensaje="No hay eventos programados o en curso para destacar."
            />
          </Card>
        )}

        {!activos.cargando && destacados.length > 0 && (
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

      <Card
        titulo="Cuotas destacadas de la cartelera"
        subtitulo="Las cuotas vigentes mas altas entre los eventos activos"
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
        {/* ---------------------------------------------------- operaciones -- */}
        <Card titulo="Registrar resultado de evento" subtitulo="POST /api/eventos/:id/resultado (RN-15)">
          {errorResultado && (
            <Alert tipo="error" titulo="No se pudo registrar el resultado">
              {errorResultado}
            </Alert>
          )}
          {exitoResultado && (
            <Alert tipo="exito" titulo="Resultado registrado" onCerrar={() => setExitoResultado(null)}>
              {exitoResultado}
            </Alert>
          )}

          {activos.cargando && <Loader bloque texto="Cargando eventos activos..." />}

          {!activos.cargando && listaActivos.length === 0 && (
            <EmptyState
              icono={<Icono nombre="balon" tamano={30} />}
              titulo="Sin eventos activos"
              mensaje="Solo los eventos programados o en curso pueden recibir un resultado."
            />
          )}

          {!activos.cargando && listaActivos.length > 0 && (
            <form onSubmit={guardarResultado} noValidate>
              <FormField
                etiqueta="Evento"
                nombre="idEvento"
                tipo="select"
                valor={resultado.idEvento}
                onChange={(evento) =>
                  setResultado((anterior) => ({ ...anterior, idEvento: evento.target.value }))
                }
                opciones={listaActivos.map((item) => ({
                  valor: item.id_evento,
                  etiqueta: `#${item.id_evento} ${item.equipo_local} vs ${item.equipo_visitante} · ${fechaHora(
                    item.fecha_hora_inicio,
                  )}`,
                }))}
                placeholder="Seleccione el evento"
                requerido
                deshabilitado={enviandoResultado}
              />

              <div className="grid grid-2">
                <FormField
                  etiqueta="Marcador local"
                  nombre="marcadorLocal"
                  tipo="number"
                  valor={resultado.marcadorLocal}
                  onChange={(evento) =>
                    setResultado((anterior) => ({ ...anterior, marcadorLocal: evento.target.value }))
                  }
                  min="0"
                  max="32767"
                  requerido
                  deshabilitado={enviandoResultado}
                />
                <FormField
                  etiqueta="Marcador visitante"
                  nombre="marcadorVisitante"
                  tipo="number"
                  valor={resultado.marcadorVisitante}
                  onChange={(evento) =>
                    setResultado((anterior) => ({
                      ...anterior,
                      marcadorVisitante: evento.target.value,
                    }))
                  }
                  min="0"
                  max="32767"
                  requerido
                  deshabilitado={enviandoResultado}
                />
              </div>

              <FormField
                etiqueta="Estado del resultado"
                nombre="estado"
                tipo="select"
                valor={resultado.estado}
                onChange={(evento) => setResultado((anterior) => ({ ...anterior, estado: evento.target.value }))}
                opciones={ESTADOS_RESULTADO.map((valor) => ({ valor, etiqueta: valor }))}
                ayuda="Con estado oficial el evento pasa a finalizado y queda habilitada la liquidacion."
                deshabilitado={enviandoResultado}
              />

              <button type="submit" className="btn btn--primario" disabled={enviandoResultado}>
                {enviandoResultado ? <Loader tamano="sm" texto="Registrando..." /> : 'Registrar resultado'}
              </button>
            </form>
          )}
        </Card>

        {/* ------------------------------------------------ alertas sistema -- */}
        <Card
          titulo="Alertas del sistema"
          subtitulo="Estado operativo detectado con los datos de la API"
          variante="plana"
        >
          <ul className="lista-alertas">
            <li>
              <AlertaSistema
                tono={estadoBaseDatos === 'conectada' ? 'exito' : 'error'}
                icono={estadoBaseDatos === 'conectada' ? 'escudo' : 'alerta'}
                titulo={
                  salud.cargando
                    ? 'Verificando base de datos...'
                    : estadoBaseDatos === 'conectada'
                      ? `Base de datos conectada (${salud.datos?.entorno || 'entorno local'})`
                      : `Base de datos no disponible (${estadoBaseDatos || 'sin respuesta'})`
                }
                detalle={
                  salud.datos?.hora
                    ? `Ultima verificacion: ${fechaHora(salud.datos.hora)}`
                    : 'Sin respuesta de GET /api/health'
                }
              />
            </li>

            <li>
              <AlertaSistema
                tono={listaActivos.length > 0 ? 'info' : 'advertencia'}
                icono="eventos"
                titulo={`${listaActivos.length} evento(s) activos sin resultado`}
                detalle="Registre el marcador oficial para habilitar la liquidacion."
              />
            </li>

            <li>
              <AlertaSistema
                tono={eventosPorLiquidar.length > 0 ? 'advertencia' : 'exito'}
                icono="reloj"
                titulo={`${eventosPorLiquidar.length} evento(s) finalizados con resultado oficial`}
                detalle="Compruebe si quedan apuestas pendientes por liquidar."
              />
            </li>

            <li>
              <AlertaSistema
                tono={usuariosInhabilitados.length > 0 ? 'advertencia' : 'exito'}
                icono="usuarios"
                titulo={`${usuariosInhabilitados.length} usuario(s) inhabilitados`}
                detalle="Los usuarios inhabilitados no pueden iniciar sesion."
              />
            </li>
          </ul>

          <div className="pila" style={{ marginTop: 'var(--esp-4)' }}>
            <ProgressBar
              etiqueta="Cobertura del catalogo de usuarios"
              valor={listaUsuarios.filter((fila) => fila.estado === 'activo').length}
              total={listaUsuarios.length}
              textoValor={`${listaUsuarios.filter((fila) => fila.estado === 'activo').length} activos de ${listaUsuarios.length}`}
              detalle="GET /api/usuarios (limite 200)"
              tono="info"
            />
          </div>
        </Card>
      </div>

      <div className="panel-grid panel-grid--2">
        {/* -------------------------------------------------- liquidacion -- */}
        <Card titulo="Liquidar apuestas" subtitulo="POST /api/liquidaciones (un solo criterio)" variante="plana">
          {errorLiquidacion && (
            <Alert tipo="error" titulo="No se pudo liquidar">
              {errorLiquidacion}
            </Alert>
          )}
          {exitoLiquidacion && (
            <Alert tipo="exito" titulo="Liquidacion ejecutada" onCerrar={() => setExitoLiquidacion(null)}>
              {exitoLiquidacion}
            </Alert>
          )}

          <form onSubmit={liquidar} noValidate>
            <div className="pestanas">
              <button
                type="button"
                className={criterio === 'evento' ? 'pestana pestana--activa' : 'pestana'}
                onClick={() => setCriterio('evento')}
              >
                Por evento
              </button>
              <button
                type="button"
                className={criterio === 'apuesta' ? 'pestana pestana--activa' : 'pestana'}
                onClick={() => setCriterio('apuesta')}
              >
                Por apuesta
              </button>
            </div>

            {criterio === 'evento' && (
              <FormField
                etiqueta="Evento finalizado"
                nombre="idEventoLiquidar"
                tipo="select"
                valor={idEventoLiquidar}
                onChange={(evento) => setIdEventoLiquidar(evento.target.value)}
                opciones={listaFinalizados.map((item) => ({
                  valor: item.id_evento,
                  etiqueta: `#${item.id_evento} ${item.equipo_local} vs ${item.equipo_visitante} (${item.marcador_local ?? '-'}-${item.marcador_visitante ?? '-'})`,
                }))}
                placeholder="Seleccione el evento"
                ayuda="Liquida todas las apuestas pendientes del evento con resultado oficial."
                deshabilitado={enviandoLiquidacion}
              />
            )}

            {criterio === 'apuesta' && (
              <FormField
                etiqueta="Identificador de la apuesta"
                nombre="idApuestaLiquidar"
                tipo="number"
                valor={idApuestaLiquidar}
                onChange={(evento) => setIdApuestaLiquidar(evento.target.value)}
                min="1"
                ayuda="Liquida una unica apuesta pendiente."
                deshabilitado={enviandoLiquidacion}
              />
            )}

            <button type="submit" className="btn btn--primario" disabled={enviandoLiquidacion}>
              {enviandoLiquidacion ? <Loader tamano="sm" texto="Liquidando..." /> : 'Liquidar'}
            </button>
          </form>

          <div className="card__pie">
            La liquidacion usa el resultado oficial y la cuota congelada: el premio se calcula con
            fn_PremioPotencial y se abona al saldo.
          </div>
        </Card>

        {/* -------------------------------------------- actividad reciente -- */}
        <Card
          titulo="Movimientos recientes del sistema"
          subtitulo="Ultimos registros de auditoria (GET /api/auditoria)"
          acciones={<Badge tipo="info">{numero(auditoria.datos?.total ?? 0)} total</Badge>}
          variante="plana"
        >
          <ListaActividad
            cargando={auditoria.cargando}
            items={listaAuditoria.map((registro) => ({
              clave: registro.id_auditoria,
              icono: (registro.entidad_afectada || '').toLowerCase().includes('saldo')
                ? 'saldo'
                : (registro.entidad_afectada || '').toLowerCase().includes('apuesta')
                  ? 'apuestas'
                  : 'escudo',
              tono: registro.resultado === 'fallo' ? 'error' : 'exito',
              titulo: registro.operacion,
              meta: `${registro.entidad_afectada} · ${registro.correo || 'sistema'} · ${fechaHora(
                registro.fecha_hora,
              )}`,
              badge: {
                texto: textoEstado(registro.resultado),
                tipo: tipoBadgeEstado(registro.resultado),
              },
            }))}
            vacio={{
              titulo: 'Sin actividad registrada',
              mensaje: 'La auditoria no devolvio registros recientes.',
              icono: <Icono nombre="carpeta" tamano={30} />,
            }}
          />
        </Card>
      </div>

      {/* ------------------------------------------------ accesos admin -- */}
      <Card titulo="Acciones rapidas" subtitulo="Tareas y pantallas del rol administrador" variante="plana">
        <div className="accesos accesos--rail">
          <AccionRapida
            to="/admin/reportes"
            icono="reporte"
            titulo="Reportes administrativos"
            descripcion="Administrativo, financiero, auditoria y ranking"
          />
          <AccionRapida
            to="/ranking"
            icono="ranking"
            titulo="Ranking de usuarios"
            descripcion="Ganancia neta y totales por usuario"
          />
          <AccionRapida
            to="/eventos"
            icono="eventos"
            titulo="Eventos activos"
            descripcion="Cartelera programada o en curso"
          />
          <AccionRapida
            to="/eventos/finalizados"
            icono="balon"
            titulo="Eventos finalizados"
            descripcion="Resultados oficiales registrados"
          />
          <AccionRapida
            to="/saldo/movimientos"
            icono="reloj"
            titulo="Mis movimientos"
            descripcion="Saldos del administrador"
          />
          <AccionRapida
            icono="mas"
            titulo="Nueva recarga ficticia"
            descripcion="Acreditar tokens o PSE a un usuario"
            onClick={() => abrirRecarga()}
          />
        </div>
      </Card>

      {/* ---------------------------------------------------- usuarios -- */}
      <Card
        titulo="Usuarios y saldo consolidado"
        subtitulo="GET /api/usuarios (Usuario + Rol + vw_SaldoConsolidado)"
        acciones={<Badge tipo="info">{numero(usuarios.datos?.total ?? 0)} usuario(s)</Badge>}
        variante="plana"
      >
        <Table
          filas={listaUsuarios.slice(0, 20)}
          cargando={usuarios.cargando}
          claveFila={(fila) => fila.id_usuario}
          compacta
          vacio={{
            titulo: 'Sin usuarios',
            mensaje: 'El endpoint no devolvio usuarios.',
            icono: <Icono nombre="usuarios" tamano={30} />,
          }}
          columnas={[
            { clave: 'id_usuario', titulo: '#', alineacion: 'der' },
            {
              clave: 'usuario',
              titulo: 'Usuario',
              render: (fila) => (
                <span>
                  {fila.nombres} {fila.apellidos}
                  <br />
                  <span className="texto-pequeno texto-suave">{fila.correo}</span>
                </span>
              ),
            },
            {
              clave: 'rol',
              titulo: 'Rol',
              render: (fila) => (
                <Badge tipo={fila.rol === 'administrador' ? 'primario' : 'info'}>{fila.rol}</Badge>
              ),
            },
            {
              clave: 'estado',
              titulo: 'Estado',
              render: (fila) => (
                <Badge tipo={fila.estado === 'activo' ? 'exito' : 'neutro'}>{fila.estado}</Badge>
              ),
            },
            {
              clave: 'saldo_tokens',
              titulo: 'Tokens',
              alineacion: 'der',
              render: (fila) => moneda(fila.saldo_tokens ?? 0),
            },
            {
              clave: 'saldo_pse',
              titulo: 'PSE',
              alineacion: 'der',
              render: (fila) => moneda(fila.saldo_pse ?? 0),
            },
            {
              clave: 'saldo_total',
              titulo: 'Total',
              alineacion: 'der',
              render: (fila) => <strong>{moneda(fila.saldo_total ?? 0)}</strong>,
            },
            {
              clave: 'acciones',
              titulo: 'Acciones',
              render: (fila) => (
                <button
                  type="button"
                  className="btn btn--secundario btn--sm"
                  onClick={() => abrirRecarga(fila.id_usuario)}
                >
                  Recargar
                </button>
              ),
            },
          ]}
        />

        <div className="card__pie">
          Se muestran los primeros 20 registros. El endpoint admite los filtros{' '}
          <code>estado</code>, <code>rol</code> y <code>limite</code> (ver /admin/reportes).
        </div>
      </Card>

      <Modal
        abierto={modalRecarga}
        titulo="Recarga de saldo ficticio"
        onCerrar={() => setModalRecarga(false)}
        pie={
          <>
            <button type="button" className="btn btn--secundario" onClick={() => setModalRecarga(false)}>
              Cerrar
            </button>
            <button
              type="button"
              className="btn btn--primario"
              onClick={guardarRecarga}
              disabled={enviandoRecarga || tiposSaldo.length === 0}
            >
              {enviandoRecarga ? <Loader tamano="sm" texto="Aplicando..." /> : 'Registrar recarga'}
            </button>
          </>
        }
      >
        {saldo.error && (
          <Alert tipo="error" titulo="No se pudieron cargar los tipos de saldo">
            {saldo.error.mensaje}
          </Alert>
        )}

        {!saldo.cargando && tiposSaldo.length === 0 && (
          <Alert tipo="advertencia" titulo="Sin tipos de saldo identificados">
            <code>GET /api/saldo</code> no devolvio <code>idTipoSaldo</code> para las cuentas del
            administrador, por lo que no hay tipos que ofrecer.{' '}
            {limitacionCatalogo ? `Mejora propuesta: ${limitacionCatalogo.propuesta}.` : ''}
          </Alert>
        )}

        {usuarios.error && <Alert tipo="error">{usuarios.error.mensaje}</Alert>}

        <FormField
          etiqueta="Usuario"
          nombre="idUsuarioRecarga"
          tipo="select"
          valor={recarga.idUsuario}
          onChange={(evento) => setRecarga((anterior) => ({ ...anterior, idUsuario: evento.target.value }))}
          opciones={listaUsuarios.map((fila) => ({
            valor: fila.id_usuario,
            etiqueta: `#${fila.id_usuario} ${fila.nombres} ${fila.apellidos} (${fila.correo})`,
          }))}
          placeholder="Seleccione el usuario"
          requerido
        />

        <FormField
          etiqueta="Tipo de saldo"
          nombre="idTipoSaldoRecarga"
          tipo="select"
          valor={recarga.idTipoSaldo}
          onChange={(eventoSelect) =>
            setRecarga((anterior) => ({ ...anterior, idTipoSaldo: eventoSelect.target.value }))
          }
          opciones={tiposSaldo.map((cuenta) => ({
            valor: cuenta.idTipoSaldo,
            etiqueta: `${cuenta.nombreTipoSaldo} (tipo #${cuenta.idTipoSaldo})`,
          }))}
          placeholder="Seleccione el tipo de saldo"
          requerido
          deshabilitado={enviandoRecarga || tiposSaldo.length === 0}
          ayuda="Id y nombre provienen de GET /api/saldo; los tipos son globales (dbo.TipoSaldo)."
        />

        <FormField
          etiqueta="Monto"
          nombre="montoRecarga"
          tipo="number"
          valor={recarga.monto}
          onChange={(evento) => setRecarga((anterior) => ({ ...anterior, monto: evento.target.value }))}
          min="1"
          step="1000"
          requerido
          deshabilitado={enviandoRecarga}
          ayuda="Recarga ficticia: no hay dinero real (RN-02)."
        />

        <FormField
          etiqueta="Observacion (opcional)"
          nombre="observacion"
          tipo="textarea"
          valor={recarga.observacion}
          onChange={(evento) => setRecarga((anterior) => ({ ...anterior, observacion: evento.target.value }))}
          maxLength={255}
          filas={3}
          deshabilitado={enviandoRecarga}
          ayuda="Se guarda en dbo.Recarga.observacion (maximo 255 caracteres)."
        />

        {errorRecarga && <Alert tipo="error" titulo="Validacion">{errorRecarga}</Alert>}
        {exitoRecarga && <Alert tipo="exito">{exitoRecarga}</Alert>}
      </Modal>
    </div>
  );
}
