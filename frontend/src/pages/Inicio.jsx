import { useEffect, useState } from 'react'
import { CircleCheck, CircleAlert, LoaderCircle } from 'lucide-react'
import cliente from '../api/cliente.js'
import { useSesion } from '../context/SesionContext.jsx'

const saludoPorHora = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

// Fecha en español: "jueves 22 de octubre de 2026"
const fechaLarga = () =>
  new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// P-04 Panel de inicio. Por ahora solo muestra el saludo y el estado de la conexión
// con la API; los resúmenes por rol se agregan conforme existan sus módulos.
export default function Inicio() {
  const { usuario } = useSesion()
  const [estado, setEstado] = useState({ cargando: true })

  useEffect(() => {
    cliente.get('/health')
      .then(({ data }) => setEstado({ ok: true, datos: data }))
      .catch((err) => setEstado({ ok: false, mensaje: err.mensaje }))
  }, [])

  return (
    <>
      <h1 className="saludo">{saludoPorHora()}, {usuario.nombre}</h1>
      <p className="auxiliar primera-mayuscula">{fechaLarga()}</p>

      <section className="tarjeta" style={{ marginTop: 'var(--esp-6)' }}>
        <h2 className="subtitulo">Estado del sistema</h2>
        {estado.cargando && (
          <p className="fila-icono"><LoaderCircle size={20} className="girando" /> Comprobando la conexión con el servidor…</p>
        )}
        {estado.ok === true && (
          <div className="aviso aviso--exito">
            <CircleCheck size={22} />
            <div>
              <strong>Conectado con el servidor y la base de datos</strong>
              <p>La API respondió correctamente y la base de datos {estado.datos.baseDeDatos === 'conectada' ? 'cindec_db está disponible' : 'no respondió'}.</p>
            </div>
          </div>
        )}
        {estado.ok === false && (
          <div className="aviso aviso--error">
            <CircleAlert size={22} />
            <div>
              <strong>No hay conexión con el servidor</strong>
              <p>{estado.mensaje}</p>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
