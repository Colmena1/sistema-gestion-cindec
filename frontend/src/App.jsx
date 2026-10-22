import { Routes, Route } from 'react-router-dom'
import LayoutPrincipal from './layouts/LayoutPrincipal.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import Login from './pages/Login.jsx'
import RecuperarContrasena from './pages/RecuperarContrasena.jsx'
import RestablecerContrasena from './pages/RestablecerContrasena.jsx'
import Inicio from './pages/Inicio.jsx'
import Usuarios from './pages/Usuarios.jsx'
import PantallaPendiente from './pages/PantallaPendiente.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'
import { TODAS_LAS_OPCIONES, rolesDeRuta } from './config/menu.js'

// Mapa de rutas de la aplicación.
// - /login, /recuperar y /restablecer son públicas.
// - Todo lo demás requiere sesión, y cada pantalla solo la abren los roles que la tienen en su menú.
// Las pantallas que todavía no se construyen muestran en qué sprint se hacen.
// Rutas que ya tienen su pantalla real (las demás muestran "se construye en el Sprint N").
const PANTALLAS_LISTAS = ['/', '/usuarios']

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<RecuperarContrasena />} />
      <Route path="/restablecer" element={<RestablecerContrasena />} />

      <Route element={<RutaProtegida><LayoutPrincipal /></RutaProtegida>}>
        <Route index element={<Inicio />} />
        <Route path="/usuarios" element={<RutaProtegida roles={rolesDeRuta('/usuarios')}><Usuarios /></RutaProtegida>} />
        {TODAS_LAS_OPCIONES.filter((op) => !PANTALLAS_LISTAS.includes(op.ruta)).map((op) => (
          <Route key={op.ruta} path={op.ruta}
            element={<RutaProtegida roles={rolesDeRuta(op.ruta)}><PantallaPendiente opcion={op} /></RutaProtegida>} />
        ))}
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
