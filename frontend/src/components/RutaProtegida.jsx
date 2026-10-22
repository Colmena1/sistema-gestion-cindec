import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoaderCircle, Lock } from 'lucide-react'
import { useSesion } from '../context/SesionContext.jsx'

// Envuelve las pantallas que requieren sesión (RF-USR-03, RNF-13).
// - Sin sesión: manda al inicio de sesión y recuerda a dónde quería ir.
// - Con sesión pero sin permiso (roles): muestra un aviso en lugar de la pantalla.
// Importante: esto solo organiza la interfaz; la seguridad real la aplica el backend.
export default function RutaProtegida({ roles, children }) {
  const { usuario, cargando } = useSesion()
  const ubicacion = useLocation()

  if (cargando) {
    return (
      <div className="pantalla-centrada fila-icono auxiliar">
        <LoaderCircle size={22} className="girando" /> Cargando…
      </div>
    )
  }
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />

  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="tarjeta estado-vacio">
        <Lock size={40} strokeWidth={1.5} />
        <p className="subtitulo">No tiene permiso para ver esta pantalla</p>
        <p className="auxiliar">Use las opciones de su menú. Si cree que es un error, comuníquese con la administración.</p>
      </div>
    )
  }
  return children ?? <Outlet />
}
