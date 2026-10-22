import { useEffect } from 'react'
import { X } from 'lucide-react'

// Ventana emergente (guía de estilo: solo para acciones cortas o confirmaciones).
// Se cierra con la X, con la tecla Esc o al hacer clic fuera.
export default function Modal({ titulo, onCerrar, children, pie }) {
  useEffect(() => {
    const alPresionar = (e) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [onCerrar])

  return (
    <div className="modal__velo" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <div className="modal__cabecera">
          <h2 id="modal-titulo" className="subtitulo">{titulo}</h2>
          <button className="boton-icono" onClick={onCerrar} aria-label="Cerrar"><X size={20} /></button>
        </div>
        <div className="modal__cuerpo">{children}</div>
        {pie && <div className="modal__pie">{pie}</div>}
      </div>
    </div>
  )
}
