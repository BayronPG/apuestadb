import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Alert from '../components/Alert.jsx';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';
import Table from '../components/Table.jsx';
import { listarEquipos, subirLogoEquipo } from '../services/equipoService.js';
import { normalizarError } from '../utils/errores.js';

const TIPOS = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;
const POR_DEFECTO = '/assets/logo-equipo-default.svg';

/**
 * Carga de escudos de equipo. Ruta: /admin/logos (solo administrador).
 * Reutiliza POST /api/equipos/:id/logo (multipart, campo "logo").
 */
export default function AdminLogos() {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [idEquipo, setIdEquipo] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await listarEquipos();
      const lista = datos?.equipos || [];
      setEquipos(lista);
      if (!idEquipo && lista.length > 0) setIdEquipo(String(lista[0].idEquipo));
    } catch (excepcion) {
      setError(normalizarError(excepcion).mensaje);
    } finally {
      setCargando(false);
    }
  }, [idEquipo]);

  useEffect(() => {
    cargar();
    // Solo al montar: el id se conserva entre recargas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seleccionado = useMemo(
    () => equipos.find((equipo) => String(equipo.idEquipo) === String(idEquipo)) || null,
    [equipos, idEquipo],
  );

  const alElegirArchivo = (evento) => {
    setError(null);
    setExito(null);
    const elegido = evento.target.files?.[0] || null;
    if (!elegido) {
      setArchivo(null);
      return;
    }
    if (!TIPOS.includes(elegido.type)) {
      setArchivo(null);
      evento.target.value = '';
      setError('Formato no permitido. Usa PNG, JPG o WebP.');
      return;
    }
    if (elegido.size > MAX_BYTES) {
      setArchivo(null);
      evento.target.value = '';
      setError('El archivo supera 5 MB.');
      return;
    }
    setArchivo(elegido);
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setExito(null);
    if (!idEquipo || !archivo) {
      setError('Selecciona un equipo y un archivo.');
      return;
    }
    setEnviando(true);
    try {
      await subirLogoEquipo(Number(idEquipo), archivo);
      const nombre = seleccionado?.nombre || `equipo ${idEquipo}`;
      setExito(`Escudo actualizado para ${nombre}.`);
      setArchivo(null);
      evento.target.reset();
      await cargar();
    } catch (excepcion) {
      setError(normalizarError(excepcion).mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Escudos de equipos</h1>
          <p>Sube el escudo de cada equipo. Se guarda en Drive y se asocia al catálogo.</p>
        </div>
        <Link className="btn btn--secundario" to="/admin">
          Volver al panel
        </Link>
      </header>

      {error && (
        <Alert tipo="error" titulo="No se pudo completar la operación" onCerrar={() => setError(null)}>
          {error}
        </Alert>
      )}
      {exito && (
        <Alert tipo="exito" titulo="Escudo actualizado" onCerrar={() => setExito(null)}>
          {exito}
        </Alert>
      )}

      <Card titulo="Subir escudo" subtitulo="PNG, JPG o WebP · máximo 5 MB">
        <form className="pila" onSubmit={enviar}>
          <label className="campo">
            <span className="campo__etiqueta">Equipo</span>
            <select
              className="campo__control"
              value={idEquipo}
              onChange={(evento) => setIdEquipo(evento.target.value)}
              disabled={cargando || enviando}
            >
              {equipos.map((equipo) => (
                <option key={equipo.idEquipo} value={equipo.idEquipo}>
                  {equipo.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            <span className="campo__etiqueta">Archivo</span>
            <input
              className="campo__control"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={alElegirArchivo}
              disabled={enviando}
            />
          </label>

          {seleccionado && (
            <div className="fila" style={{ alignItems: 'center', gap: 12 }}>
              <img className="team-logo" style={{ width: 48, height: 48 }} src={seleccionado.logoUrl || POR_DEFECTO} alt="" />
              <span className="texto-pequeno texto-suave">
                {seleccionado.logoUrl?.includes('/api/equipos/')
                  ? 'Escudo personalizado cargado'
                  : 'Usando escudo por defecto'}
              </span>
            </div>
          )}

          <div className="fila">
            <button type="submit" className="btn btn--primario" disabled={enviando || !archivo}>
              {enviando ? 'Subiendo...' : 'Subir escudo'}
            </button>
          </div>
        </form>
      </Card>

      <Card titulo="Estado de los escudos" subtitulo="GET /api/equipos">
        {cargando ? (
          <Loader texto="Consultando equipos..." />
        ) : (
          <Table
            filas={equipos}
            claveFila={(fila) => fila.idEquipo}
            vacio={{ titulo: 'Sin equipos', mensaje: 'No hay equipos en el catálogo.' }}
            columnas={[
              {
                clave: 'logoUrl',
                titulo: 'Escudo',
                render: (fila) => (
                  <img className="team-logo" style={{ width: 40, height: 40 }} src={fila.logoUrl || POR_DEFECTO} alt="" />
                ),
              },
              { clave: 'nombre', titulo: 'Equipo' },
              {
                clave: 'estadoLogo',
                titulo: 'Estado',
                render: (fila) => (
                  <span className="texto-pequeno texto-suave">
                    {fila.logoUrl?.includes('/api/equipos/') ? 'Personalizado' : 'Por defecto'}
                  </span>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
