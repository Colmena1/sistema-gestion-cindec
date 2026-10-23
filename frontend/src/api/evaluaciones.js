import cliente from './cliente.js'

// Descarga una evidencia protegida (con token) y la guarda con su nombre original.
export async function descargarEvidencia(id, nombre) {
  const { data } = await cliente.get(`/evidencias/${id}/archivo`, { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
