import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';
import Metrica from '../components/Metrica.jsx';
import Pagination from '../components/Pagination.jsx';
import Table from '../components/Table.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { usePaginacion } from '../hooks/usePaginacion.js';
import { listarApuestas, resumenApuestas } from '../services/apuestaService.js';
import { fechaHora, moneda, textoEstado, tipoBadgeEstado } from '../utils/formato.js';
import { PESTANAS_APUESTA } from '../utils/constantes.js';

/**
 * Historial de apuestas del usuario. Ruta: /apuestas
 *
 * Endpoints consumidos:
 *   GET /api/apuestas?estado=          -> lista principal (filtro por pestana)
 *   GET /api/apuestas/pendientes       -> resumen (totales y montos)
 *   GET /api/apuestas/ganadas          -> resumen con premios
 *   GET /api/apuestas/perdidas         -> resumen
 *
 * Filas (snake_case): id_apuesta, fecha_hora_registro, tipo_apuesta, estado,
 * deporte, liga, equipo_local, equipo_visitante, mercado, opcion,
 * cuota_congelada, monto, tipo_saldo, resultado_liquidacion, monto_premio.
 */
export default function HistorialApuestas() {
  const [estado, setEstado] = useState('');

  const cargar = useCallback(() => listarApuestas(estado || undefined), [estado]);
  const lista = usePeticion(cargar, [estado]);

  const cargarResumen = useCallback(() => resumenApuestas(), []);
  const resumen = usePeticion(cargarResumen, []);

  const apuestas = lista.datos?.apuestas || [];
  const paginacion = usePaginacion(apuestas, 10);

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Historial de apuestas</h1>
          <p>
            Apuestas simples registradas por tu usuario (usp_Apuesta_Historial y las vistas
            vw_ApuestasPendientes / vw_ApuestasGanadas / vw_ApuestasPerdidas).
          </p>
        </div>
        <div className="fila fila--envuelve">
          <button type="button" className="btn btn--secundario" onClick={() => lista.recargar()}>
            Actualizar
          </button>
          <Link className="btn btn--primario" to="/apuestas/nueva">
            Crear apuesta
          </Link>
        </div>
      </header>

      <div className="grid grid-3">
        <Card titulo="Pendientes">
          {resumen.cargando ? (
            <Loader texto="Consultando..." />
          ) : (
            <Metrica
              etiqueta="Sin liquidar"
              valor={resumen.datos?.pendientes?.total ?? 0}
              detalle={`Monto apostado: ${moneda(resumen.datos?.pendientes?.monto ?? 0)}`}
              tono="advertencia"
            />
          )}
        </Card>

        <Card titulo="Ganadas">
          {resumen.cargando ? (
            <Loader texto="Consultando..." />
          ) : (
            <Metrica
              etiqueta="Liquidadas a favor"
              valor={resumen.datos?.ganadas?.total ?? 0}
              detalle={`Premios abonados: ${moneda(resumen.datos?.ganadas?.premios ?? 0)}`}
              tono="exito"
            />
          )}
        </Card>

        <Card titulo="Perdidas">
          {resumen.cargando ? (
            <Loader texto="Consultando..." />
          ) : (
            <Metrica
              etiqueta="Liquidadas en contra"
              valor={resumen.datos?.perdidas?.total ?? 0}
              detalle={`Monto apostado: ${moneda(resumen.datos?.perdidas?.monto ?? 0)}`}
              tono="error"
            />
          )}
        </Card>
      </div>

      {resumen.error && (
        <Alert tipo="advertencia" titulo="El resumen no pudo cargarse">
          {resumen.error.mensaje}
        </Alert>
      )}

      {lista.error && (
        <Alert tipo="error" titulo="No se pudo consultar el historial">
          {lista.error.mensaje}
        </Alert>
      )}

      <Card
        titulo="Apuestas"
        subtitulo="Filtro por estado (parametro estado del endpoint)"
        acciones={<Badge tipo="info">{paginacion.total} registro(s)</Badge>}
      >
        <div className="pestanas">
          {PESTANAS_APUESTA.map((pestana) => (
            <button
              key={pestana.clave || 'todas'}
              type="button"
              className={estado === pestana.clave ? 'pestana pestana--activa' : 'pestana'}
              onClick={() => setEstado(pestana.clave)}
            >
              {pestana.etiqueta}
            </button>
          ))}
        </div>

        <Table
          filas={paginacion.visibles}
          cargando={lista.cargando}
          claveFila={(fila) => fila.id_apuesta}
          vacio={{
            titulo: 'Sin apuestas',
            mensaje:
              'No hay apuestas registradas para el filtro seleccionado. Puedes crear una desde "Crear apuesta".',
            icono: '🎫',
          }}
          columnas={[
            { clave: 'id_apuesta', titulo: '#', alineacion: 'der' },
            {
              clave: 'partido',
              titulo: 'Evento',
              render: (fila) => (
                <span>
                  {fila.equipo_local} vs {fila.equipo_visitante}
                  <br />
                  <span className="texto-pequeno texto-suave">
                    {fila.deporte} · {fila.liga}
                  </span>
                </span>
              ),
            },
            {
              clave: 'seleccion',
              titulo: 'Seleccion',
              render: (fila) => (
                <span>
                  {fila.mercado}
                  <br />
                  <Badge tipo="primario">{fila.opcion}</Badge>
                </span>
              ),
            },
            {
              clave: 'fecha_hora_registro',
              titulo: 'Registro',
              render: (fila) => fechaHora(fila.fecha_hora_registro),
            },
            {
              clave: 'monto',
              titulo: 'Monto',
              alineacion: 'der',
              render: (fila) => moneda(fila.monto),
            },
            {
              clave: 'cuota_congelada',
              titulo: 'Cuota',
              alineacion: 'der',
              render: (fila) => Number(fila.cuota_congelada ?? 0).toFixed(2),
            },
            { clave: 'tipo_saldo', titulo: 'Saldo' },
            {
              clave: 'estado',
              titulo: 'Estado',
              render: (fila) => (
                <>
                  <Badge tipo={tipoBadgeEstado(fila.estado)}>{textoEstado(fila.estado)}</Badge>
                  {fila.resultado_liquidacion && (
                    <>
                      <br />
                      <span className="texto-pequeno texto-suave">
                        {textoEstado(fila.resultado_liquidacion)}
                      </span>
                    </>
                  )}
                </>
              ),
            },
            {
              clave: 'monto_premio',
              titulo: 'Premio',
              alineacion: 'der',
              render: (fila) =>
                fila.monto_premio === null || fila.monto_premio === undefined ? (
                  <span className="texto-suave">—</span>
                ) : (
                  <span className="monto monto--abono">{moneda(fila.monto_premio)}</span>
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
