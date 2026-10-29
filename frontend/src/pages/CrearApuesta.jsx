import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import Metrica from '../components/Metrica.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { listarEventosActivos, obtenerOpcionesEvento } from '../services/eventoService.js';
import { consultarSaldo, cuentasNormalizadas } from '../services/saldoService.js';
import { registrarApuesta } from '../services/apuestaService.js';
import { normalizarError } from '../utils/errores.js';
import { esMontoValido } from '../utils/validaciones.js';
import { fechaHora, moneda, textoEstado, tipoBadgeEstado } from '../utils/formato.js';
import { ESTADOS_OPERABLES } from '../utils/constantes.js';

/**
 * Crear apuesta. Ruta: /apuestas/nueva
 *
 * Flujo real e integrado (Fase 11.1, sin datos simulados):
 *   1. GET /api/eventos/activos                  -> selector de evento
 *   2. GET /api/eventos/:id/opciones              -> mercados, opciones y cuotas reales
 *   3. GET /api/eventos/:id/opciones?monto=<n>    -> premioPotencial recalculado por la API
 *   4. GET /api/saldo                             -> cuentas con idTipoSaldo/nombreTipoSaldo
 *   5. POST /api/apuestas { idOpcion, idTipoSaldo, monto }
 *
 * La cuota mostrada es `cuotaVigente`; la definitiva la congela
 * usp_Apuesta_Registrar dentro de la transaccion. El id del usuario siempre sale
 * del token en el backend.
 */
export default function CrearApuesta() {
  const [parametros] = useSearchParams();
  const eventoInicial = parametros.get('evento') || '';

  // ------------------------------------------------------------- formulario --
  const [idEvento, setIdEvento] = useState(eventoInicial);
  const [idOpcion, setIdOpcion] = useState('');
  const [idTipoSaldo, setIdTipoSaldo] = useState('');
  const [monto, setMonto] = useState('');
  const [confirmacion, setConfirmacion] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);
  const [exito, setExito] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // ------------------------------------------------------------ cartelera -----
  const cargarEventos = useCallback(() => listarEventosActivos(), []);
  const eventos = usePeticion(cargarEventos, []);
  const listaEventos = eventos.datos?.eventos || [];

  // --------------------------------------------------------------- saldo ------
  const cargarSaldo = useCallback(() => consultarSaldo(), []);
  const saldo = usePeticion(cargarSaldo, []);
  const cuentas = useMemo(() => cuentasNormalizadas(saldo.datos), [saldo.datos]);
  const cuentasConTipo = cuentas.filter((cuenta) => cuenta.idTipoSaldo !== null);

  // ------------------------------------------- premio potencial (debounce) -----
  const [montoPremio, setMontoPremio] = useState(null);

  useEffect(() => {
    if (!esMontoValido(monto)) {
      setMontoPremio(null);
      return undefined;
    }
    const temporizador = setTimeout(() => setMontoPremio(Number(monto)), 500);
    return () => clearTimeout(temporizador);
  }, [monto]);

  // ------------------------------------ catalogo de mercados del evento -------
  const cargarOpciones = useCallback(() => {
    if (!idEvento) return Promise.resolve(null);
    return obtenerOpcionesEvento(idEvento, { monto: montoPremio });
  }, [idEvento, montoPremio]);

  const catalogo = usePeticion(cargarOpciones, [idEvento, montoPremio]);

  const evento = catalogo.datos?.evento || null;
  const mercados = catalogo.datos?.mercados || [];

  // Al cambiar de evento se descarta la opcion elegida (pertenece al anterior).
  useEffect(() => {
    setIdOpcion('');
  }, [idEvento]);

  const opcionElegida = useMemo(() => {
    for (const mercado of mercados) {
      const encontrada = mercado.opciones.find((opcion) => String(opcion.idOpcion) === String(idOpcion));
      if (encontrada) return { ...encontrada, mercado };
    }
    return null;
  }, [mercados, idOpcion]);

  const cuentaElegida = cuentasConTipo.find(
    (cuenta) => String(cuenta.idTipoSaldo) === String(idTipoSaldo),
  );

  const eventoOperable = evento ? evento.estado === ESTADOS_OPERABLES.evento : true;

  // --------------------------------------------------------------- envio ------
  const manejarEnvio = async (eventoSintetico) => {
    eventoSintetico.preventDefault();
    setExito(null);

    const encontrados = {};
    if (!idEvento) encontrados.idEvento = 'Seleccione el evento de la cartelera.';
    if (!idOpcion) encontrados.idOpcion = 'Seleccione la opcion (mercado y cuota) a apostar.';
    if (!idTipoSaldo) encontrados.idTipoSaldo = 'Seleccione el tipo de saldo.';
    if (!esMontoValido(monto)) encontrados.monto = 'El monto debe ser mayor que cero.';
    if (!confirmacion) encontrados.confirmacion = 'Confirme que el saldo es ficticio.';

    setErrores(encontrados);
    setErrorServidor(null);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      const datos = await registrarApuesta({
        idOpcion: Number(idOpcion),
        idTipoSaldo: Number(idTipoSaldo),
        monto: Number(monto),
      });
      setExito({ idApuesta: datos.idApuesta, mensaje: datos.mensaje });
      setIdOpcion('');
      setMonto('');
      setConfirmacion(false);
      saldo.recargar();
      catalogo.recargar();
    } catch (excepcion) {
      setErrorServidor(normalizarError(excepcion));
    } finally {
      setEnviando(false);
    }
  };

  const reiniciar = () => {
    setIdOpcion('');
    setMonto('');
    setConfirmacion(false);
    setErrores({});
    setErrorServidor(null);
  };

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Crear apuesta</h1>
          <p>
            Elige el evento, la opcion del mercado (con su cuota vigente) y el tipo de saldo
            ficticio. La cuota se congela al confirmar y el premio se calcula en SQL Server al
            liquidar.
          </p>
        </div>
        <div className="fila fila--envuelve">
          <button type="button" className="btn btn--secundario" onClick={reiniciar}>
            Limpiar formulario
          </button>
          <Link className="btn btn--secundario" to="/apuestas">
            Mis apuestas
          </Link>
        </div>
      </header>

      {exito && (
        <Alert tipo="exito" titulo={`Apuesta #${exito.idApuesta} registrada`} onCerrar={() => setExito(null)}>
          {exito.mensaje} El monto ya fue debitado del saldo seleccionado.
          <div className="fila" style={{ marginTop: 'var(--esp-3)' }}>
            <Link className="btn btn--primario btn--sm" to="/apuestas">
              Ver historial
            </Link>
            <Link className="btn btn--secundario btn--sm" to="/saldo">
              Ver saldo
            </Link>
          </div>
        </Alert>
      )}

      {errorServidor && (
        <Alert tipo="error" titulo={`No fue posible registrar la apuesta${errorServidor.codigo ? ` (${errorServidor.codigo})` : ''}`} onCerrar={() => setErrorServidor(null)}>
          {errorServidor.mensaje}
          {errorServidor.estado ? ` (HTTP ${errorServidor.estado})` : ''}
        </Alert>
      )}

      <div className="grid grid-2">
        <div className="pila">
          <Card titulo="1. Evento" subtitulo="GET /api/eventos/activos">
            {eventos.error && (
              <Alert tipo="error" titulo="No se pudieron cargar los eventos">
                {eventos.error.mensaje}
              </Alert>
            )}

            {eventos.cargando && <Loader bloque texto="Cargando eventos activos..." />}

            {!eventos.cargando && listaEventos.length === 0 && (
              <EmptyState
                icono="⚽"
                titulo="Sin eventos activos"
                mensaje="No hay eventos programados o en curso para apostar."
              />
            )}

            {!eventos.cargando && listaEventos.length > 0 && (
              <FormField
                etiqueta="Evento"
                nombre="idEvento"
                tipo="select"
                valor={idEvento}
                onChange={(eventoSelect) => setIdEvento(eventoSelect.target.value)}
                error={errores.idEvento}
                opciones={listaEventos.map((item) => ({
                  valor: item.id_evento,
                  etiqueta: `#${item.id_evento} ${item.equipo_local} vs ${item.equipo_visitante} · ${item.liga} · ${fechaHora(
                    item.fecha_hora_inicio,
                  )}`,
                }))}
                placeholder="Seleccione un evento"
                requerido
                ayuda="Los mercados y cuotas se cargan al elegir el evento."
                deshabilitado={enviando}
              />
            )}
          </Card>

          <Card titulo="2. Mercado y opcion" subtitulo="GET /api/eventos/:id/opciones">
            {!idEvento && (
              <EmptyState
                icono="🎯"
                titulo="Selecciona un evento"
                mensaje="Al elegir un evento se cargan sus mercados, opciones y cuotas vigentes."
              />
            )}

            {idEvento && catalogo.cargando && <Loader bloque texto="Cargando mercados y cuotas..." />}

            {idEvento && catalogo.error && (
              <Alert tipo="error" titulo="No se pudo cargar el catalogo de mercados" onCerrar={() => catalogo.recargar()}>
                {catalogo.error.mensaje}
                <div className="fila" style={{ marginTop: 'var(--esp-3)' }}>
                  <button type="button" className="btn btn--secundario btn--sm" onClick={() => catalogo.recargar()}>
                    Reintentar
                  </button>
                </div>
              </Alert>
            )}

            {idEvento && !catalogo.cargando && !catalogo.error && mercados.length === 0 && (
              <EmptyState
                icono="📉"
                titulo="Evento sin mercados"
                mensaje="El evento seleccionado no tiene mercados cargados en la base; no es posible apostar."
              />
            )}

            {idEvento && errores.idOpcion && <Alert tipo="error">{errores.idOpcion}</Alert>}

            {mercados.map((mercado) => {
              const mercadoAbierto = mercado.estado === ESTADOS_OPERABLES.mercado;
              return (
                <div key={mercado.idMercado} style={{ marginBottom: 'var(--esp-4)' }}>
                  <div className="fila fila--entre fila--envuelve">
                    <strong>{mercado.nombre}</strong>
                    <Badge tipo={mercadoAbierto ? 'exito' : 'neutro'}>
                      {textoEstado(mercado.estado)}
                    </Badge>
                  </div>

                  <p className="texto-pequeno texto-suave" style={{ margin: '4px 0 8px' }}>
                    {mercado.descripcion ? `${mercado.descripcion} · ` : ''}
                    Cierra: {fechaHora(mercado.fechaCierre)}
                  </p>

                  <div className="cuotas">
                    {mercado.opciones.map((opcion) => {
                      const habilitada = opcion.estado === ESTADOS_OPERABLES.opcion;
                      const operable = mercadoAbierto && habilitada;
                      const elegida = String(opcion.idOpcion) === String(idOpcion);
                      return (
                        <button
                          key={opcion.idOpcion}
                          type="button"
                          className={`cuota ${operable ? '' : 'cuota--no-disponible'}`.trim()}
                          onClick={() => operable && setIdOpcion(String(opcion.idOpcion))}
                          disabled={!operable || enviando}
                          aria-pressed={elegida}
                          style={
                            elegida
                              ? { borderColor: 'var(--color-primario)', background: 'rgba(16,185,129,.12)' }
                              : undefined
                          }
                          title={operable ? 'Elegir esta opcion' : `No operable (${textoEstado(opcion.estado)})`}
                        >
                          <span className="nombre">{opcion.etiqueta}</span>
                          <span className="valor">
                            {opcion.cuotaVigente === null
                              ? 'sin cuota'
                              : Number(opcion.cuotaVigente).toFixed(2)}
                          </span>
                          {Number.isFinite(opcion.premioPotencial) && (
                            <span className="texto-pequeno texto-suave">
                              premio {moneda(opcion.premioPotencial)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {idEvento && mercados.length > 0 && (
              <p className="texto-pequeno texto-suave" style={{ margin: 0 }}>
                El premio potencial se recalcula con la API al escribir el monto
                (<code>?monto=</code>) y el definitivo lo calcula la base al liquidar.
              </p>
            )}
          </Card>

          <Card titulo="3. Saldo, monto y confirmacion" subtitulo="GET /api/saldo y POST /api/apuestas">
            {saldo.error && (
              <Alert tipo="error" titulo="No se pudieron cargar las cuentas de saldo">
                {saldo.error.mensaje}
              </Alert>
            )}

            {saldo.cargando && <Loader texto="Consultando saldo..." />}

            {!saldo.cargando && cuentasConTipo.length === 0 && !saldo.error && (
              <Alert tipo="advertencia" titulo="Sin tipos de saldo disponibles">
                La respuesta de <code>GET /api/saldo</code> no incluye <code>idTipoSaldo</code>.
                Sin ese identificador no es posible registrar la apuesta.
              </Alert>
            )}

            <form onSubmit={manejarEnvio} noValidate>
              <FormField
                etiqueta="Tipo de saldo"
                nombre="idTipoSaldo"
                tipo="select"
                valor={idTipoSaldo}
                onChange={(eventoSelect) => setIdTipoSaldo(eventoSelect.target.value)}
                error={errores.idTipoSaldo}
                opciones={cuentasConTipo.map((cuenta) => ({
                  valor: cuenta.idTipoSaldo,
                  etiqueta: `${cuenta.nombreTipoSaldo} · disponible ${moneda(cuenta.saldoActual)}`,
                }))}
                placeholder="Seleccione el tipo de saldo"
                requerido
                deshabilitado={enviando}
                ayuda="El descuento se hace sobre la cuenta de este tipo de saldo."
              />

              <FormField
                etiqueta="Monto (saldo ficticio)"
                nombre="monto"
                tipo="number"
                valor={monto}
                onChange={(eventoMonto) => setMonto(eventoMonto.target.value)}
                error={errores.monto}
                min="1"
                step="1000"
                requerido
                deshabilitado={enviando}
                ayuda="Mayor que cero. Sin dinero real: saldo de practica."
              />

              <FormField
                etiqueta="Confirmacion"
                nombre="confirmacion"
                tipo="checkbox"
                valor={confirmacion}
                onChange={(eventoCheck) => setConfirmacion(eventoCheck.target.checked)}
                error={errores.confirmacion}
                placeholder="Entiendo que el saldo es ficticio y que la apuesta queda registrada para fines academicos."
                deshabilitado={enviando}
              />

              <button
                type="submit"
                className="btn btn--primario btn--bloque"
                disabled={enviando || !eventoOperable}
                title={eventoOperable ? undefined : 'El evento no admite apuestas en su estado actual.'}
              >
                {enviando ? <Loader tamano="sm" texto="Registrando apuesta..." /> : 'Confirmar apuesta'}
              </button>

              {!eventoOperable && (
                <Alert tipo="advertencia" titulo="Evento no operable">
                  El evento esta en estado <strong>{textoEstado(evento?.estado)}</strong>; solo se
                  admiten apuestas con el evento <strong>programado</strong> y el mercado abierto.
                </Alert>
              )}
            </form>
          </Card>
        </div>

        <div className="pila">
          <Card titulo="Evento seleccionado" variante="acento">
            {!evento && (
              <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
                Selecciona un evento de la cartelera para ver su detalle.
              </p>
            )}

            {evento && (
              <div className="evento">
                <div className="evento__meta">
                  <Badge tipo={tipoBadgeEstado(evento.estado)}>{textoEstado(evento.estado)}</Badge>
                  <span>{evento.deporte}</span>
                  <span>·</span>
                  <span>{evento.temporada}</span>
                </div>
                <div className="evento__equipos">
                  {evento.equipoLocal} <span className="vs">vs</span> {evento.equipoVisitante}
                </div>
                <div className="evento__datos">
                  <span>Liga: {evento.liga}</span>
                  <span>Estadio: {evento.estadio}</span>
                  <span>Inicio: {fechaHora(evento.fechaHoraInicio)}</span>
                </div>
              </div>
            )}
          </Card>

          <Card titulo="Resumen de la apuesta" variante="plana">
            <ul className="lista-simple">
              <li>
                <span className="texto-suave">Evento</span>
                <span>{evento ? `${evento.equipoLocal} vs ${evento.equipoVisitante}` : '—'}</span>
              </li>
              <li>
                <span className="texto-suave">Mercado</span>
                <span>{opcionElegida ? opcionElegida.mercado.nombre : '—'}</span>
              </li>
              <li>
                <span className="texto-suave">Opcion</span>
                <span>
                  {opcionElegida ? (
                    <Badge tipo="primario">{opcionElegida.etiqueta}</Badge>
                  ) : (
                    '—'
                  )}
                </span>
              </li>
              <li>
                <span className="texto-suave">Cuota vigente</span>
                <span>
                  {opcionElegida && opcionElegida.cuotaVigente !== null
                    ? Number(opcionElegida.cuotaVigente).toFixed(2)
                    : '—'}
                </span>
              </li>
              <li>
                <span className="texto-suave">Tipo de saldo</span>
                <span>{cuentaElegida ? cuentaElegida.nombreTipoSaldo : '—'}</span>
              </li>
              <li>
                <span className="texto-suave">Monto</span>
                <span className="monto monto--debito">{monto ? moneda(monto) : '—'}</span>
              </li>
            </ul>
          </Card>

          {opcionElegida && esMontoValido(monto) && (
            <Card titulo="Premio potencial" subtitulo="Calculado por la API (?monto=)">
              {catalogo.cargando ? (
                <Loader texto="Recalculando..." />
              ) : (
                <Metrica
                  etiqueta={`${opcionElegida.etiqueta} @ ${Number(opcionElegida.cuotaVigente).toFixed(2)}`}
                  valor={
                    Number.isFinite(opcionElegida.premioPotencial)
                      ? moneda(opcionElegida.premioPotencial)
                      : '—'
                  }
                  detalle="Misma formula que dbo.fn_PremioPotencial; el valor definitivo se fija al liquidar con la cuota congelada."
                  tono="exito"
                />
              )}
            </Card>
          )}

          <Card titulo="Cuenta disponible" variante="plana">
            <ul className="lista-simple">
              {cuentasConTipo.length === 0 && (
                <li className="texto-suave texto-pequeno">Sin cuentas de saldo con tipo identificado.</li>
              )}
              {cuentasConTipo.map((cuenta) => (
                <li key={cuenta.idSaldoCuenta}>
                  <span>
                    <strong>{cuenta.nombreTipoSaldo}</strong>
                    <br />
                    <span className="texto-pequeno texto-suave">
                      Cuenta #{cuenta.idSaldoCuenta} · tipo #{cuenta.idTipoSaldo}
                    </span>
                  </span>
                  <span className="monto monto--abono">{moneda(cuenta.saldoActual)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
