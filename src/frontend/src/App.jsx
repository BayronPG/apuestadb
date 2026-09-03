import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import RequisitoSesion from './components/RequisitoSesion.jsx'
import InicioSesion from './components/InicioSesion.jsx'
import Registro from './components/Registro.jsx'
import Recuperar from './components/Recuperar.jsx'
import Home from './components/Home.jsx'
import ExportarDatos from './components/ExportarDatos.jsx'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<InicioSesion />} />
        <Route path="/registrar" element={<Registro />} />
        <Route path="/recuperar" element={<Recuperar />} />
        {/* Rutas protegidas: requieren sesión activa */}
        <Route
          path="/home"
          element={
            <RequisitoSesion>
              <Home />
            </RequisitoSesion>
          }
        />
        <Route
          path="/exportar"
          element={
            <RequisitoSesion>
              <ExportarDatos />
            </RequisitoSesion>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
