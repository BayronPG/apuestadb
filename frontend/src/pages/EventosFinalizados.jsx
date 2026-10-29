import { useCallback, useMemo, useState } from 'react';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import FormField from '../components/FormField.jsx';
import Pagination from '../components/Pagination.jsx';
import Table from '../components/Table.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { usePaginacion } from '../hooks/usePaginacion.js';
import { listarEventosFinalizados } from '../services/eventoService.js';
import { fechaHora, textoEstado, tipoBadgeEstado } from '../utils/formato.js';

/**
 * Eventos finalizados con su resultado. Ruta: /eventos/finalizados
 *
 * Endpoint: GET /api/eventos/finalizados -> { eventos[], total }
 *   eventos[]: { id_evento, deporte, liga, equipo_local, equipo_visitante,
 *                fecha_hora_inicio, marcador_local, marcador_visitante,
 *                opcion_ganadora, estado_resultado, fecha_registro }
 *
 * La columna `opcion_ganadora` la deriva la base con fn_OpcionGanadora a partir
 * del marcador (local / empate / visitante).
 */
export default function EventosFinalizados() {
  const [deporte, setDeporte] = useState('');

  const cargar = useCallback(() => listarEventosFinalizados(), []);
  const { datos, cargando, error, recargar } = usePeticion(cargar, []);

  const eventos = datos?.eventos || [];

  const deportes = useMemo(
    () => Array.from(new Set(eventos.map((evento) => evento.deporte).filter(Boolean))).sort(),
    [eventos],
  );

  const filtrados = useMemo(
    () => (deporte ? eventos.filter((evento) => evento.deporte === deporte) : eventos),
    [eventos, deporte],
  );

  const paginacion = usePaginacion(filtrados, 10);

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Eventos finalizados</h1>
          <p>
            Resultados oficiales registrados por el administrador (vw_EventosFinalizados). El
            resultado oficial habilita la liquidacion de las apuestas pendientes (RN-15).
          </p>
        </div>
        <button type="button" className="btn btn--secundario" onClick={() => recargar()}>
          Actualizar
        </button>
      </header>

      {error && (
        <Alert tipo="error" titulo="No se pudieron consultar los eventos">
          {error.mensaje}
        </Alert>
      )}

      <Card titulo="Filtro" subtitulo="Se aplica sobre los datos ya cargados">
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
        </div>
      </Card>

      <Card titulo="Resultados" subtitulo={`${paginacion.total} evento(s)`}>
        <Table
          filas={paginacion.visibles}
          cargando={cargando}
          claveFila={(fila) => fila.id_evento}
          vacio={{
            titulo: 'Sin eventos finalizados',
            mensaje: 'Todavia no hay resultados oficiales registrados.',
            icono: '🏁',
          }}
          columnas={[
            { clave: 'id_evento', titulo: '#', alineacion: 'der' },
            {
              clave: 'partido',
              titulo: 'Partido',
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
            { clave: 'fecha_hora_inicio', titulo: 'Inicio', render: (fila) => fechaHora(fila.fecha_hora_inicio) },
            {
              clave: 'marcador',
              titulo: 'Marcador',
              alineacion: 'der',
              render: (fila) =>
                fila.marcador_local === null || fila.marcador_local === undefined ? (
                  <span className="texto-suave">sin resultado</span>
                ) : (
                  <strong>
                    {fila.marcador_local} - {fila.marcador_visitante}
                  </strong>
                ),
            },
            {
              clave: 'opcion_ganadora',
              titulo: 'Opcion ganadora',
              render: (fila) =>
                fila.opcion_ganadora ? (
                  <Badge tipo="primario">{fila.opcion_ganadora}</Badge>
                ) : (
                  <span className="texto-suave">—</span>
                ),
            },
            {
              clave: 'estado_resultado',
              titulo: 'Estado resultado',
              render: (fila) => (
                <Badge tipo={tipoBadgeEstado(fila.estado_resultado)}>
                  {textoEstado(fila.estado_resultado)}
                </Badge>
              ),
            },
            {
              clave: 'fecha_registro',
              titulo: 'Registrado',
              render: (fila) => fechaHora(fila.fecha_registro),
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
