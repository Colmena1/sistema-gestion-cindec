import { Construction } from 'lucide-react'

// Estado vacío temporal para las pantallas que aún no se construyen.
export default function PantallaPendiente({ opcion }) {
  const Icono = opcion.icono
  return (
    <>
      <h1 className="titulo-pantalla fila-icono"><Icono size={26} strokeWidth={1.75} /> {opcion.texto}</h1>
      <div className="tarjeta estado-vacio">
        <Construction size={40} strokeWidth={1.5} />
        <p className="subtitulo">Esta pantalla se construye en el Sprint {opcion.sprint}</p>
        <p className="auxiliar">Pantalla {opcion.pantalla} del inventario de prototipos.</p>
      </div>
    </>
  )
}
