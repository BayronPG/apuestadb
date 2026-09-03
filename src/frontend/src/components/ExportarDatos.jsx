import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './ExportarDatos.css'

function ExportarDatos() {
  const { usuario } = useAuth()
  const [tablas, setTablas] = useState([])
  const [seleccion, setSeleccion] = useState(() => new Set())
  const [mensaje, setMensaje] = useState(null) // { tipo: 'ok' | 'error', texto }
  const [cargandoLista, setCargandoLista] = useState(true)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    fetch('/api/exportar/tablas')
      .then(async (r) => {
        if (!r.ok) throw new Error('Sin permisos o sin sesión.')
        return r.json()
      })
      .then((d) => setTablas(d.tablas ?? []))
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudo cargar la lista de tablas.' }))
      .finally(() => setCargandoLista(false))
  }, [])

  function alternar(nombre) {
    setSeleccion((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(nombre)) nuevo.delete(nombre)
      else nuevo.add(nombre)
      return nuevo
    })
  }

  function seleccionarTodas() {
    setSeleccion(new Set(tablas.map((t) => t.nombre)))
  }

  function seleccionarNinguna() {
    setSeleccion(new Set())
  }

  async function exportar() {
    if (seleccion.size === 0) return
    setExportando(true)
    setMensaje(null)
    try {
      const nombres = [...seleccion].map((n) => encodeURIComponent(n)).join(',')
      const r = await fetch(`/api/exportar?tablas=${nombres}`)
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.mensaje || 'No se pudo exportar.')
      }
      const blob = await r.blob()
      const cd = r.headers.get('Content-Disposition') || ''
      const m = cd.match(/filename="?([^";]+)"?/i)
      const nombreArchivo = m ? m[1] : 'ApuestaDB_exportacion.xlsx'

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nombreArchivo
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 3000)

      setMensaje({
        tipo: 'ok',
        texto: `Exportación completada: ${nombreArchivo} (${seleccion.size} tabla(s)). Revisa tu carpeta de descargas.`,
      })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Ocurrió un error al exportar.' })
    } finally {
      setExportando(false)
    }
  }

  // Restriccion por rol: solo administradores
  if (usuario?.rol !== 'admin') {
    return (
      <div className="pagina-exportar">
        <div className="card-exportar">
          <h1>Exportar datos a Excel</h1>
          <div className="alerta">
            Acceso restringido: esta acción requiere rol de administrador.
          </div>
          <p>
            <Link to="/home">← Volver al inicio</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="pagina-exportar">
      <div className="card-exportar">
        <div className="cabecera">
          <div>
            <h1>Exportar datos a Excel</h1>
            <p className="subtitulo">
              Selecciona una o varias tablas de la base de datos. Cada tabla se exporta en una
              hoja independiente del archivo <code>.xlsx</code>.
            </p>
          </div>
          <Link to="/home" className="volver">← Volver al inicio</Link>
        </div>

        {mensaje && (
          <div className={mensaje.tipo === 'ok' ? 'aviso-exito' : 'alerta'}>{mensaje.texto}</div>
        )}

        {cargandoLista ? (
          <p className="subtitulo">Cargando tablas…</p>
        ) : (
          <>
            <div className="acciones">
              <button type="button" className="btn-secundario" onClick={seleccionarTodas}>
                Seleccionar todas
              </button>
              <button type="button" className="btn-secundario" onClick={seleccionarNinguna}>
                Ninguna
              </button>
              <span className="contador">{seleccion.size} seleccionada(s)</span>
            </div>

            <ul className="lista-tablas">
              {tablas.map((t) => (
                <li key={t.nombre}>
                  <label>
                    <input
                      type="checkbox"
                      checked={seleccion.has(t.nombre)}
                      onChange={() => alternar(t.nombre)}
                    />
                    <span className="nombre">{t.nombre}</span>
                    <span className="filas">{t.filas} registro(s)</span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="pie">
              <button
                type="button"
                className="btn-exportar"
                disabled={seleccion.size === 0 || exportando}
                onClick={exportar}
              >
                {exportando ? 'Generando archivo…' : 'Exportar a Excel (.xlsx)'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ExportarDatos
