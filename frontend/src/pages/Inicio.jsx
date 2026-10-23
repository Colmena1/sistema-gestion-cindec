import { useEffect, useState } from 'react'
import { BellRing, CircleCheck, CircleAlert, LoaderCircle } from 'lucide-react'
import cliente from '../api/cliente.js'
import Aviso from '../components/Aviso.jsx'
import { ROLES } from '../config/menu.js'
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

      {[ROLES.ADMIN, ROLES.COORDINADOR].includes(usuario.rol) && <Recordatorios />}
    </>
  )
}

// RF-NOT-01: el sistema revisa solo cada hora; aquí la coordinación puede lanzar la revisión en el momento.
function Recordatorios() {
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  const enviar = async () => {
    setEnviando(true)
    setError('')
    setResultado(null)
    try {
      const { data } = await cliente.post('/notificaciones/recordatorios', null, { timeout: 120000 })
      setResultado(data.resultado)
    } catch (err) {
      setError(err.mensaje)
    } finally {
      setEnviando(false)
    }
  }

  const s = resultado?.sesiones
  const e = resultado?.evaluaciones
  return (
    <section className="tarjeta" style={{ marginTop: 'var(--esp-6)' }}>
      <h2 className="subtitulo fila-icono"><BellRing size={22} /> Recordatorios por correo</h2>
      <p className="auxiliar">
        Cada hora (de 8:00 a 21:00) el sistema avisa a los inscritos e instructores de las sesiones del día siguiente y envía a cada
        evaluador la lista de evaluaciones que tiene pendientes. Un recordatorio ya enviado no se repite.
      </p>
      <button className="boton boton--secundario" onClick={enviar} disabled={enviando}>
        {enviando ? <><LoaderCircle size={18} className="girando" /> Revisando y enviando…</> : <><BellRing size={18} /> Enviar recordatorios ahora</>}
      </button>
      {error && <div style={{ marginTop: 16 }}><Aviso tipo="error" titulo="No se pudieron enviar" onCerrar={() => setError('')}>{error}</Aviso></div>}
      {resultado && (
        <div style={{ marginTop: 16 }}>
          <Aviso tipo={s.fallidos || e.fallidos ? 'error' : 'exito'} titulo="Revisión terminada" onCerrar={() => setResultado(null)}>
            Sesiones de mañana: {s.sesiones} con {s.correos} correo(s) enviados{s.omitidas ? ` (${s.omitidas} ya se habían avisado)` : ''}.
            Evaluaciones pendientes: {e.correos} evaluador(es) avisados{e.omitidos ? ` (${e.omitidos} ya avisados hoy)` : ''}.
            {(s.fallidos || e.fallidos) ? ` ${s.fallidos + e.fallidos} correo(s) no se pudieron enviar; revise la terminal del backend.` : ''}
          </Aviso>
        </div>
      )}
    </section>
  )
}
