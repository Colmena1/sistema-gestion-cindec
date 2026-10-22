import { useEffect, useState } from 'react'
import { BookOpen, CalendarDays, LoaderCircle, UserRound, Video } from 'lucide-react'
import cliente from '../api/cliente.js'
import Aviso from '../components/Aviso.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import { ESTATUS_GRUPO, ESTATUS_INSCRIPCION, MODALIDAD, fecha, fechaConDia } from '../utils/formato.js'

// P-21 Mis cursos (Participante; CU-13 parcial, RF-CUR-06): grupos en los que está inscrito,
// con sus sesiones, el enlace de la videoconferencia y su asistencia.
export default function MisCursos() {
  const [cursos, setCursos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    cliente.get('/mis-cursos').then(({ data }) => setCursos(data.cursos)).catch((err) => setError(err.mensaje))
  }, [])

  return (
    <>
      <h1 className="titulo-pantalla fila-icono"><BookOpen size={26} strokeWidth={1.75} /> Mis cursos</h1>
      {error && <Aviso tipo="error" titulo="No se pudieron cargar sus cursos">{error}</Aviso>}
      {!cursos && !error && <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando…</p>}
      {cursos && cursos.length === 0 && (
        <div className="tarjeta estado-vacio">
          <p className="subtitulo">Todavía no está inscrito en ningún curso</p>
          <p className="auxiliar">Cuando la coordinación de CINDEC lo inscriba en un grupo, aquí verá sus fechas, sesiones y materiales.</p>
        </div>
      )}
      <div className="tarjetas">
        {cursos?.map((c) => (
          <article key={c.idInscripcion} className="tarjeta tarjeta-curso">
            <header className="tarjeta-curso__cabecera">
              <div>
                <h2 className="subtitulo">{c.curso}</h2>
                <p className="auxiliar">{c.estandar} · {c.nombreEstandar}</p>
              </div>
              <div className="etiquetas">
                <EtiquetaEstatus tono={ESTATUS_INSCRIPCION[c.estatus].tono}>{ESTATUS_INSCRIPCION[c.estatus].texto}</EtiquetaEstatus>
                {c.estatus !== 'baja' && <EtiquetaEstatus tono={ESTATUS_GRUPO[c.estatusGrupo].tono}>Grupo {ESTATUS_GRUPO[c.estatusGrupo].texto.toLowerCase()}</EtiquetaEstatus>}
              </div>
            </header>
            <p className="fila-icono auxiliar"><CalendarDays size={16} /> {fecha(c.fechaInicio)} al {fecha(c.fechaFin)} · {MODALIDAD[c.modalidad]} · Grupo {c.clave}</p>
            {c.instructor && <p className="fila-icono auxiliar"><UserRound size={16} /> Instructor: {c.instructor}</p>}
            {c.enlaceVideoconferencia && (
              <a href={c.enlaceVideoconferencia} target="_blank" rel="noreferrer" className="boton boton--principal boton--chico enlace-video"><Video size={16} /> Entrar a la videoconferencia</a>
            )}
            {c.asistencias.registradas > 0 && (
              <p className="auxiliar">Asistencia: {c.asistencias.presentes} de {c.asistencias.registradas} sesiones registradas</p>
            )}
            {c.sesiones.length > 0 && c.estatus !== 'baja' && (
              <ul className="lista-sesiones">
                {c.sesiones.map((s) => (
                  <li key={s.id}>
                    <span><strong>Sesión {s.numero}</strong> · {fechaConDia(s.fecha)} · {s.horaInicio} a {s.horaFin}{s.tema && <span className="auxiliar bloque">{s.tema}</span>}</span>
                    {s.asistio === true && <EtiquetaEstatus tono="exito">Asistió</EtiquetaEstatus>}
                    {s.asistio === false && <EtiquetaEstatus tono="error">No asistió</EtiquetaEstatus>}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </>
  )
}
