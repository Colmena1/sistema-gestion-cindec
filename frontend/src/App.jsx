import { Routes, Route } from 'react-router-dom'
import LayoutPrincipal from './layouts/LayoutPrincipal.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import Login from './pages/Login.jsx'
import Inicio from './pages/Inicio.jsx'
import PantallaPendiente from './pages/PantallaPendiente.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'
import { TODAS_LAS_OPCIONES, rolesDeRuta } from './config/menu.js'

// Mapa de rutas de la aplicación.
// - /login es pública.
// - Todo lo demás requiere sesión, y cada pantalla solo la abren los roles que la tienen en su menú.
// Las pantallas que todavía no se construyen muestran en qué sprint se hacen.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RutaProtegida><LayoutPrincipal /></RutaProtegida>}>
        <Route index element={<Inicio />} />
        {TODAS_LAS_OPCIONES.filter((op) => op.ruta !== '/').map((op) => (
          <Route key={op.ruta} path={op.ruta}
            element={<RutaProtegida roles={rolesDeRuta(op.ruta)}><PantallaPendiente opcion={op} /></RutaProtegida>} />
        ))}
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
