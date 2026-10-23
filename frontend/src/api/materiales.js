import cliente from './cliente.js'

// Descarga un material protegido (con token) y lo guarda con su nombre.
// Si quien descarga es participante, el servidor registra la consulta (RF-APR-03).
export async function descargarMaterial(id, titulo) {
  const { data, headers } = await cliente.get(`/materiales/${id}/archivo`, { responseType: 'blob' })
  const disposicion = headers['content-disposition'] || ''
  const nombre = decodeURIComponent((disposicion.match(/filename\*=UTF-8''([^;]+)/) || [])[1] || '') ||
    (disposicion.match(/filename="?([^";]+)"?/) || [])[1] || titulo
  const url = URL.createObjectURL(data)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// Abre un video externo. La pestaña se abre antes de la petición para que el navegador no la bloquee.
export async function abrirVideo(id) {
  const ventana = window.open('', '_blank')
  try {
    const { data } = await cliente.post(`/materiales/${id}/video`)
    if (ventana) ventana.location.href = data.url
    else window.location.href = data.url
  } catch (err) {
    if (ventana) ventana.close()
    throw err
  }
}

export const tamanoLegible = (bytes) => {
  if (bytes === null || bytes === undefined) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
