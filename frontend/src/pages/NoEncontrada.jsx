import { Link } from 'react-router-dom'

export default function NoEncontrada() {
  return (
    <div className="tarjeta estado-vacio">
      <p className="subtitulo">No encontramos esta página</p>
      <p className="auxiliar">Revise la dirección o regrese al inicio.</p>
      <Link to="/" className="boton boton--principal">Ir al inicio</Link>
    </div>
  )
}
