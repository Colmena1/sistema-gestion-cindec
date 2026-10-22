import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import cliente from '../api/cliente.js'
import Modal from './Modal.jsx'
import Campo from './Campo.jsx'
import Aviso from './Aviso.jsx'
import { erroresPorCampo } from '../utils/formato.js'

// Ventana para crear o editar un grupo (CU-05). La usan la lista de grupos y el detalle.
// grupo: null para crear; el detalle del grupo para editar.
export default function FormularioGrupo({ grupo, cursos, personal, onCerrar, onGuardado }) {
  const esAlta = !grupo
  const [v, setV] = useState(() => ({
    idCurso: grupo ? String(grupo.idCurso) : '',
    clave: grupo?.clave || '',
    fechaInicio: grupo?.fechaInicio || '',
    fechaFin: grupo?.fechaFin || '',
    cupo: grupo ? String(grupo.cupo) : '',
    modalidad: grupo?.modalidad || 'presencial',
    enlaceVideoconferencia: grupo?.enlaceVideoconferencia || '',
    idInstructor: grupo?.instructor ? String(grupo.instructor.id) : '',
    idEvaluador: grupo?.evaluador ? String(grupo.evaluador.id) : '',
  }))
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const cambiar = (campo) => (e) => setV((x) => ({ ...x, [campo]: e.target.value }))
  const cursosActivos = cursos.filter((c) => c.activo)

  const validar = () => {
    const e = {}
    if (esAlta && !v.idCurso) e.idCurso = 'Seleccione el curso.'
    if (!v.fechaInicio) e.fechaInicio = 'Indique la fecha de inicio.'
    if (!v.fechaFin) e.fechaFin = 'Indique la fecha de fin.'
    else if (v.fechaInicio && v.fechaFin < v.fechaInicio) e.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio.'
    const cupo = Number(v.cupo)
    if (!Number.isInteger(cupo) || cupo < 1 || cupo > 500) e.cupo = 'Escriba un número entre 1 y 500.'
    if (v.modalidad !== 'presencial' && !/^https?:\/\/\S+$/.test(v.enlaceVideoconferencia.trim())) {
      e.enlaceVideoconferencia = 'Para un grupo en línea o mixto escriba el enlace completo, empezando con https://'
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    setErrorServidor('')
    if (!validar()) return
    setGuardando(true)
    const cuerpo = {
      clave: v.clave.trim(),
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      cupo: Number(v.cupo),
      modalidad: v.modalidad,
      enlaceVideoconferencia: v.modalidad === 'presencial' ? '' : v.enlaceVideoconferencia.trim(),
      idInstructor: v.idInstructor ? Number(v.idInstructor) : null,
      idEvaluador: v.idEvaluador ? Number(v.idEvaluador) : null,
    }
    if (esAlta) cuerpo.idCurso = Number(v.idCurso)
    try {
      const { data } = esAlta ? await cliente.post('/grupos', cuerpo) : await cliente.put(`/grupos/${grupo.id}`, cuerpo)
      onGuardado(data.mensaje, data.grupo)
    } catch (err) {
      setErrores(erroresPorCampo(err))
      setErrorServidor(err.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={esAlta ? 'Crear grupo' : `Editar grupo ${grupo.clave}`} onCerrar={onCerrar} pie={<>
      <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button type="submit" form="form-grupo" className="boton boton--principal" disabled={guardando}>
        {guardando ? <><LoaderCircle size={18} className="girando" /> Guardando…</> : esAlta ? 'Crear grupo' : 'Guardar cambios'}
      </button>
    </>}>
      <form id="form-grupo" onSubmit={guardar} noValidate>
        {errorServidor && <Aviso tipo="error" titulo="No se pudo guardar">{errorServidor}</Aviso>}

        {esAlta ? (
          <Campo id="idCurso" etiqueta="Curso" error={errores.idCurso}>
            <select id="idCurso" value={v.idCurso} onChange={cambiar('idCurso')} aria-invalid={Boolean(errores.idCurso)} autoFocus>
              <option value="">Seleccione un curso</option>
              {cursosActivos.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.estandar?.codigo})</option>)}
            </select>
          </Campo>
        ) : (
          <Campo id="curso" etiqueta="Curso"><input id="curso" value={`${grupo.curso?.nombre} (${grupo.curso?.estandar})`} disabled /></Campo>
        )}

        <Campo id="clave" etiqueta={esAlta ? 'Clave del grupo (opcional)' : 'Clave del grupo'} error={errores.clave}
          ayuda={esAlta ? 'Si la deja vacía se genera sola, por ejemplo EC0301-2026-01.' : undefined}>
          <input id="clave" maxLength={20} value={v.clave} onChange={cambiar('clave')} />
        </Campo>

        <div className="dos-columnas">
          <Campo id="fechaInicio" etiqueta="Fecha de inicio" error={errores.fechaInicio}>
            <input id="fechaInicio" type="date" value={v.fechaInicio} onChange={cambiar('fechaInicio')} aria-invalid={Boolean(errores.fechaInicio)} />
          </Campo>
          <Campo id="fechaFin" etiqueta="Fecha de fin" error={errores.fechaFin}>
            <input id="fechaFin" type="date" min={v.fechaInicio || undefined} value={v.fechaFin} onChange={cambiar('fechaFin')} aria-invalid={Boolean(errores.fechaFin)} />
          </Campo>
          <Campo id="cupo" etiqueta="Cupo (lugares)" error={errores.cupo}>
            <input id="cupo" type="number" min={1} max={500} value={v.cupo} onChange={cambiar('cupo')} aria-invalid={Boolean(errores.cupo)} />
          </Campo>
          <Campo id="modalidad" etiqueta="Modalidad" error={errores.modalidad}>
            <select id="modalidad" value={v.modalidad} onChange={cambiar('modalidad')}>
              <option value="presencial">Presencial</option>
              <option value="en_linea">En línea</option>
              <option value="mixta">Mixta</option>
            </select>
          </Campo>
        </div>

        {v.modalidad !== 'presencial' && (
          <Campo id="enlace" etiqueta="Enlace de la videoconferencia" error={errores.enlaceVideoconferencia}>
            <input id="enlace" type="url" placeholder="https://meet.google.com/..." value={v.enlaceVideoconferencia}
              onChange={cambiar('enlaceVideoconferencia')} aria-invalid={Boolean(errores.enlaceVideoconferencia)} />
          </Campo>
        )}

        <div className="dos-columnas">
          <Campo id="idInstructor" etiqueta="Instructor" error={errores.idInstructor}
            ayuda={personal.instructores.length === 0 ? 'No hay instructores activos. Regístrelos en Usuarios.' : 'Puede asignarlo después.'}>
            <select id="idInstructor" value={v.idInstructor} onChange={cambiar('idInstructor')}>
              <option value="">Sin asignar</option>
              {personal.instructores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </Campo>
          <Campo id="idEvaluador" etiqueta="Evaluador" error={errores.idEvaluador}
            ayuda={personal.evaluadores.length === 0 ? 'No hay evaluadores activos. Regístrelos en Usuarios.' : 'Puede asignarlo después.'}>
            <select id="idEvaluador" value={v.idEvaluador} onChange={cambiar('idEvaluador')}>
              <option value="">Sin asignar</option>
              {personal.evaluadores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </Campo>
        </div>
      </form>
    </Modal>
  )
}
