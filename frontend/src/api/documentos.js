import cliente from './cliente.js'

// Los documentos están protegidos: se piden a la API con el token y se abren en una pestaña nueva.
export async function abrirDocumento(idDocumento) {
  const ventana = window.open('', '_blank') // se abre antes para que el navegador no la bloquee
  try {
    const { data, headers } = await cliente.get(`/documentos-participante/${idDocumento}/archivo`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([data], { type: headers['content-type'] }))
    if (ventana) ventana.location.href = url
    else window.location.href = url
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    if (ventana) ventana.close()
    throw err
  }
}
