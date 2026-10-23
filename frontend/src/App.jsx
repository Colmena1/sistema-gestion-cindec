import { Routes, Route } from 'react-router-dom'
import LayoutPrincipal from './layouts/LayoutPrincipal.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import Login from './pages/Login.jsx'
import RecuperarContrasena from './pages/RecuperarContrasena.jsx'
import RestablecerContrasena from './pages/RestablecerContrasena.jsx'
import Inicio from './pages/Inicio.jsx'
import Usuarios from './pages/Usuarios.jsx'
import CursosEstandares from './pages/CursosEstandares.jsx'
import Grupos from './pages/Grupos.jsx'
import GrupoDetalle from './pages/GrupoDetalle.jsx'
import Participantes from './pages/Participantes.jsx'
import ParticipanteExpediente from './pages/ParticipanteExpediente.jsx'
import Autorregistro from './pages/Autorregistro.jsx'
import Asistencia from './pages/Asistencia.jsx'
import MisGrupos from './pages/MisGrupos.jsx'
import MisCursos from './pages/MisCursos.jsx'
import Materiales from './pages/Materiales.jsx'
import Instrumentos from './pages/Instrumentos.jsx'
import PorEvaluar from './pages/PorEvaluar.jsx'
import IntentoEvaluacion from './pages/IntentoEvaluacion.jsx'
import PantallaPendiente from './pages/PantallaPendiente.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'
import { ROLES, TODAS_LAS_OPCIONES, rolesDeRuta } from './config/menu.js'

// Mapa de rutas de la aplicación.
// - /login, /recuperar, /restablecer y /registro (autorregistro) son públicas.
// - Todo lo demás requiere sesión, y cada pantalla solo la abren los roles que la tienen en su menú.
// Las pantallas que todavía no se construyen muestran en qué sprint se hacen.
// Rutas que ya tienen su pantalla real (las demás muestran "se construye en el Sprint N").
const PANTALLAS_LISTAS = ['/', '/usuarios', '/cursos', '/grupos', '/participantes', '/mis-grupos', '/mis-cursos', '/materiales', '/instrumentos', '/por-evaluar']

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<RecuperarContrasena />} />
      <Route path="/restablecer" element={<RestablecerContrasena />} />
      <Route path="/registro" element={<Autorregistro />} />

      <Route element={<RutaProtegida><LayoutPrincipal /></RutaProtegida>}>
        <Route index element={<Inicio />} />
        <Route path="/usuarios" element={<RutaProtegida roles={rolesDeRuta('/usuarios')}><Usuarios /></RutaProtegida>} />
        <Route path="/cursos" element={<RutaProtegida roles={rolesDeRuta('/cursos')}><CursosEstandares /></RutaProtegida>} />
        <Route path="/grupos" element={<RutaProtegida roles={rolesDeRuta('/grupos')}><Grupos /></RutaProtegida>} />
        <Route path="/grupos/:id" element={<RutaProtegida roles={rolesDeRuta('/grupos')}><GrupoDetalle /></RutaProtegida>} />
        <Route path="/participantes" element={<RutaProtegida roles={rolesDeRuta('/participantes')}><Participantes /></RutaProtegida>} />
        <Route path="/participantes/:id" element={<RutaProtegida roles={rolesDeRuta('/participantes')}><ParticipanteExpediente /></RutaProtegida>} />
        <Route path="/asistencia/:idSesion" element={<RutaProtegida roles={[ROLES.ADMIN, ROLES.COORDINADOR, ROLES.INSTRUCTOR]}><Asistencia /></RutaProtegida>} />
        <Route path="/mis-grupos" element={<RutaProtegida roles={rolesDeRuta('/mis-grupos')}><MisGrupos /></RutaProtegida>} />
        <Route path="/mis-cursos" element={<RutaProtegida roles={rolesDeRuta('/mis-cursos')}><MisCursos /></RutaProtegida>} />
        <Route path="/materiales" element={<RutaProtegida roles={[ROLES.ADMIN, ROLES.COORDINADOR, ROLES.INSTRUCTOR, ROLES.PARTICIPANTE]}><Materiales /></RutaProtegida>} />
        <Route path="/instrumentos" element={<RutaProtegida roles={rolesDeRuta('/instrumentos')}><Instrumentos /></RutaProtegida>} />
        <Route path="/por-evaluar" element={<RutaProtegida roles={rolesDeRuta('/por-evaluar')}><PorEvaluar /></RutaProtegida>} />
        <Route path="/por-evaluar/intento/:id" element={<RutaProtegida roles={[ROLES.ADMIN, ROLES.COORDINADOR, ROLES.EVALUADOR]}><IntentoEvaluacion /></RutaProtegida>} />
        {TODAS_LAS_OPCIONES.filter((op) => !PANTALLAS_LISTAS.includes(op.ruta)).map((op) => (
          <Route key={op.ruta} path={op.ruta}
            element={<RutaProtegida roles={rolesDeRuta(op.ruta)}><PantallaPendiente opcion={op} /></RutaProtegida>} />
        ))}
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
