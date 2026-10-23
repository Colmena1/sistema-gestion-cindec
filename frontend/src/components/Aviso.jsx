import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

// Aviso: título de lo que pasó + frase de qué hacer (guía de estilo, sección 6).
const ICONOS = { exito: CircleCheck, error: CircleAlert, info: Info }

export default function Aviso({ tipo = 'info', titulo, children, flotante = false, onCerrar }) {
  const Icono = ICONOS[tipo] || Info
  return (
    <div className={`aviso aviso--${tipo} ${flotante ? 'aviso--flotante' : ''}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono size={22} />
      <div className="aviso__texto">
        {titulo && <strong>{titulo}</strong>}
        {children && <p>{children}</p>}
      </div>
      {onCerrar && <button className="boton-icono aviso__cerrar" onClick={onCerrar} aria-label="Cerrar aviso"><X size={18} /></button>}
    </div>
  )
}
