import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Download, FileText, LoaderCircle, MessageSquareText, Plus, Trash2, X } from 'lucide-react'
import cliente from '../api/cliente.js'
import { descargarEvidencia } from '../api/evaluaciones.js'
import { tamanoLegible } from '../api/materiales.js'
import Aviso from '../components/Aviso.jsx'
import Campo from '../components/Campo.jsx'
import CampoArchivo from '../components/CampoArchivo.jsx'
import Confirmacion from '../components/Confirmacion.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import Modal from '../components/Modal.jsx'
import { ROLES } from '../config/menu.js'
import { useSesion } from '../context/SesionContext.jsx'
import useAvisoTemporal from '../hooks/useAvisoTemporal.js'
import { DICTAMEN, ESTATUS_INTENTO, calificacion, erroresPorCampo, fecha, fechaDeInstante } from '../utils/formato.js'

// P-20 Resultado y juicio de competencia (CU-15 + CU-16; RF-EVA-02, 03, 04) — mockup M20.
// Término CONOCER: el evaluador emite el "juicio de competencia"; el "dictamen" lo da después el
// Grupo de Dictamen (visión futura). En la base de datos la columna sigue llamándose "dictamen".
// El evaluador del grupo captura fecha, calificación, dictamen, observaciones y evidencias.
// Coordinación y administración la abren en modo consulta. Ya calificado, nada se modifica (RNF-06).
const EXTENSIONES_EVIDENCIA = /\.(pdf|docx?|jpe?g|png)$/i
const CALIFICACION_VALIDA = /^\d{1,3}(\.\d{1,2})?$/

export default function IntentoEvaluacion() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { usuario } = useSesion()
  const esEvaluador = usuario.rol === ROLES.EVALUADOR
  const [intento, setIntento] = useState(null)
  const [error, setError] = useState('')
  const [aviso, mostrarAviso] = useAvisoTemporal(6000)

  const cargar = useCallback(() => {
    cliente.get(`/intentos/${id}`).then(({ data }) => { setIntento(data.intento); setError('') }).catch((err) => setError(err.mensaje))
  }, [id])
  useEffect(() => { cargar() }, [cargar])

  const regresar = esEvaluador
    ? <Link to="/por-evaluar" className="enlace-volver"><ArrowLeft size={18} /> Por evaluar{intento && ` · ${intento.grupo.clave}`}</Link>
    : <button className="enlace-volver enlace-boton-plano" onClick={() => navegar(-1)}><ArrowLeft size={18} /> Regresar</button>

  if (error && !intento) return <>{regresar}<div style={{ marginTop: 16 }}><Aviso tipo="error" titulo="No se pudo abrir la evaluación">{error}</Aviso></div></>
  if (!intento) return <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando evaluación…</p>

  const est = ESTATUS_INTENTO[intento.estatus]
  return (
    <>
      {regresar}
      <div className="encabezado-pantalla encabezado-pantalla--detalle">
        <div>
          <h1 className="titulo-pantalla fila-icono">
            {intento.participante.nombre}
            <EtiquetaEstatus tono={est.tono}>Intento {intento.numero} · {est.texto}</EtiquetaEstatus>
          </h1>
          <p className="auxiliar">{intento.curso} · Grupo {intento.grupo.clave} ({fecha(intento.grupo.fechaInicio)} al {fecha(intento.grupo.fechaFin)})</p>
        </div>
      </div>
      {aviso && <Aviso tipo="exito" titulo={aviso} flotante />}

      <section className="tarjeta datos-grupo">
        <Dato etiqueta="Estándar" valor={`${intento.estandar.codigo} ${intento.estandar.nombre}`} />
        <Dato etiqueta="Instrumento" valor={intento.instrumento.tipoTexto}><span className="auxiliar">{intento.instrumento.nombre}</span></Dato>
        <Dato etiqueta="Calificación mínima" valor={calificacion(intento.instrumento.calificacionMinima)} />
      </section>

      {intento.puedeEditar
        ? <Captura intento={intento} onCambio={cargar} onAviso={mostrarAviso} />
        : <Resultado intento={intento} />}

      {intento.otrosIntentos.length > 0 && (
        <section className="tarjeta tarjeta--tabla seccion-detalle">
          <div className="seccion-detalle__cabecera"><h2 className="subtitulo">Otros intentos de este participante</h2></div>
          <table className="tabla">
            <thead><tr><th>Intento</th><th>Fecha</th><th>Calificación</th><th>Evaluación</th><th>Juicio de competencia</th></tr></thead>
            <tbody>
              {intento.otrosIntentos.map((o) => (
                <tr key={o.id}>
                  <td data-etiqueta="Intento"><Link to={`/por-evaluar/intento/${o.id}`} className="enlace-tabla">Intento {o.numero}</Link></td>
                  <td data-etiqueta="Fecha">{fecha(o.fechaAplicacion)}</td>
                  <td data-etiqueta="Calificación">{calificacion(o.calificacion)}</td>
                  <td data-etiqueta="Evaluación"><EtiquetaEstatus tono={ESTATUS_INTENTO[o.estatus].tono}>{ESTATUS_INTENTO[o.estatus].texto}</EtiquetaEstatus></td>
                  <td data-etiqueta="Juicio de competencia">{o.dictamen ? <EtiquetaEstatus tono={DICTAMEN[o.dictamen].tono}>{DICTAMEN[o.dictamen].texto}</EtiquetaEstatus> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  )
}

const Dato = ({ etiqueta, valor, children }) => (
  <div className="dato"><span className="auxiliar">{etiqueta}</span><strong>{valor}</strong>{children}</div>
)

// ---------------------------------------------------------------------
// Consulta (ya calificado, o lo abre la coordinación)
// ---------------------------------------------------------------------
function Resultado({ intento }) {
  const calificado = intento.estatus !== 'pendiente'
  return (
    <>
      <section className="tarjeta seccion-detalle">
        <h2 className="subtitulo">Resultado</h2>
        {calificado ? (
          <div className="datos-grupo" style={{ marginBottom: 0 }}>
            <Dato etiqueta="Fecha de aplicación" valor={fecha(intento.fechaAplicacion)} />
            <Dato etiqueta="Calificación" valor={calificacion(intento.calificacion)}>
              <span><EtiquetaEstatus tono={ESTATUS_INTENTO[intento.estatus].tono}>Evaluación {ESTATUS_INTENTO[intento.estatus].texto.toLowerCase()}</EtiquetaEstatus></span>
            </Dato>
            <Dato etiqueta="Juicio de competencia" valor={intento.dictamen ? DICTAMEN[intento.dictamen].texto : '—'} />
            <Dato etiqueta="Evaluador" valor={intento.evaluador || '—'} />
          </div>
        ) : <p className="auxiliar">El evaluador todavía no registra el resultado de este intento.</p>}
        {intento.observaciones && <><p className="auxiliar" style={{ marginBottom: 4 }}>Observaciones</p><p style={{ margin: 0 }}>{intento.observaciones}</p></>}
      </section>
      <Evidencias intento={intento} editable={false} />
    </>
  )
}

// ---------------------------------------------------------------------
// Captura (evaluador asignado, intento pendiente)
// ---------------------------------------------------------------------
function Captura({ intento, onCambio, onAviso }) {
  const navegar = useNavigate()
  const minima = intento.instrumento.calificacionMinima
  const [v, setV] = useState({ fechaAplicacion: intento.fechaAplicacion, calificacion: '', dictamen: '', observaciones: '' })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const [cancelar, setCancelar] = useState(false)

  const numero = Number(v.calificacion)
  const hayCalificacion = v.calificacion !== '' && CALIFICACION_VALIDA.test(v.calificacion.trim()) && numero <= 100
  const aprobada = hayCalificacion && numero >= minima

  const cambiarCalificacion = (e) => {
    const valor = e.target.value
    setV((x) => {
      const n = Number(valor)
      const reprobada = valor !== '' && n < minima
      // Con calificación reprobatoria no puede quedar "Competente"
      return { ...x, calificacion: valor, dictamen: reprobada && x.dictamen === 'competente' ? '' : x.dictamen }
    })
  }

  const validar = () => {
    const e = {}
    if (!v.fechaAplicacion) e.fechaAplicacion = 'Escriba la fecha de aplicación.'
    else if (v.fechaAplicacion > intento.hoy) e.fechaAplicacion = 'La fecha de aplicación no puede ser futura.'
    else if (v.fechaAplicacion < intento.grupo.fechaInicio) e.fechaAplicacion = `No puede ser anterior al inicio del grupo (${fecha(intento.grupo.fechaInicio)}).`
    if (v.calificacion === '') e.calificacion = 'Escriba la calificación.'
    else if (!hayCalificacion) e.calificacion = 'Escriba un número de 0 a 100, con dos decimales como máximo.'
    if (!v.dictamen) e.dictamen = 'Seleccione el juicio de competencia.'
    else if (v.dictamen === 'competente' && !aprobada) e.dictamen = `Con una calificación menor que ${calificacion(minima)} el juicio de competencia solo puede ser "Todavía no competente".`
    if (intento.evidencias.length === 0) e.evidencias = 'Suba al menos una evidencia antes de guardar el resultado.'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const alGuardar = (evento) => {
    evento.preventDefault()
    setErrorServidor('')
    if (validar()) setConfirmar(true)
  }

  const enviar = async () => {
    try {
      const { data } = await cliente.put(`/intentos/${intento.id}/resultado`, {
        fechaAplicacion: v.fechaAplicacion, calificacion: Number(v.calificacion), dictamen: v.dictamen, observaciones: v.observaciones.trim() || null,
      })
      return data.mensaje
    } catch (err) {
      setErrores(erroresPorCampo(err))
      throw err
    }
  }

  return (
    <>
      <form id="form-resultado" onSubmit={alGuardar} noValidate>
        <section className="tarjeta seccion-detalle">
          <h2 className="subtitulo">Resultado</h2>
          {errorServidor && <Aviso tipo="error" titulo="No se pudo guardar">{errorServidor}</Aviso>}
          <div className="dos-columnas">
            <Campo id="fechaAplicacion" etiqueta="Fecha de aplicación" error={errores.fechaAplicacion}>
              <input id="fechaAplicacion" type="date" value={v.fechaAplicacion} min={intento.grupo.fechaInicio} max={intento.hoy}
                onChange={(e) => setV((x) => ({ ...x, fechaAplicacion: e.target.value }))} aria-invalid={Boolean(errores.fechaAplicacion)} />
            </Campo>
            <div className="campo">
              <label htmlFor="calificacion">Calificación (0 a 100)</label>
              <input id="calificacion" type="number" min={0} max={100} step="0.01" inputMode="decimal" value={v.calificacion}
                onChange={cambiarCalificacion} aria-invalid={Boolean(errores.calificacion)} autoFocus />
              {errores.calificacion ? <p className="campo__error">{errores.calificacion}</p>
                : hayCalificacion && (
                  <p className={`ayuda-resultado ${aprobada ? 'ayuda-resultado--exito' : 'ayuda-resultado--error'}`}>
                    {aprobada ? <Check size={16} /> : <X size={16} />}
                    {aprobada ? `Aprobada: es igual o mayor que ${calificacion(minima)}` : `No aprobada: es menor que ${calificacion(minima)}`}
                  </p>
                )}
            </div>
          </div>

          <fieldset className="opciones-dictamen">
            <legend>Juicio de competencia</legend>
            <OpcionDictamen valor="competente" elegido={v.dictamen} deshabilitada={hayCalificacion && !aprobada}
              titulo="Competente" texto={hayCalificacion && !aprobada ? 'Requiere una calificación aprobatoria.' : 'Se podrá iniciar su trámite de certificación.'}
              onElegir={(d) => setV((x) => ({ ...x, dictamen: d }))} />
            <OpcionDictamen valor="todavia_no_competente" elegido={v.dictamen}
              titulo="Todavía no competente" texto="Podrá presentar un nuevo intento."
              onElegir={(d) => setV((x) => ({ ...x, dictamen: d }))} />
          </fieldset>
          {errores.dictamen && <p className="campo__error" style={{ marginTop: -4 }}>{errores.dictamen}</p>}

          <Campo id="observaciones" etiqueta="Observaciones (opcional)">
            <textarea id="observaciones" rows={3} maxLength={2000} value={v.observaciones}
              onChange={(e) => setV((x) => ({ ...x, observaciones: e.target.value }))} placeholder="Lo que observó durante la evaluación" />
          </Campo>
        </section>
      </form>

      {/* Fuera del formulario: la ventana "Subir evidencia" tiene su propio formulario (no se anidan) */}
      <Evidencias intento={intento} editable onAviso={onAviso} error={errores.evidencias}
        onCambio={() => { setErrores(({ evidencias, ...resto }) => resto); onCambio() }} />

      <div className="pie-captura">
        <button type="button" className="boton boton--secundario" onClick={() => setCancelar(true)}><Trash2 size={18} /> Cancelar intento</button>
        <div className="grupo-botones">
          <Link to="/por-evaluar" className="boton boton--secundario">Salir sin guardar</Link>
          <button type="submit" form="form-resultado" className="boton boton--principal">Guardar resultado</button>
        </div>
      </div>

      {confirmar && (
        <Confirmacion titulo="Guardar resultado" textoBoton="Guardar resultado" accion={enviar}
          onCerrar={() => setConfirmar(false)} onHecho={(mensaje) => { setConfirmar(false); onAviso(mensaje); onCambio() }}>
          {intento.participante.nombre}: calificación <strong>{calificacion(numero)}</strong> ({aprobada ? 'aprobada' : 'no aprobada'}),
          juicio de competencia <strong>{DICTAMEN[v.dictamen]?.texto.toLowerCase()}</strong>. Una vez guardado, el resultado y sus evidencias ya no se podrán modificar.
        </Confirmacion>
      )}
      {cancelar && (
        <Confirmacion titulo="Cancelar intento" textoBoton="Cancelar intento" peligro
          accion={async () => (await cliente.delete(`/intentos/${intento.id}`)).data.mensaje}
          onCerrar={() => setCancelar(false)} onHecho={() => navegar('/por-evaluar')}>
          ¿Cancelar el intento {intento.numero} de <strong>{intento.participante.nombre}</strong>? Se eliminarán sus {intento.evidencias.length} evidencia(s). Úselo solo si el intento se inició por error.
        </Confirmacion>
      )}
    </>
  )
}

function OpcionDictamen({ valor, elegido, deshabilitada, titulo, texto, onElegir }) {
  const activa = elegido === valor
  return (
    <label className={`opcion-dictamen ${activa ? `opcion-dictamen--${valor === 'competente' ? 'exito' : 'alerta'}` : ''} ${deshabilitada ? 'opcion-dictamen--deshabilitada' : ''}`}>
      <input type="radio" name="dictamen" value={valor} checked={activa} disabled={deshabilitada} onChange={() => onElegir(valor)} />
      <span><strong>{titulo}</strong><span className="auxiliar bloque">{texto}</span></span>
    </label>
  )
}

// ---------------------------------------------------------------------
// Evidencias (CU-16)
// ---------------------------------------------------------------------
function Evidencias({ intento, editable, onCambio, onAviso, error }) {
  const [subiendo, setSubiendo] = useState(false)
  const [quitar, setQuitar] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')

  const descargar = async (e) => {
    setErrorAccion('')
    try { await descargarEvidencia(e.id, e.nombreArchivo) } catch (err) { setErrorAccion(err.mensaje) }
  }

  return (
    <section className="tarjeta tarjeta--tabla seccion-detalle">
      <div className="seccion-detalle__cabecera">
        <h2 className="subtitulo">Evidencias ({intento.evidencias.length})</h2>
        {editable && <button type="button" className="boton boton--secundario" onClick={() => setSubiendo(true)}><Plus size={18} /> Subir evidencia</button>}
      </div>
      {error && <div className="relleno-lateral"><Aviso tipo="error" titulo="Falta la evidencia">{error}</Aviso></div>}
      {errorAccion && <div className="relleno-lateral"><Aviso tipo="error" titulo="No se pudo descargar" onCerrar={() => setErrorAccion('')}>{errorAccion}</Aviso></div>}
      {intento.evidencias.length === 0 ? (
        <div className="estado-vacio"><p className="auxiliar">{editable ? 'Suba la guía, lista o cuestionario aplicado y los productos del candidato.' : 'Sin evidencias.'}</p></div>
      ) : (
        <ul className="lista-materiales">
          {intento.evidencias.map((e) => (
            <li key={e.id}>
              <span className="lista-materiales__icono">{e.nombreArchivo ? <FileText size={22} /> : <MessageSquareText size={22} />}</span>
              <div className="lista-materiales__texto">
                <strong className="recorte-texto">{e.nombreArchivo || 'Descripción'}</strong>
                <span className="auxiliar">{[e.descripcion, tamanoLegible(e.tamano), fechaDeInstante(e.fechaCarga)].filter(Boolean).join(' · ')}</span>
              </div>
              {e.nombreArchivo && (
                <button type="button" className="boton boton--secundario boton--chico boton--accion" title="Descargar" aria-label={`Descargar ${e.nombreArchivo}`} onClick={() => descargar(e)}>
                  <Download size={16} /><span className="texto-boton">Descargar</span>
                </button>
              )}
              {editable && (
                <button type="button" className="boton boton--secundario boton--chico boton--accion" title="Quitar" aria-label={`Quitar ${e.nombreArchivo || 'evidencia'}`} onClick={() => setQuitar(e)}>
                  <Trash2 size={16} /><span className="texto-boton">Quitar</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {subiendo && <SubirEvidencia idIntento={intento.id} onCerrar={() => setSubiendo(false)} onGuardado={(m) => { setSubiendo(false); onAviso(m); onCambio() }} />}
      {quitar && (
        <Confirmacion titulo="Quitar evidencia" textoBoton="Quitar" peligro
          accion={async () => (await cliente.delete(`/evidencias/${quitar.id}`)).data.mensaje}
          onCerrar={() => setQuitar(null)} onHecho={(m) => { setQuitar(null); onAviso(m); onCambio() }}>
          ¿Quitar <strong>{quitar.nombreArchivo || 'esta evidencia'}</strong> del intento?
        </Confirmacion>
      )}
    </section>
  )
}

function SubirEvidencia({ idIntento, onCerrar, onGuardado }) {
  const [archivo, setArchivo] = useState(null)
  const [descripcion, setDescripcion] = useState('')
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)

  const elegir = (a) => {
    setArchivo(a)
    if (a && !EXTENSIONES_EVIDENCIA.test(a.name)) setErrores({ archivo: 'Tipo de archivo no permitido. Use PDF, Word, JPG o PNG.' })
    else if (a && a.size > 10 * 1024 * 1024) setErrores({ archivo: 'La evidencia debe pesar como máximo 10 MB.' })
    else setErrores({})
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrorServidor('')
    if (!archivo && !descripcion.trim()) { setErrores({ archivo: 'Suba un archivo o escriba una descripción.' }); return }
    if (errores.archivo) return
    setGuardando(true)
    const datos = new FormData()
    if (archivo) datos.append('archivo', archivo)
    if (descripcion.trim()) datos.append('descripcion', descripcion.trim())
    try {
      const { data } = await cliente.post(`/intentos/${idIntento}/evidencias`, datos)
      onGuardado(data.mensaje)
    } catch (err) {
      setErrores(erroresPorCampo(err))
      setErrorServidor(err.mensaje)
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Subir evidencia" onCerrar={onCerrar} pie={<>
      <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button type="submit" form="form-evidencia" className="boton boton--principal" disabled={guardando}>
        {guardando ? <><LoaderCircle size={18} className="girando" /> Subiendo…</> : 'Subir evidencia'}
      </button>
    </>}>
      <form id="form-evidencia" onSubmit={guardar} noValidate>
        {errorServidor && <Aviso tipo="error" titulo="No se pudo subir">{errorServidor}</Aviso>}
        <CampoArchivo id="archivo" etiqueta="Archivo" error={errores.archivo} archivo={archivo} onCambio={elegir}
          aceptar=".pdf,.doc,.docx,.jpg,.jpeg,.png" ayuda="PDF, Word, JPG o PNG de hasta 10 MB." />
        <Campo id="descripcion" etiqueta="Descripción" error={errores.descripcion} ayuda="Por ejemplo: Guía de observación firmada. Si no sube archivo, la descripción es obligatoria.">
          <input id="descripcion" maxLength={500} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </Campo>
      </form>
    </Modal>
  )
}
