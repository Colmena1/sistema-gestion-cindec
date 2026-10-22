import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import cliente from '../api/cliente.js'
import Aviso from '../components/Aviso.jsx'
import { ROLES } from '../config/menu.js'
import { useSesion } from '../context/SesionContext.jsx'
import useAvisoTemporal from '../hooks/useAvisoTemporal.js'
import { fechaConDia } from '../utils/formato.js'

// P-17 Registrar asistencia por sesión (CU-09, RF-CUR-10; mockup M17).
// La usan el instructor (de sus grupos) y la coordinación.
export default function Asistencia() {
  const { idSesion } = useParams()
  const navegar = useNavigate()
  const { usuario } = useSesion()
  const [datos, setDatos] = useState(null)
  const [marcas, setMarcas] = useState({})          // idInscripcion -> { asistio, observaciones }
  const [error, setError] = useState('')
  const [errorGuardar, setErrorGuardar] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [aviso, mostrarAviso] = useAvisoTemporal()
  const [abiertas, setAbiertas] = useState({})      // observaciones visibles

  const cargar = useCallback(() => {
    setDatos(null)
    cliente.get(`/sesiones/${idSesion}/asistencia`)
      .then(({ data }) => {
        setDatos(data)
        setMarcas(Object.fromEntries(data.registros.map((r) => [r.idInscripcion, { asistio: r.asistio, observaciones: r.observaciones }])))
        setAbiertas(Object.fromEntries(data.registros.filter((r) => r.observaciones).map((r) => [r.idInscripcion, true])))
        setError('')
      })
      .catch((err) => setError(err.mensaje))
  }, [idSesion])
  useEffect(() => { cargar() }, [cargar])

  const esInstructor = usuario.rol === ROLES.INSTRUCTOR
  const regreso = esInstructor ? '/mis-grupos' : datos ? `/grupos/${datos.grupo.id}` : '/grupos'

  if (error) return (<><Link to={regreso} className="enlace-volver"><ArrowLeft size={18} /> Regresar</Link>
    <div style={{ marginTop: 16 }}><Aviso tipo="error" titulo="No se pudo abrir la asistencia">{error}</Aviso></div></>)
  if (!datos) return <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando asistencia…</p>

  const marcar = (id, cambios) => setMarcas((m) => ({ ...m, [id]: { ...m[id], ...cambios } }))
  const marcados = Object.values(marcas).filter((m) => m.asistio !== null).length
  const total = datos.registros.length
  const sesionTexto = (s) => `Sesión ${s.numero} · ${fechaConDia(s.fecha)} · ${s.horaInicio} a ${s.horaFin}`

  const guardar = async () => {
    setErrorGuardar('')
    if (marcados < total) { setErrorGuardar(`Falta marcar a ${total - marcados} participante(s).`); return }
    setGuardando(true)
    try {
      const registros = Object.entries(marcas).map(([id, m]) => ({ idInscripcion: Number(id), asistio: m.asistio, observaciones: m.observaciones?.trim() || null }))
      const { data } = await cliente.put(`/sesiones/${idSesion}/asistencia`, { registros })
      mostrarAviso(data.mensaje)
    } catch (err) {
      setErrorGuardar(err.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <Link to={regreso} className="enlace-volver"><ArrowLeft size={18} /> {esInstructor ? 'Mis grupos' : datos.grupo.clave}</Link>
      <h1 className="titulo-pantalla" style={{ marginTop: 16 }}>Registrar asistencia</h1>
      <p className="auxiliar" style={{ marginTop: -16, marginBottom: 16 }}>{datos.grupo.clave} · {datos.grupo.curso}</p>
      {aviso && <Aviso tipo="exito" titulo={aviso} flotante />}

      <section className="tarjeta selector-sesion">
        <div className="campo">
          <label htmlFor="sesion">Sesión</label>
          <select id="sesion" value={datos.sesion.id} onChange={(e) => navegar(`/asistencia/${e.target.value}`, { replace: true })}>
            {datos.sesionesGrupo.map((s) => <option key={s.id} value={s.id}>{sesionTexto(s)}</option>)}
          </select>
        </div>
        {datos.sesion.tema && <p className="auxiliar">Tema: {datos.sesion.tema}</p>}
      </section>

      {datos.motivoSoloLectura && <div style={{ marginBottom: 16 }}><Aviso tipo="info" titulo="Solo consulta">{datos.motivoSoloLectura}</Aviso></div>}

      <section className="tarjeta tarjeta--tabla seccion-detalle">
        <div className="seccion-detalle__cabecera">
          <h2 className="subtitulo">Participantes ({total})</h2>
          {datos.editable && total > 0 && (
            <button className="boton boton--secundario" onClick={() => datos.registros.forEach((r) => marcar(r.idInscripcion, { asistio: true }))}>
              Marcar a todos como presentes
            </button>
          )}
        </div>
        {total === 0 ? (
          <div className="estado-vacio"><p className="subtitulo">El grupo no tiene participantes inscritos</p></div>
        ) : (
          <ul className="lista-asistencia">
            {datos.registros.map((r) => {
              const m = marcas[r.idInscripcion]
              const falta = m.asistio === null
              return (
                <li key={r.idInscripcion} className={falta && datos.editable ? 'lista-asistencia__fila--pendiente' : ''}>
                  <div className="lista-asistencia__persona">
                    <strong>{r.nombre}</strong>
                    {falta && datos.editable && <span className="texto-alerta auxiliar bloque"><strong>Falta marcar</strong></span>}
                    {abiertas[r.idInscripcion] ? (
                      <input className="lista-asistencia__obs" placeholder="Observación (opcional), p. ej. llegó a las 10:15" maxLength={500}
                        value={m.observaciones || ''} disabled={!datos.editable} onChange={(e) => marcar(r.idInscripcion, { observaciones: e.target.value })} />
                    ) : datos.editable && (
                      <button className="enlace-boton auxiliar" onClick={() => setAbiertas((a) => ({ ...a, [r.idInscripcion]: true }))}>Agregar observación</button>
                    )}
                  </div>
                  <div className="interruptor" role="radiogroup" aria-label={`Asistencia de ${r.nombre}`}>
                    <label className={`interruptor__opcion ${m.asistio === true ? 'interruptor__opcion--si' : ''}`}>
                      <input type="radio" name={`a-${r.idInscripcion}`} checked={m.asistio === true} disabled={!datos.editable}
                        onChange={() => marcar(r.idInscripcion, { asistio: true })} /> Asistió
                    </label>
                    <label className={`interruptor__opcion ${m.asistio === false ? 'interruptor__opcion--no' : ''}`}>
                      <input type="radio" name={`a-${r.idInscripcion}`} checked={m.asistio === false} disabled={!datos.editable}
                        onChange={() => marcar(r.idInscripcion, { asistio: false })} /> No asistió
                    </label>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {datos.editable && total > 0 && (
        <div className="pie-guardar">
          <span className="auxiliar">{marcados} de {total} marcados</span>
          {errorGuardar && <span className="campo__error">{errorGuardar}</span>}
          <button className="boton boton--principal" onClick={guardar} disabled={guardando}>
            {guardando ? <><LoaderCircle size={18} className="girando" /> Guardando…</> : 'Guardar asistencia'}
          </button>
        </div>
      )}
    </>
  )
}
