import cliente from './cliente.js'

// Descarga el PDF oficial de CONOCER resguardado en el sistema (personal o el propio participante).
export async function descargarCertificado(idTramite) {
  const { data, headers } = await cliente.get(`/tramites/${idTramite}/documento/archivo`, { responseType: 'blob' })
  const disposicion = headers['content-disposition'] || ''
  const nombre = decodeURIComponent((disposicion.match(/filename\*=UTF-8''([^;]+)/) || [])[1] || '') ||
    (disposicion.match(/filename="?([^";]+)"?/) || [])[1] || 'certificado.pdf'
  const url = URL.createObjectURL(data)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
