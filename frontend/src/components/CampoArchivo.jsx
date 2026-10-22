import { useRef } from 'react'
import { FileCheck2, Upload, X } from 'lucide-react'

const tamano = (bytes) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

// Campo para elegir un archivo: muestra el nombre y el tamaño, y permite quitarlo.
export default function CampoArchivo({ id, etiqueta, ayuda, error, archivo, onCambio, aceptar = '.pdf,.jpg,.jpeg,.png', opcional }) {
  const entrada = useRef(null)
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}{opcional && <span className="auxiliar"> · Opcional</span>}</label>
      <input ref={entrada} id={id} type="file" accept={aceptar} className="solo-lector"
        onChange={(e) => { onCambio(e.target.files[0] || null); e.target.value = '' }} />
      {archivo ? (
        <div className={`archivo-elegido ${error ? 'archivo-elegido--error' : ''}`}>
          <FileCheck2 size={20} />
          <span className="archivo-elegido__nombre">{archivo.name}</span>
          <span className="auxiliar">{tamano(archivo.size)}</span>
          <button type="button" className="boton-icono" onClick={() => onCambio(null)} aria-label={`Quitar ${archivo.name}`}><X size={18} /></button>
        </div>
      ) : (
        <button type="button" className={`zona-archivo ${error ? 'zona-archivo--error' : ''}`} onClick={() => entrada.current?.click()}>
          <Upload size={20} /> Elegir archivo
        </button>
      )}
      {error ? <p className="campo__error">{error}</p> : ayuda && <p className="auxiliar">{ayuda}</p>}
    </div>
  )
}
