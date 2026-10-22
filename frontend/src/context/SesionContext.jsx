import { createContext, useContext, useState } from 'react'

// Guarda quién está usando el sistema y lo comparte con todas las pantallas.
// TEMPORAL (Sprint 0): todavía no hay inicio de sesión, así que se usa un
// usuario de demostración y se puede cambiar de rol para ver cada menú.
// En el Sprint 1 este archivo recibirá el usuario real desde /api/v1/auth/login.
const SesionContext = createContext(null)

const USUARIO_DEMO = { nombre: 'Usuario', apellidos: 'de demostración', rol: 'Coordinador' }

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(USUARIO_DEMO)
  const cambiarRol = (rol) => setUsuario((u) => ({ ...u, rol }))
  return (
    <SesionContext.Provider value={{ usuario, cambiarRol, esDemo: true }}>
      {children}
    </SesionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSesion = () => useContext(SesionContext)
