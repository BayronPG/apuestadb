import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import Pagination from '../components/Pagination.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { usePaginacion } from '../hooks/usePaginacion.js';
import { listarNotificaciones } from '../services/notificacionService.js';
import { fechaHora } from '../utils/formato.js';
import { ESTADOS_NOTIFICACION, LIMITE_NOTIFICACIONES } from '../utils/constantes.js';

/**
 * Bandeja de notificaciones. Ruta: /notificaciones
 *
 * Endpoint: GET /api/notificaciones?estado=&limite=
 *   -> { notificaciones[], total }
 *   notificaciones[]: { id_notificacion, id_usuario, mensaje, tipo, fecha_hora, estado }
 *
 * La API es de solo lectura: no existe endpoint para marcar una notificacion
 * como leida, por lo que la accion se muestra deshabilitada y documentada.
 */
export default function Notificaciones() {
  const [estado, setEstado] = useState('');

  const cargar = useCallback(
    () => listarNotificaciones({ estado: estado || undefined, limite: LIMITE_NOTIFICACIONES }),
    [estado],
  );

  const { datos, cargando, error, recargar } = usePeticion(cargar, [estado]);

  const notificaciones = datos?.notificaciones || [];
  const paginacion = usePaginacion(notificaciones, 10);

  const noLeidas = notificaciones.filter((n) => n.estado === 'no_leida').length;

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Notificaciones</h1>
          <p>
            Avisos generados por la base de datos (recargas, liquidaciones y otras operaciones).
            Maximo {LIMITE_NOTIFICACIONES} registros por consulta.
          </p>
        </div>
        <button type="button" className="btn btn--secundario" onClick={() => recargar()}>
          Actualizar
        </button>
      </header>

      {error && (
        <Alert tipo="error" titulo="No se pudieron consultar las notificaciones">
          {error.mensaje}
        </Alert>
      )}

      <Card
        titulo="Filtro"
        subtitulo="Parametro estado del endpoint"
        acciones={<Badge tipo="info">{noLeidas} sin leer</Badge>}
      >
        <div className="pestanas">
          <button
            type="button"
            className={estado === '' ? 'pestana pestana--activa' : 'pestana'}
            onClick={() => setEstado('')}
          >
            Todas
          </button>
          {ESTADOS_NOTIFICACION.map((valor) => (
            <button
              key={valor}
              type="button"
              className={estado === valor ? 'pestana pestana--activa' : 'pestana'}
              onClick={() => setEstado(valor)}
            >
              {valor === 'no_leida' ? 'No leidas' : 'Leidas'}
            </button>
          ))}
        </div>

        <Alert tipo="info" titulo="Accion no disponible">
          Marcar una notificacion como leida requeriria un endpoint de escritura que la API no
          expone todavia (solo existe la lectura). Ver docs/frontend/INTEGRACION_API.md.
        </Alert>
      </Card>

      <Card titulo="Bandeja" subtitulo={`${paginacion.total} notificacion(es)`}>
        {cargando && <Loader bloque texto="Consultando notificaciones..." />}

        {!cargando && notificaciones.length === 0 && (
          <EmptyState
            icono="🔔"
            titulo="Sin notificaciones"
            mensaje="No hay notificaciones para el filtro seleccionado."
          />
        )}

        {!cargando && notificaciones.length > 0 && (
          <>
            <ul className="lista-simple">
              {paginacion.visibles.map((notificacion) => (
                <li key={notificacion.id_notificacion}>
                  <span>
                    <strong>{notificacion.mensaje}</strong>
                    <br />
                    <span className="texto-pequeno texto-suave">
                      Tipo: {notificacion.tipo} · {fechaHora(notificacion.fecha_hora)}
                    </span>
                  </span>
                  <Badge tipo={notificacion.estado === 'no_leida' ? 'info' : 'neutro'}>
                    {notificacion.estado === 'no_leida' ? 'No leida' : 'Leida'}
                  </Badge>
                </li>
              ))}
            </ul>

            <Pagination
              pagina={paginacion.pagina}
              totalPaginas={paginacion.totalPaginas}
              total={paginacion.total}
              desde={paginacion.desde}
              hasta={paginacion.hasta}
              onCambiar={paginacion.cambiarPagina}
            />
          </>
        )}

        <div className="card__pie">
          Revisa tambien tus <Link to="/apuestas">apuestas</Link> y tus{' '}
          <Link to="/saldo/movimientos">movimientos de saldo</Link>.
        </div>
      </Card>
    </div>
  );
}
