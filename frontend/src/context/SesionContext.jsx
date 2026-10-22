import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import cliente from '../api/cliente.js'

// Guarda quién tiene la sesión abierta y lo comparte con todas las pantallas.
// El token JWT se guarda en el navegador para no pedir la contraseña en cada recarga;
// al abrir la aplicación se valida contra GET /auth/yo.
const SesionContext = createContext(null)

const leerToken = () => { try { return localStorage.getItem('token') } catch { return null } }
const guardarToken = (t) => { try { localStorage.setItem('token', t) } catch { /* sin almacenamiento */ } }
const borrarToken = () => { try { localStorage.removeItem('token') } catch { /* sin almacenamiento */ } }

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(() => Boolean(leerToken()))

  // Al abrir o recargar la página: si hay token, preguntar a la API quién es.
  useEffect(() => {
    if (!leerToken()) return
    cliente.get('/auth/yo')
      .then(({ data }) => setUsuario(data.usuario))
      .catch(() => borrarToken())
      .finally(() => setCargando(false))
  }, [])

  const iniciarSesion = useCallback(async (correo, contrasena) => {
    const { data } = await cliente.post('/auth/login', { correo, contrasena })
    guardarToken(data.token)
    setUsuario(data.usuario)
    return data.usuario
  }, [])

  const cerrarSesion = useCallback(() => {
    borrarToken()
    setUsuario(null)
  }, [])

  return (
    <SesionContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </SesionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSesion = () => useContext(SesionContext)
