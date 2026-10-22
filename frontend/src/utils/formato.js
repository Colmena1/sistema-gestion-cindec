// Formatos de presentación (guía de estilo, sección 7):
// fechas dd/mm/aaaa, horas de 24 h y valores de la base de datos en español natural.

// "2026-11-03" -> "03/11/2026" (sin convertir zona horaria: es una fecha, no un instante)
export const fecha = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—')

// "2026-11-03" -> "Mar 03/11/2026"
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const fechaConDia = (iso) => {
  if (!iso) return '—'
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${DIAS[new Date(a, m - 1, d).getDay()]} ${fecha(iso)}`
}

// Instante (DATETIME) -> "22/10/2026"
export const fechaDeInstante = (valor) => (valor ? new Date(valor).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—')

export const MODALIDAD = { presencial: 'Presencial', en_linea: 'En línea', mixta: 'Mixta' }

// Estatus con su color (guía de estilo, "Colores de estatus")
export const ESTATUS_GRUPO = {
  planeado: { texto: 'Planeado', tono: 'info' },
  en_curso: { texto: 'En curso', tono: 'exito' },
  concluido: { texto: 'Concluido', tono: 'neutro' },
  cancelado: { texto: 'Cancelado', tono: 'error' },
}
export const ESTATUS_INSCRIPCION = {
  inscrito: { texto: 'Inscrito', tono: 'info' },
  capacitacion_concluida: { texto: 'Capacitación concluida', tono: 'exito' },
  baja: { texto: 'Baja', tono: 'neutro' },
}

// Convierte los errores por campo que devuelve la API en { campo: mensaje }.
export function erroresPorCampo(err) {
  const detalles = err?.response?.data?.detalles
  const porCampo = {}
  if (Array.isArray(detalles)) detalles.forEach((d) => { if (d.campo) porCampo[d.campo] = d.mensaje })
  return porCampo
}
