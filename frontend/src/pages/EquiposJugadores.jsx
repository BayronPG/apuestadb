import { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';
import Table from '../components/Table.jsx';
import { listarEquipos } from '../services/equipoService.js';
import { listarJugadoresEquipo } from '../services/jugadorService.js';
import { normalizarError } from '../utils/errores.js';

const POR_DEFECTO = '/assets/logo-equipo-default.svg';

/**
 * Equipo -> Jugadores. Ruta: /equipos
 * Catálogo de solo lectura: GET /api/equipos y GET /api/equipos/:id/jugadores.
 */
export default function EquiposJugadores() {
  const [equipos, setEquipos] = useState([]);
  const [idEquipo, setIdEquipo] = useState('');
  const [jugadores, setJugadores] = useState([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(true);
  const [cargandoJugadores, setCargandoJugadores] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const datos = await listarEquipos();
        const lista = datos?.equipos || [];
        setEquipos(lista);
        if (lista.length > 0) setIdEquipo(String(lista[0].idEquipo));
      } catch (excepcion) {
        setError(normalizarError(excepcion).mensaje);
      } finally {
        setCargandoEquipos(false);
      }
    })();
  }, []);

  const cargarJugadores = useCallback(async (id) => {
    if (!id) return;
    setCargandoJugadores(true);
    setError(null);
    try {
      const datos = await listarJugadoresEquipo(id);
      setJugadores(datos?.jugadores || []);
    } catch (excepcion) {
      setJugadores([]);
      setError(normalizarError(excepcion).mensaje);
    } finally {
      setCargandoJugadores(false);
    }
  }, []);

  useEffect(() => {
    if (idEquipo) cargarJugadores(Number(idEquipo));
  }, [idEquipo, cargarJugadores]);

  const equipo = useMemo(
    () => equipos.find((fila) => String(fila.idEquipo) === String(idEquipo)) || null,
    [equipos, idEquipo],
  );

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Equipos y jugadores</h1>
          <p>Plantillas del catálogo. Selecciona un equipo para ver sus jugadores.</p>
        </div>
      </header>

      {error && (
        <Alert tipo="error" titulo="No se pudo cargar la información" onCerrar={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card titulo="Equipo" subtitulo="20 equipos de la Liga BetPlay">
        {cargandoEquipos ? (
          <Loader texto="Consultando equipos..." />
        ) : (
          <div className="pila">
            <label className="campo">
              <span className="campo__etiqueta">Seleccionar equipo</span>
              <select
                className="campo__control"
                value={idEquipo}
                onChange={(evento) => setIdEquipo(evento.target.value)}
              >
                {equipos.map((fila) => (
                  <option key={fila.idEquipo} value={fila.idEquipo}>
                    {fila.nombre}
                  </option>
                ))}
              </select>
            </label>

            {equipo && (
              <div className="fila" style={{ alignItems: 'center', gap: 12 }}>
                <img className="team-logo" style={{ width: 56, height: 56 }} src={equipo.logoUrl || POR_DEFECTO} alt="" />
                <div>
                  <strong>{equipo.nombre}</strong>
                  <div className="texto-pequeno texto-suave">
                    {jugadores.length} jugador(es) en la plantilla
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card titulo="Jugadores" subtitulo="Nombre, posición y dorsal">
        <Table
          filas={jugadores}
          cargando={cargandoJugadores}
          claveFila={(fila) => fila.idJugador}
          vacio={{
            titulo: 'Sin jugadores',
            mensaje: 'Este equipo aún no tiene plantilla cargada.',
            icono: '👥',
          }}
          columnas={[
            {
              clave: 'numeroCamiseta',
              titulo: 'Dorsal',
              alineacion: 'der',
              render: (fila) => fila.numeroCamiseta ?? '—',
            },
            {
              clave: 'nombres',
              titulo: 'Jugador',
              render: (fila) => `${fila.nombres} ${fila.apellidos}`.trim(),
            },
            {
              clave: 'posicion',
              titulo: 'Posición',
              render: (fila) => <Badge tipo="info">{fila.posicion || 'Sin posición'}</Badge>,
            },
            { clave: 'nacionalidad', titulo: 'Nacionalidad' },
          ]}
        />
      </Card>
    </div>
  );
}
