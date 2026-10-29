import { useCallback, useMemo, useState } from 'react';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import Pagination from '../components/Pagination.jsx';
import Table from '../components/Table.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { usePaginacion } from '../hooks/usePaginacion.js';
import { consultarMovimientos, consultarSaldo, cuentasNormalizadas } from '../services/saldoService.js';
import { fechaHora, moneda, textoEstado, desdeInputFecha } from '../utils/formato.js';

/**
 * Historial de movimientos de saldo. Ruta: /saldo/movimientos
 *
 * Endpoints:
 *   GET /api/saldo/movimientos?idTipoSaldo=&desde=&hasta= -> { movimientos[], total }
 *   GET /api/saldo                                        -> tipos de saldo (id + nombre)
 *
 * Filas de movimientos (snake_case):
 *   { id_movimiento, tipo_saldo, concepto, naturaleza, monto, saldo_resultante,
 *     fecha_hora, referencia, id_apuesta, id_recarga }
 *
 * El filtro `idTipoSaldo` ya puede usarse: Fase 10.1 añadio `idTipoSaldo` a cada
 * cuenta de GET /api/saldo (antes solo llegaba el nombre del tipo).
 */
export default function HistorialMovimientos() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [idTipoSaldo, setIdTipoSaldo] = useState('');

  // Tipos de saldo reales para el selector.
  const cargarTipos = useCallback(() => consultarSaldo(), []);
  const saldo = usePeticion(cargarTipos, []);

  const tiposSaldo = useMemo(() => {
    const porId = new Map();
    cuentasNormalizadas(saldo.datos).forEach((cuenta) => {
      if (cuenta.idTipoSaldo !== null && !porId.has(cuenta.idTipoSaldo)) {
        porId.set(cuenta.idTipoSaldo, cuenta);
      }
    });
    return Array.from(porId.values());
  }, [saldo.datos]);

  const cargar = useCallback(
    () =>
      consultarMovimientos({
        idTipoSaldo: idTipoSaldo ? Number(idTipoSaldo) : undefined,
        desde: desdeInputFecha(desde),
        hasta: desdeInputFecha(hasta, true),
      }),
    [idTipoSaldo, desde, hasta],
  );

  const { datos, cargando, error, recargar } = usePeticion(cargar, [idTipoSaldo, desde, hasta]);

  const movimientos = datos?.movimientos || [];
  const paginacion = usePaginacion(movimientos, 10);

  const limpiarFiltros = () => {
    setDesde('');
    setHasta('');
    setIdTipoSaldo('');
  };

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Movimientos de saldo</h1>
          <p>
            Abonos y debitos del saldo ficticio (recargas, apuestas y premios). Ordenados del mas
            reciente al mas antiguo por el procedimiento usp_MovimientoSaldo_Historial.
          </p>
        </div>
        <button type="button" className="btn btn--secundario" onClick={() => recargar()}>
          Actualizar
        </button>
      </header>

      {error && (
        <Alert tipo="error" titulo="No se pudo consultar el historial">
          {error.mensaje}
        </Alert>
      )}

      {saldo.error && (
        <Alert tipo="advertencia" titulo="No se pudieron cargar los tipos de saldo">
          El filtro por tipo queda deshabilitado: {saldo.error.mensaje}
        </Alert>
      )}

      <Card titulo="Filtros" subtitulo="Parametros del endpoint: idTipoSaldo, desde y hasta">
        <div className="rejilla-filtros">
          <FormField
            etiqueta="Tipo de saldo"
            nombre="idTipoSaldo"
            tipo="select"
            valor={idTipoSaldo}
            onChange={(evento) => setIdTipoSaldo(evento.target.value)}
            opciones={tiposSaldo.map((cuenta) => ({
              valor: cuenta.idTipoSaldo,
              etiqueta: `${cuenta.nombreTipoSaldo} (tipo #${cuenta.idTipoSaldo})`,
            }))}
            placeholder="Todos los tipos"
            deshabilitado={tiposSaldo.length === 0}
            ayuda="Ids tomados de GET /api/saldo."
          />
          <FormField
            etiqueta="Desde"
            nombre="desde"
            tipo="date"
            valor={desde}
            onChange={(evento) => setDesde(evento.target.value)}
          />
          <FormField
            etiqueta="Hasta"
            nombre="hasta"
            tipo="date"
            valor={hasta}
            onChange={(evento) => setHasta(evento.target.value)}
          />
          <div className="fila">
            <button type="button" className="btn btn--secundario" onClick={limpiarFiltros}>
              Limpiar
            </button>
          </div>
        </div>
      </Card>

      <Card
        titulo="Movimientos"
        subtitulo={`${paginacion.total} registro(s)`}
        acciones={cargando ? <Loader tamano="sm" texto="Cargando..." /> : null}
      >
        <Table
          filas={paginacion.visibles}
          cargando={cargando}
          claveFila={(fila) => fila.id_movimiento}
          vacio={{
            titulo: 'Sin movimientos',
            mensaje: 'No hay movimientos con los filtros seleccionados.',
            icono: '🔁',
          }}
          columnas={[
            { clave: 'id_movimiento', titulo: '#', alineacion: 'der' },
            { clave: 'fecha_hora', titulo: 'Fecha', render: (fila) => fechaHora(fila.fecha_hora) },
            { clave: 'concepto', titulo: 'Concepto' },
            {
              clave: 'tipo_saldo',
              titulo: 'Tipo de saldo',
              render: (fila) => <Badge tipo="info">{fila.tipo_saldo}</Badge>,
            },
            {
              clave: 'naturaleza',
              titulo: 'Naturaleza',
              render: (fila) => (
                <Badge tipo={fila.naturaleza === 'debito' ? 'error' : 'exito'}>
                  {textoEstado(fila.naturaleza)}
                </Badge>
              ),
            },
            {
              clave: 'monto',
              titulo: 'Monto',
              alineacion: 'der',
              render: (fila) => (
                <span
                  className={fila.naturaleza === 'debito' ? 'monto monto--debito' : 'monto monto--abono'}
                >
                  {fila.naturaleza === 'debito' ? '-' : '+'}
                  {moneda(fila.monto)}
                </span>
              ),
            },
            {
              clave: 'saldo_resultante',
              titulo: 'Saldo resultante',
              alineacion: 'der',
              render: (fila) => moneda(fila.saldo_resultante),
            },
            {
              clave: 'referencia',
              titulo: 'Origen',
              render: (fila) => (
                <span className="texto-pequeno texto-suave">
                  {fila.referencia || '—'}
                  {fila.id_apuesta ? (
                    <>
                      <br />
                      Apuesta #{fila.id_apuesta}
                    </>
                  ) : null}
                  {fila.id_recarga ? (
                    <>
                      <br />
                      Recarga #{fila.id_recarga}
                    </>
                  ) : null}
                </span>
              ),
            },
          ]}
        />

        <Pagination
          pagina={paginacion.pagina}
          totalPaginas={paginacion.totalPaginas}
          total={paginacion.total}
          desde={paginacion.desde}
          hasta={paginacion.hasta}
          onCambiar={paginacion.cambiarPagina}
        />
      </Card>
    </div>
  );
}
