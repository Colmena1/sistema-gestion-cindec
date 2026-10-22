import axios from 'axios'

// Cliente HTTP central (Diseño, cap. 2): todas las pantallas piden datos a la API por aquí.
// - Usa siempre la ruta base /api/v1.
// - Adjunta el token JWT si hay sesión.
// - Si la sesión expiró (401), borra el token y regresa al inicio de sesión.
const cliente = axios.create({ baseURL: '/api/v1', timeout: 15000 })

cliente.interceptors.request.use((config) => {
  let token = null
  try { token = localStorage.getItem('token') } catch { /* sin almacenamiento disponible */ }
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

cliente.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    // 401 en cualquier petición (menos el propio login) = la sesión ya no es válida.
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      try { localStorage.removeItem('token') } catch { /* nada que borrar */ }
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
    // Mensaje claro para mostrar en pantalla (la API ya responde { ok, mensaje }).
    error.mensaje = error.response?.data?.mensaje
      || 'No se pudo conectar con el servidor. Revise que el backend esté encendido.'
    return Promise.reject(error)
  },
)

export default cliente
