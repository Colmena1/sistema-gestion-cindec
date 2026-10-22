import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, Layers, LoaderCircle, Users, Video } from 'lucide-react'
import cliente from '../api/cliente.js'
import Aviso from '../components/Aviso.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import { ESTATUS_GRUPO, MODALIDAD, fecha, fechaConDia } from '../utils/formato.js'

// P-16 Mis grupos (Instructor; CU-09, RF-CUR-07): los grupos que tiene asignados,
// sus sesiones y el acceso a tomar asistencia.
const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function MisGrupos() {
  const [grupos, setGrupos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    cliente.get('/mis-grupos').then(({ data }) => setGrupos(data.grupos)).catch((err) => setError(err.mensaje))
  }, [])

  return (
    <>
      <h1 className="titulo-pantalla fila-icono"><Layers size={26} strokeWidth={1.75} /> Mis grupos</h1>
      {error && <Aviso tipo="error" titulo="No se pudieron cargar sus grupos">{error}</Aviso>}
      {!grupos && !error && <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando…</p>}
      {grupos && grupos.length === 0 && (
        <div className="tarjeta estado-vacio">
          <p className="subtitulo">Todavía no tiene grupos asignados</p>
          <p className="auxiliar">Cuando la coordinación lo asigne como instructor de un grupo, aparecerá aquí.</p>
        </div>
      )}
      <div className="tarjetas">
        {grupos?.map((g) => (
          <article key={g.id} className="tarjeta tarjeta-curso">
            <header className="tarjeta-curso__cabecera">
              <div>
                <h2 className="subtitulo">{g.curso}</h2>
                <p className="auxiliar">{g.clave} · {g.estandar}</p>
              </div>
              <EtiquetaEstatus tono={ESTATUS_GRUPO[g.estatus].tono}>{ESTATUS_GRUPO[g.estatus].texto}</EtiquetaEstatus>
            </header>
            <p className="fila-icono auxiliar">{fecha(g.fechaInicio)} al {fecha(g.fechaFin)} · {MODALIDAD[g.modalidad]} · <Users size={16} /> {g.inscritos} inscritos</p>
            {g.enlaceVideoconferencia && g.estatus !== 'concluido' && (
              <a href={g.enlaceVideoconferencia} target="_blank" rel="noreferrer" className="enlace-volver"><Video size={16} /> Enlace de la videoconferencia</a>
            )}
            {g.sesiones.length === 0 ? <p className="auxiliar">Sin sesiones programadas.</p> : (
              <ul className="lista-sesiones">
                {g.sesiones.map((s) => {
                  const puede = g.estatus === 'en_curso' && s.fecha <= hoy()
                  return (
                    <li key={s.id}>
                      <span><strong>Sesión {s.numero}</strong> · {fechaConDia(s.fecha)} · {s.horaInicio} a {s.horaFin}{s.tema && <span className="auxiliar bloque">{s.tema}</span>}</span>
                      {puede
                        ? <Link to={`/asistencia/${s.id}`} className="boton boton--secundario boton--chico"><ClipboardCheck size={16} /> Asistencia</Link>
                        : g.estatus !== 'planeado' && <Link to={`/asistencia/${s.id}`} className="enlace-tabla auxiliar">Ver</Link>}
                    </li>
                  )
                })}
              </ul>
            )}
          </article>
        ))}
      </div>
    </>
  )
}
