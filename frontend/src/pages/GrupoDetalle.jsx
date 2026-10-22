import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarPlus, FolderOpen, LoaderCircle, Pencil, Play, Search, Trash2, Video } from 'lucide-react'
import cliente from '../api/cliente.js'
import Aviso from '../components/Aviso.jsx'
import Campo from '../components/Campo.jsx'
import Modal from '../components/Modal.jsx'
import Confirmacion from '../components/Confirmacion.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import FormularioGrupo from '../components/FormularioGrupo.jsx'
import useAvisoTemporal from '../hooks/useAvisoTemporal.js'
import { ESTATUS_GRUPO, ESTATUS_INSCRIPCION, MODALIDAD, erroresPorCampo, fecha, fechaConDia, fechaDeInstante } from '../utils/formato.js'

// P-08 Detalle del grupo (CU-05; mockup M08): datos, avance de cupo, sesiones e inscritos.
// La inscripción de participantes (CU-07) se agrega en la parte 4 del Sprint 2.
const ACCIONES_ESTATUS = {
  en_curso: { texto: 'Iniciar grupo', titulo: 'Iniciar grupo', peligro: false, explicacion: 'El grupo pasará a "En curso". Se requiere instructor y al menos una sesión.' },
  concluido: { texto: 'Concluir grupo', titulo: 'Concluir grupo', peligro: false, explicacion: 'El grupo pasará a "Concluido" y ya no podrá modificarse.' },
  cancelado: { texto: 'Cancelar grupo', titulo: 'Cancelar grupo', peligro: true, explicacion: 'El grupo pasará a "Cancelado" y ya no podrá modificarse. Su información se conserva.' },
}

export default function GrupoDetalle() {
  const { id } = useParams()
  const ubicacion = useLocation()
  const [grupo, setGrupo] = useState(null)
  const [error, setError] = useState('')
  const [cursos, setCursos] = useState([])
  const [personal, setPersonal] = useState({ instructores: [], evaluadores: [] })
  const [aviso, mostrarAviso] = useAvisoTemporal()
  const [editando, setEditando] = useState(false)
  const [cambioEstatus, setCambioEstatus] = useState(null)
  const [sesionEnEdicion, setSesionEnEdicion] = useState(null)   // {} = nueva
  const [sesionAEliminar, setSesionAEliminar] = useState(null)
  const [buscarInscrito, setBuscarInscrito] = useState('')

  const cargar = useCallback(() => {
    cliente.get(`/grupos/${id}`)
      .then(({ data }) => { setGrupo(data.grupo); setError('') })
      .catch((err) => setError(err.mensaje))
  }, [id])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => {
    cliente.get('/cursos').then(({ data }) => setCursos(data.cursos)).catch(() => {})
    cliente.get('/grupos/personal').then(({ data }) => setPersonal(data)).catch(() => {})
  }, [])
  // Aviso que viene de la pantalla anterior ("Grupo creado.")
  useEffect(() => { if (ubicacion.state?.aviso) mostrarAviso(ubicacion.state.aviso) }, [ubicacion.state, mostrarAviso])

  const alGuardar = (mensaje) => {
    setEditando(false); setCambioEstatus(null); setSesionEnEdicion(null); setSesionAEliminar(null)
    mostrarAviso(mensaje)
    cargar()
  }

  if (error) {
    return (
      <>
        <Link to="/grupos" className="enlace-volver"><ArrowLeft size={18} /> Grupos</Link>
        <div style={{ marginTop: 16 }}><Aviso tipo="error" titulo="No se pudo abrir el grupo">{error}</Aviso></div>
      </>
    )
  }
  if (!grupo) return <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando grupo…</p>

  const editable = ['planeado', 'en_curso'].includes(grupo.estatus)
  const porcentaje = Math.min(100, Math.round((grupo.inscritos / grupo.cupo) * 100))
  const texto = buscarInscrito.trim().toLowerCase()
  const lista = grupo.inscritosLista.filter((i) => i.nombre.toLowerCase().includes(texto) || i.curp.toLowerCase().includes(texto))

  return (
    <>
      <Link to="/grupos" className="enlace-volver"><ArrowLeft size={18} /> Grupos</Link>

      <div className="encabezado-pantalla encabezado-pantalla--detalle">
        <div>
          <h1 className="titulo-pantalla fila-icono">
            {grupo.clave}
            <EtiquetaEstatus tono={ESTATUS_GRUPO[grupo.estatus].tono}>{ESTATUS_GRUPO[grupo.estatus].texto}</EtiquetaEstatus>
          </h1>
          <p className="auxiliar">{grupo.curso?.nombre} · {grupo.curso?.estandar} {grupo.curso?.nombreEstandar}</p>
        </div>
        {editable && (
          <div className="grupo-botones">
            {grupo.transicionesPermitidas.filter((e) => e !== 'en_curso').map((e) => (
              <button key={e} className="boton boton--secundario" onClick={() => setCambioEstatus(e)}>{ACCIONES_ESTATUS[e].texto}</button>
            ))}
            <button className="boton boton--secundario" onClick={() => setEditando(true)}><Pencil size={18} /> Editar grupo</button>
            {grupo.transicionesPermitidas.includes('en_curso') && (
              <button className="boton boton--principal" onClick={() => setCambioEstatus('en_curso')}><Play size={18} /> Iniciar grupo</button>
            )}
          </div>
        )}
      </div>

      {aviso && <Aviso tipo="exito" titulo={aviso} flotante />}

      {/* Datos principales */}
      <section className="tarjeta datos-grupo">
        <Dato etiqueta="Fechas" valor={`${fecha(grupo.fechaInicio)} al ${fecha(grupo.fechaFin)}`} />
        <Dato etiqueta="Modalidad" valor={MODALIDAD[grupo.modalidad]}>
          {grupo.enlaceVideoconferencia && (
            <a href={grupo.enlaceVideoconferencia} target="_blank" rel="noreferrer" className="enlace-volver"><Video size={16} /> Enlace de la videoconferencia</a>
          )}
        </Dato>
        <Dato etiqueta="Lugares" valor={`${grupo.inscritos} de ${grupo.cupo} ocupados`}>
          <div className="barra-progreso" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ width: `${porcentaje}%` }} />
          </div>
        </Dato>
        <Persona etiqueta="Instructor" persona={grupo.instructor} editable={editable} onAsignar={() => setEditando(true)} />
        <Persona etiqueta="Evaluador" persona={grupo.evaluador} editable={editable} onAsignar={() => setEditando(true)} />
      </section>

      {/* Sesiones */}
      <section className="tarjeta tarjeta--tabla seccion-detalle">
        <div className="seccion-detalle__cabecera">
          <h2 className="subtitulo">Sesiones ({grupo.sesiones.length})</h2>
          {editable && (
            <button className="boton boton--secundario" onClick={() => setSesionEnEdicion({})}><CalendarPlus size={18} /> Agregar sesión</button>
          )}
        </div>
        {grupo.sesiones.length === 0 ? (
          <div className="estado-vacio">
            <p className="subtitulo">Este grupo todavía no tiene sesiones</p>
            <p className="auxiliar">Agregue la fecha y el horario de cada sesión. Se necesitan para iniciar el grupo y para tomar asistencia.</p>
          </div>
        ) : (
          <table className="tabla">
            <thead><tr><th>Sesión</th><th>Fecha</th><th>Horario</th><th>Tema</th>{editable && <th className="tabla__acciones">Acciones</th>}</tr></thead>
            <tbody>
              {grupo.sesiones.map((s) => (
                <tr key={s.id}>
                  <td data-etiqueta="Sesión"><strong>{s.numero}</strong></td>
                  <td data-etiqueta="Fecha">{fechaConDia(s.fecha)}</td>
                  <td data-etiqueta="Horario">{s.horaInicio} a {s.horaFin}</td>
                  <td data-etiqueta="Tema">{s.tema || <span className="auxiliar">—</span>}</td>
                  {editable && (
                    <td className="tabla__acciones">
                      <button className="boton boton--secundario boton--chico boton--accion" title="Editar" aria-label={`Editar sesión ${s.numero}`} onClick={() => setSesionEnEdicion(s)}>
                        <Pencil size={16} /><span className="texto-boton">Editar</span>
                      </button>
                      <button className="boton boton--secundario boton--chico boton--accion" title="Eliminar" aria-label={`Eliminar sesión ${s.numero}`} onClick={() => setSesionAEliminar(s)}>
                        <Trash2 size={16} /><span className="texto-boton">Eliminar</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Inscritos */}
      <section className="tarjeta tarjeta--tabla seccion-detalle">
        <div className="seccion-detalle__cabecera">
          <h2 className="subtitulo">Inscritos ({grupo.inscritosLista.length})</h2>
          {grupo.inscritosLista.length > 0 && (
            <div className="campo__con-icono buscador-chico">
              <Search size={18} />
              <input aria-label="Buscar inscrito" placeholder="Buscar por nombre o CURP" value={buscarInscrito} onChange={(e) => setBuscarInscrito(e.target.value)} />
            </div>
          )}
        </div>
        {grupo.inscritosLista.length === 0 ? (
          <div className="estado-vacio">
            <p className="subtitulo">Todavía no hay participantes inscritos</p>
            <p className="auxiliar">La inscripción de participantes se habilita en la siguiente parte del sprint.</p>
          </div>
        ) : (
          <table className="tabla">
            <thead><tr><th>Participante</th><th>Empresa</th><th>Inscripción</th><th>Estatus</th><th className="tabla__acciones"><span className="solo-lector">Expediente</span></th></tr></thead>
            <tbody>
              {lista.map((i) => (
                <tr key={i.idInscripcion}>
                  <td data-etiqueta="Participante"><strong>{i.nombre}</strong><span className="auxiliar bloque">{i.curp}</span></td>
                  <td data-etiqueta="Empresa">{i.empresa || '—'}</td>
                  <td data-etiqueta="Inscripción">{fechaDeInstante(i.fechaInscripcion)}</td>
                  <td data-etiqueta="Estatus">
                    <EtiquetaEstatus tono={ESTATUS_INSCRIPCION[i.estatus].tono}>{ESTATUS_INSCRIPCION[i.estatus].texto}</EtiquetaEstatus>
                    {i.esRefuerzo && <span className="auxiliar bloque">Refuerzo</span>}
                  </td>
                  <td className="tabla__acciones">
                    <Link to={`/participantes/${i.idParticipante}`} className="boton boton--secundario boton--chico boton--accion" title="Ver expediente" aria-label={`Ver expediente de ${i.nombre}`}>
                      <FolderOpen size={16} /><span className="texto-boton">Ver expediente</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {editando && (
        <FormularioGrupo grupo={grupo} cursos={cursos} personal={personal} onCerrar={() => setEditando(false)} onGuardado={alGuardar} />
      )}

      {cambioEstatus && (
        <Confirmacion
          titulo={ACCIONES_ESTATUS[cambioEstatus].titulo}
          textoBoton={ACCIONES_ESTATUS[cambioEstatus].texto}
          peligro={ACCIONES_ESTATUS[cambioEstatus].peligro}
          accion={async () => (await cliente.patch(`/grupos/${grupo.id}/estatus`, { estatus: cambioEstatus })).data.mensaje}
          onCerrar={() => setCambioEstatus(null)}
          onHecho={alGuardar}
        >
          {ACCIONES_ESTATUS[cambioEstatus].explicacion}
        </Confirmacion>
      )}

      {sesionEnEdicion && (
        <FormularioSesion grupo={grupo} sesion={sesionEnEdicion} onCerrar={() => setSesionEnEdicion(null)} onGuardado={alGuardar} />
      )}

      {sesionAEliminar && (
        <Confirmacion titulo="Eliminar sesión" textoBoton="Eliminar sesión" peligro
          accion={async () => (await cliente.delete(`/sesiones/${sesionAEliminar.id}`)).data.mensaje}
          onCerrar={() => setSesionAEliminar(null)} onHecho={alGuardar}>
          ¿Eliminar la sesión {sesionAEliminar.numero} del {fechaConDia(sesionAEliminar.fecha)}? Si ya tiene asistencia registrada no se podrá eliminar.
        </Confirmacion>
      )}
    </>
  )
}

const Dato = ({ etiqueta, valor, children }) => (
  <div className="dato">
    <span className="auxiliar">{etiqueta}</span>
    <strong>{valor}</strong>
    {children}
  </div>
)

const Persona = ({ etiqueta, persona, editable, onAsignar }) => (
  <div className="dato">
    <span className="auxiliar">{etiqueta}</span>
    {persona ? <strong>{persona.nombre}</strong> : (
      <strong className="texto-alerta">Sin asignar{editable && <> · <button className="enlace-boton" onClick={onAsignar}>Asignar</button></>}</strong>
    )}
  </div>
)

function FormularioSesion({ grupo, sesion, onCerrar, onGuardado }) {
  const esAlta = !sesion.id
  const [v, setV] = useState({
    fecha: sesion.fecha || '', horaInicio: sesion.horaInicio || '09:00', horaFin: sesion.horaFin || '13:00', tema: sesion.tema || '',
  })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const cambiar = (campo) => (e) => setV((x) => ({ ...x, [campo]: e.target.value }))

  const guardar = async (evento) => {
    evento.preventDefault()
    setErrorServidor('')
    const e = {}
    if (!v.fecha) e.fecha = 'Indique la fecha de la sesión.'
    else if (v.fecha < grupo.fechaInicio || v.fecha > grupo.fechaFin) e.fecha = `Debe estar entre ${fecha(grupo.fechaInicio)} y ${fecha(grupo.fechaFin)}.`
    if (!v.horaInicio) e.horaInicio = 'Indique la hora de inicio.'
    if (!v.horaFin) e.horaFin = 'Indique la hora de fin.'
    else if (v.horaInicio && v.horaFin <= v.horaInicio) e.horaFin = 'Debe ser posterior a la hora de inicio.'
    setErrores(e)
    if (Object.keys(e).length) return
    setGuardando(true)
    const cuerpo = { fecha: v.fecha, horaInicio: v.horaInicio.slice(0, 5), horaFin: v.horaFin.slice(0, 5), tema: v.tema.trim() }
    try {
      const { data } = esAlta
        ? await cliente.post(`/grupos/${grupo.id}/sesiones`, cuerpo)
        : await cliente.put(`/sesiones/${sesion.id}`, cuerpo)
      onGuardado(data.mensaje)
    } catch (err) {
      setErrores(erroresPorCampo(err))
      setErrorServidor(err.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={esAlta ? 'Agregar sesión' : `Editar sesión ${sesion.numero}`} onCerrar={onCerrar} pie={<>
      <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button type="submit" form="form-sesion" className="boton boton--principal" disabled={guardando}>
        {guardando ? <><LoaderCircle size={18} className="girando" /> Guardando…</> : esAlta ? 'Agregar sesión' : 'Guardar cambios'}
      </button>
    </>}>
      <form id="form-sesion" onSubmit={guardar} noValidate>
        {errorServidor && <Aviso tipo="error" titulo="No se pudo guardar">{errorServidor}</Aviso>}
        <Campo id="fecha" etiqueta="Fecha" error={errores.fecha} ayuda={`Entre ${fecha(grupo.fechaInicio)} y ${fecha(grupo.fechaFin)}.`}>
          <input id="fecha" type="date" min={grupo.fechaInicio} max={grupo.fechaFin} value={v.fecha} onChange={cambiar('fecha')} aria-invalid={Boolean(errores.fecha)} autoFocus />
        </Campo>
        <div className="dos-columnas">
          <Campo id="horaInicio" etiqueta="Hora de inicio" error={errores.horaInicio}>
            <input id="horaInicio" type="time" value={v.horaInicio} onChange={cambiar('horaInicio')} aria-invalid={Boolean(errores.horaInicio)} />
          </Campo>
          <Campo id="horaFin" etiqueta="Hora de fin" error={errores.horaFin}>
            <input id="horaFin" type="time" value={v.horaFin} onChange={cambiar('horaFin')} aria-invalid={Boolean(errores.horaFin)} />
          </Campo>
        </div>
        <Campo id="tema" etiqueta="Tema (opcional)" error={errores.tema}>
          <input id="tema" maxLength={200} value={v.tema} onChange={cambiar('tema')} placeholder="Por ejemplo: Encuadre del curso" />
        </Campo>
      </form>
    </Modal>
  )
}
