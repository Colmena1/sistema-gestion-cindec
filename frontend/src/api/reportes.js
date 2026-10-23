import cliente from './cliente.js'

// Descarga un reporte exportado (PDF o Excel) con el nombre que propone el servidor.
export async function descargarReporte(clave, formato, params) {
  const { data, headers } = await cliente.get(`/reportes/${clave}/${formato}`, { params, responseType: 'blob', timeout: 60000 })
  const disposicion = headers['content-disposition'] || ''
  const nombre = decodeURIComponent((disposicion.match(/filename\*=UTF-8''([^;]+)/) || [])[1] || '') ||
    `reporte.${formato === 'pdf' ? 'pdf' : 'xlsx'}`
  const url = URL.createObjectURL(data)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
