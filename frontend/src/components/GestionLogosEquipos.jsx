import { useEffect, useRef, useState } from 'react';

import Alert from './Alert.jsx';
import EmptyState from './EmptyState.jsx';
import Loader from './Loader.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { listarEquipos, subirLogoEquipo } from '../services/equipoService.js';
import { mensajeDeError } from '../utils/errores.js';

const TAMANO_MAXIMO = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = new Set(['image/png', 'image/jpeg', 'image/webp']);

function iniciales(nombre) {
  return String(nombre || 'Equipo')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

function LogoEquipo({ equipo }) {
  const [fallo, setFallo] = useState(false);

  useEffect(() => setFallo(false), [equipo.logoUrl]);

  if (!equipo.logoUrl || fallo) {
    return (
      <span className="logos-equipos__fallback" aria-label={`Logo de ${equipo.nombre}`}>
        {iniciales(equipo.nombre)}
      </span>
    );
  }

  return (
    <img
      className="logos-equipos__imagen"
      src={equipo.logoUrl}
      alt={`Logo de ${equipo.nombre}`}
      onError={() => setFallo(true)}
    />
  );
}

export default function GestionLogosEquipos() {
  const cargarEquipos = useRef(() => listarEquipos()).current;
  const equiposPeticion = usePeticion(cargarEquipos, []);
  const [equipos, setEquipos] = useState([]);
  const [archivos, setArchivos] = useState({});
  const [previews, setPreviews] = useState({});
  const [subiendoId, setSubiendoId] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (equiposPeticion.datos?.equipos) setEquipos(equiposPeticion.datos.equipos);
  }, [equiposPeticion.datos]);

  useEffect(
    () => () => Object.values(previews).forEach((preview) => URL.revokeObjectURL(preview)),
    [previews],
  );

  const seleccionarArchivo = (idEquipo, evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    setMensaje(null);
    setError(null);
    if (!archivo) return;

    if (!TIPOS_PERMITIDOS.has(archivo.type) || /\.svg$/i.test(archivo.name)) {
      setError('El logo debe ser una imagen PNG, JPG o WebP. Los archivos SVG no están permitidos.');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      setError('El logo no puede superar 5 MB.');
      return;
    }

    setArchivos((anteriores) => ({ ...anteriores, [idEquipo]: archivo }));
    setPreviews((anteriores) => {
      if (anteriores[idEquipo]) URL.revokeObjectURL(anteriores[idEquipo]);
      return { ...anteriores, [idEquipo]: URL.createObjectURL(archivo) };
    });
  };

  const guardarLogo = async (idEquipo) => {
    const archivo = archivos[idEquipo];
    if (!archivo) {
      setError('Seleccione un archivo antes de guardar el logo.');
      return;
    }

    setSubiendoId(idEquipo);
    setMensaje(null);
    setError(null);
    try {
      const datos = await subirLogoEquipo(idEquipo, archivo);
      const logoUrl = datos.logo?.url;
      setEquipos((anteriores) =>
        anteriores.map((equipo) => (equipo.idEquipo === idEquipo ? { ...equipo, logoUrl } : equipo)),
      );
      setArchivos((anteriores) => {
        const siguiente = { ...anteriores };
        delete siguiente[idEquipo];
        return siguiente;
      });
      setPreviews((anteriores) => {
        if (anteriores[idEquipo]) URL.revokeObjectURL(anteriores[idEquipo]);
        const siguiente = { ...anteriores };
        delete siguiente[idEquipo];
        return siguiente;
      });
      setMensaje(`Logo de ${equipos.find((equipo) => equipo.idEquipo === idEquipo)?.nombre || 'equipo'} actualizado.`);
    } catch (excepcion) {
      setError(mensajeDeError(excepcion));
    } finally {
      setSubiendoId(null);
    }
  };

  return (
    <section className="panel-seccion" aria-labelledby="titulo-logos-equipos">
      <div className="panel-seccion__cabecera">
        <div>
          <h2 className="panel-seccion__titulo" id="titulo-logos-equipos">
            <span aria-hidden="true">⚽</span>
            Logos de equipos
          </h2>
          <p className="panel-seccion__subtitulo">
            Catálogo de equipos (GET /api/equipos). Formatos permitidos: PNG, JPG y WebP; máximo 5 MB.
          </p>
        </div>
        {equipos.length > 0 && <span className="badge badge--info">{equipos.length} equipos</span>}
      </div>

      {error && <Alert tipo="error" titulo="No se pudo actualizar el logo">{error}</Alert>}
      {mensaje && <Alert tipo="exito" onCerrar={() => setMensaje(null)}>{mensaje}</Alert>}
      {equiposPeticion.error && (
        <Alert tipo="error" titulo="No se pudo consultar el catálogo">
          {equiposPeticion.error.mensaje}
        </Alert>
      )}
      {equiposPeticion.cargando && <Loader bloque texto="Consultando equipos..." />}
      {!equiposPeticion.cargando && equipos.length === 0 && !equiposPeticion.error && (
        <EmptyState titulo="Sin equipos" mensaje="No hay equipos disponibles en el catálogo." icono="⚽" />
      )}

      {!equiposPeticion.cargando && equipos.length > 0 && (
        <div className="logos-equipos__rejilla">
          {equipos.map((equipo) => {
            const preview = previews[equipo.idEquipo];
            const subiendo = subiendoId === equipo.idEquipo;
            return (
              <article className="logos-equipos__tarjeta" key={equipo.idEquipo}>
                <div className="logos-equipos__muestra">
                  {preview ? (
                    <img className="logos-equipos__imagen" src={preview} alt={`Vista previa de ${equipo.nombre}`} />
                  ) : (
                    <LogoEquipo equipo={equipo} />
                  )}
                </div>
                <h3 className="logos-equipos__nombre">{equipo.nombre}</h3>
                <label className="btn btn--secundario btn--sm logos-equipos__selector">
                  Seleccionar logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(evento) => seleccionarArchivo(equipo.idEquipo, evento)}
                    disabled={subiendo}
                  />
                </label>
                {preview && (
                  <button
                    type="button"
                    className="btn btn--primario btn--sm"
                    onClick={() => guardarLogo(equipo.idEquipo)}
                    disabled={subiendo}
                  >
                    {subiendo ? 'Guardando...' : 'Guardar logo'}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
