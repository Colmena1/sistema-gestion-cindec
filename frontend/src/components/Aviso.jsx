import { CircleAlert, CircleCheck, Info } from 'lucide-react'

// Aviso: título de lo que pasó + frase de qué hacer (guía de estilo, sección 6).
const ICONOS = { exito: CircleCheck, error: CircleAlert, info: Info }

export default function Aviso({ tipo = 'info', titulo, children, flotante = false }) {
  const Icono = ICONOS[tipo] || Info
  return (
    <div className={`aviso aviso--${tipo} ${flotante ? 'aviso--flotante' : ''}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono size={22} />
      <div>
        {titulo && <strong>{titulo}</strong>}
        {children && <p>{children}</p>}
      </div>
    </div>
  )
}
