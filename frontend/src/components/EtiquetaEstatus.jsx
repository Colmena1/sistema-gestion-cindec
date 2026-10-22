// Etiqueta de estatus: color + texto, nunca solo color (guía de estilo, sección 6).
// tono: 'exito' | 'alerta' | 'error' | 'info' | 'neutro'
export default function EtiquetaEstatus({ tono = 'neutro', children }) {
  return <span className={`etiqueta etiqueta--${tono}`}>{children}</span>
}
