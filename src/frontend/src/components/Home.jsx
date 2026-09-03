import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Home.css'

// Datos de ejemplo (ficticios) — en una fase posterior vendrán de la base de datos
const eventos = [
  {
    id: 1,
    liga: 'Liga Colombiana · Fecha 5',
    estado: 'Próximo',
    estadoClase: 'proximo',
    fecha: 'Sáb 16/08 · 18:00',
    local: 'Atlético Nacional',
    visitante: 'Millonarios',
    cuotas: [
      { nombre: 'Local', valor: '2.10' },
      { nombre: 'Empate', valor: '3.25' },
      { nombre: 'Visitante', valor: '3.60' },
    ],
  },
  {
    id: 2,
    liga: 'Liga Colombiana · Fecha 5',
    estado: 'Próximo',
    estadoClase: 'proximo',
    fecha: 'Dom 17/08 · 15:30',
    local: 'América de Cali',
    visitante: 'Deportivo Cali',
    cuotas: [
      { nombre: 'Local', valor: '2.40' },
      { nombre: 'Empate', valor: '3.10' },
      { nombre: 'Visitante', valor: '2.90' },
    ],
  },
  {
    id: 3,
    liga: 'Liga Colombiana · Fecha 5',
    estado: 'En vivo',
    estadoClase: 'vivo',
    fecha: 'Min 63 · 1-1',
    local: 'Junior',
    visitante: 'Santa Fe',
    cuotas: [
      { nombre: 'Local', valor: '2.85' },
      { nombre: 'Empate', valor: '2.15' },
      { nombre: 'Visitante', valor: '3.40' },
    ],
  },
]

const movimientos = [
  { desc: 'Abono de saldo inicial', detalle: 'Hoy · 10:05', monto: '+ $ 100.000', tipo: 'abono' },
  { desc: 'Apuesta #A-014', detalle: 'Nacional vs Millonarios · 2.10', monto: '- $ 10.000', tipo: 'debito' },
  { desc: 'Liquidación apuesta #A-011', detalle: 'Ganada · cuota 1.80', monto: '+ $ 18.000', tipo: 'abono' },
]

function Home() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  async function salir(e) {
    e.preventDefault()
    await cerrarSesion()
    navigate('/')
  }

  const iniciales = (usuario?.nombre ?? 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

  return (
    <div className="pagina-home">
      {/* ---------- Barra superior ---------- */}
      <header>
        <div className="logo">
          <div className="logo-badge">AD</div>
          <div>
            <h1>ApuestaDB</h1>
            <span>apuestas deportivas simuladas</span>
          </div>
        </div>

        <nav>
          <a href="#eventos" className="activo">Eventos</a>
          <a href="#apuestas">Mis apuestas</a>
          <a href="#historial">Historial</a>
          <a href="#reportes">Reportes</a>
        </nav>

        <div className="usuario">
          <div className="saludo">
            <div className="etiqueta">Sesión</div>
            <div className="valor">{usuario?.nombre} · <span className={`rol rol-${usuario?.rol}`}>{usuario?.rol}</span></div>
          </div>
          <div className="avatar" title={usuario?.nombre}>{iniciales}</div>
          {usuario?.rol === 'admin' && (
            <Link to="/exportar" className="accion-top" title="Exportar datos a Excel">Exportar</Link>
          )}
          <a href="/" onClick={salir} className="accion-top">Cerrar sesión</a>
        </div>
      </header>

      <main>
        {/* Columna principal: eventos */}
        <section>
          <div className="filtros">
            <span className="chip activo">Todos</span>
            <span className="chip">Fútbol</span>
            <span className="chip">Próximos</span>
            <span className="chip">En vivo</span>
          </div>

          {eventos.map((evento) => (
            <div className="evento" key={evento.id}>
              <div>
                <div className="meta">
                  <span>{evento.liga}</span>
                  <span className={`estado ${evento.estadoClase}`}>{evento.estado}</span>
                  <span>{evento.fecha}</span>
                </div>
                <div className="equipos">
                  {evento.local} <span className="vs">vs</span> {evento.visitante}
                </div>
                <div className="cuotas">
                  {evento.cuotas.map((cuota) => (
                    <div className="cuota" key={cuota.nombre}>
                      <span className="nombre">{cuota.nombre}</span>
                      <span className="valor">{cuota.valor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <p className="nota-evento">
            * Cuotas y equipos de ejemplo. Regla de negocio provisional: no se puede apostar en
            eventos iniciados, finalizados, cancelados o suspendidos.
          </p>
        </section>

        {/* Panel lateral: saldo y movimientos */}
        <aside className="lateral">
          <div className="tarjeta">
            <div className="bloque">
              <h3>Resumen</h3>
              <div className="resumen"><span>Saldo disponible</span><span className="valor ok">$ 100.000</span></div>
              <div className="resumen"><span>Apuestas activas</span><span className="valor">2</span></div>
              <div className="resumen"><span>Ganadas</span><span className="valor">5</span></div>
            </div>

            <div className="bloque">
              <h3>Últimos movimientos</h3>
              {movimientos.map((mov, idx) => (
                <div className="movimiento" key={idx}>
                  <div>
                    <div>{mov.desc}</div>
                    <div className="detalle">{mov.detalle}</div>
                  </div>
                  <div className={`monto ${mov.tipo}`}>{mov.monto}</div>
                </div>
              ))}
            </div>

            <div className="bloque">
              <h3>Boleto de apuesta</h3>
              <div className="boleto">
                <div className="boleto-evento">Nacional vs Millonarios</div>
                <div className="boleto-seleccion">Local (1) @ <b>2.10</b></div>
                <div className="boleto-fila">
                  <label htmlFor="monto-boleto">Monto</label>
                  <input type="number" id="monto-boleto" defaultValue="10000" step="1000" min="0" />
                </div>
                <div className="resumen"><span>Posible ganancia</span><span className="valor ok">$ 21.000</span></div>
                <button className="btn-boleto" type="button">Confirmar apuesta (simulado)</button>
              </div>
              <p className="nota-boleto">
                * Reglas provisionales: no se apuesta por más saldo del disponible y la cuota queda
                congelada al confirmar.
              </p>
            </div>

            <div className="bloque">
              <h3>Enlaces</h3>
              <p className="enlaces">
                <a href="#apuesta">Registrar apuesta</a><br />
                <a href="#historial">Ver historial completo</a><br />
                <a href="#reportes">Consultas y reportes</a>
              </p>
            </div>
          </div>
        </aside>
      </main>

      <footer className="app-footer">
        Proyecto académico — Bases de Datos 2 · Tecnológico de Antioquia<br />
        Saldo ficticio. No se utiliza ni se gestiona dinero real.
      </footer>
    </div>
  )
}

export default Home
