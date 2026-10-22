import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import Modal from './Modal.jsx'
import Aviso from './Aviso.jsx'

// Ventana de confirmación para acciones como activar o desactivar.
// "accion" es una función async; si falla, el error se muestra dentro de la ventana.
export default function Confirmacion({ titulo, textoBoton, peligro = false, accion, onCerrar, onHecho, children }) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const confirmar = async () => {
    setEnviando(true)
    setError('')
    try {
      const mensaje = await accion()
      onHecho(mensaje)
    } catch (err) {
      setError(err.mensaje || 'No se pudo completar la operación.')
      setEnviando(false)
    }
  }

  return (
    <Modal titulo={titulo} onCerrar={onCerrar} pie={<>
      <button className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button className={`boton ${peligro ? 'boton--peligro' : 'boton--principal'}`} onClick={confirmar} disabled={enviando}>
        {enviando ? <><LoaderCircle size={18} className="girando" /> Procesando…</> : textoBoton}
      </button>
    </>}>
      {error && <Aviso tipo="error" titulo="No se pudo completar">{error}</Aviso>}
      <p>{children}</p>
    </Modal>
  )
}
