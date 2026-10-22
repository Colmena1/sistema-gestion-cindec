import { Routes, Route } from 'react-router-dom'
import LayoutPrincipal from './layouts/LayoutPrincipal.jsx'
import Inicio from './pages/Inicio.jsx'
import PantallaPendiente from './pages/PantallaPendiente.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'
import { TODAS_LAS_OPCIONES } from './config/menu.js'

// Mapa de rutas de la aplicación.
// Las pantallas que todavía no se construyen muestran en qué sprint se hacen;
// conforme avancen los sprints, cada una se cambia por su página real.
export default function App() {
  return (
    <Routes>
      <Route element={<LayoutPrincipal />}>
        <Route index element={<Inicio />} />
        {TODAS_LAS_OPCIONES.filter((op) => op.ruta !== '/').map((op) => (
          <Route key={op.ruta} path={op.ruta} element={<PantallaPendiente opcion={op} />} />
        ))}
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
