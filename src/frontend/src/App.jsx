import { Routes, Route } from 'react-router-dom'
import InicioSesion from './components/InicioSesion.jsx'
import Registro from './components/Registro.jsx'
import Recuperar from './components/Recuperar.jsx'
import Home from './components/Home.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<InicioSesion />} />
      <Route path="/registrar" element={<Registro />} />
      <Route path="/recuperar" element={<Recuperar />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  )
}

export default App
