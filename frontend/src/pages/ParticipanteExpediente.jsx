import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, FilePlus2, LoaderCircle, Pencil } from 'lucide-react'
import cliente from '../api/cliente.js'
import { abrirDocumento } from '../api/documentos.js'
import Aviso from '../components/Aviso.jsx'
import Campo from '../components/Campo.jsx'
import CampoArchivo from '../components/CampoArchivo.jsx'
import Modal from '../components/Modal.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import FormularioParticipante from '../components/FormularioParticipante.jsx'
import useAvisoTemporal from '../hooks/useAvisoTemporal.js'
import { DICTAMEN, ESTATUS_GRUPO, ESTATUS_INSCRIPCION, ESTATUS_INTENTO, calificacion, erroresPorCampo, fecha, fechaDeInstante } from '../utils/formato.js'

// P-11 Expediente e historial del participante (CU-10, RF-CUR-06):
// datos, documentos y cursos. Evaluaciones y certificaciones se agregan en el Sprint 3.
const TIPOS_DOCUMENTO = [
  ['ine', 'INE'], ['pasaporte', 'Pasaporte'], ['cedula_profesional', 'Cédula profesional'], ['cartilla_militar', 'Cartilla militar'],
  ['fotografia', 'Fotografía'], ['ficha_registro', 'Ficha de registro'], ['identificacion_tutor', 'Identificación del tutor'],
]

export default function ParticipanteExpediente() {
  const { id } = useParams()
  const ubicacion = useLocation()
  const navegar = useNavigate()
  const [p, setP] = useState(null)
  const [error, setError] = useState('')
  const [cursos, setCursos] = useState([])
  const [aviso, mostrarAviso] = useAvisoTemporal()
  const [editando, setEditando] = useState(false)
  const [agregandoDoc, setAgregandoDoc] = useState(false)
  const [errorDoc, setErrorDoc] = useState('')

  const cargar = useCallback(() => {
    cliente.get(`/participantes/${id}`).then(({ data }) => { setP(data.participante); setError('') }).catch((err) => setError(err.mensaje))
  }, [id])
  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { cliente.get('/participantes/cursos-disponibles').then(({ data }) => setCursos(data.cursos)).catch(() => {}) }, [])
  useEffect(() => { if (ubicacion.state?.aviso) mostrarAviso(ubicacion.state.aviso) }, [ubicacion.state, mostrarAviso])

  const alGuardar = (mensaje) => { setEditando(false); setAgregandoDoc(false); mostrarAviso(mensaje); cargar() }
  const verDocumento = async (idDoc) => {
    setErrorDoc('')
    try { await abrirDocumento(idDoc) } catch (err) { setErrorDoc(err.mensaje || 'No se pudo abrir el documento.') }
  }

  if (error) {
    return (<>
      <Link to="/participantes" className="enlace-volver"><ArrowLeft size={18} /> Participantes</Link>
      <div style={{ marginTop: 16 }}><Aviso tipo="error" titulo="No se pudo abrir el expediente">{error}</Aviso></div>
    </>)
  }
  if (!p) return <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando expediente…</p>

  const tieneIdentificacion = p.documentos.some((d) => ['ine', 'pasaporte', 'cedula_profesional', 'cartilla_militar'].includes(d.tipo))
  const tieneFoto = p.documentos.some((d) => d.tipo === 'fotografia')
  const tieneTutor = p.documentos.some((d) => d.tipo === 'identificacion_tutor')
  const faltantes = [
    !tieneIdentificacion && 'identificación oficial',
    !tieneFoto && 'fotografía',
    p.esMenorDeEdad && !tieneTutor && 'identificación del tutor',
  ].filter(Boolean)

  return (
    <>
      <button className="enlace-volver enlace-boton-plano" onClick={() => navegar(-1)}><ArrowLeft size={18} /> Regresar</button>

      <div className="encabezado-pantalla encabezado-pantalla--detalle">
        <div>
          <h1 className="titulo-pantalla fila-icono">
            {p.nombre} {p.apellidos}
            {!p.activo && <EtiquetaEstatus>Cuenta desactivada</EtiquetaEstatus>}
          </h1>
          <p className="auxiliar">{p.correo} · Registrado el {fechaDeInstante(p.fechaRegistro)} {p.origen === 'autorregistro' ? 'por autorregistro' : 'por la coordinación'}</p>
        </div>
        <button className="boton boton--secundario" onClick={() => setEditando(true)}><Pencil size={18} /> Editar datos</button>
      </div>

      {aviso && <Aviso tipo="exito" titulo={aviso} flotante />}

      <section className="tarjeta datos-grupo">
        <Dato etiqueta="CURP" valor={p.curp}>{p.esMenorDeEdad && <span className="texto-alerta auxiliar">Menor de edad</span>}</Dato>
        <Dato etiqueta="Teléfono" valor={p.telefono} />
        <Dato etiqueta="Empresa de procedencia" valor={p.empresa || '—'} />
        <Dato etiqueta="Curso de interés" valor={p.cursoInteres || 'Sin preferencia'} />
      </section>

      {/* Documentos */}
      <section className="tarjeta tarjeta--tabla seccion-detalle">
        <div className="seccion-detalle__cabecera">
          <h2 className="subtitulo">Documentos ({p.documentos.length})</h2>
          <button className="boton boton--secundario" onClick={() => setAgregandoDoc(true)}><FilePlus2 size={18} /> Agregar documento</button>
        </div>
        {faltantes.length > 0 && <div className="relleno-lateral"><Aviso tipo="info" titulo="Documentos pendientes">Falta: {faltantes.join(', ')}.</Aviso></div>}
        {errorDoc && <div className="relleno-lateral"><Aviso tipo="error" titulo="No se pudo abrir el documento" onCerrar={() => setErrorDoc('')}>{errorDoc}</Aviso></div>}
        {p.documentos.length === 0 ? (
          <div className="estado-vacio"><p className="subtitulo">Sin documentos</p><p className="auxiliar">Agregue la identificación oficial y la fotografía del participante.</p></div>
        ) : (
          <table className="tabla">
            <thead><tr><th>Documento</th><th>Archivo</th><th>Fecha de carga</th><th className="tabla__acciones">Acciones</th></tr></thead>
            <tbody>
              {p.documentos.map((d) => (
                <tr key={d.id}>
                  <td data-etiqueta="Documento"><strong>{d.nombreTipo}</strong></td>
                  <td data-etiqueta="Archivo" className="recorte">{d.nombreArchivo}</td>
                  <td data-etiqueta="Fecha de carga">{fechaDeInstante(d.fechaCarga)}</td>
                  <td className="tabla__acciones">
                    <button className="boton boton--secundario boton--chico boton--accion" title="Ver" aria-label={`Ver ${d.nombreTipo}`} onClick={() => verDocumento(d.id)}>
                      <ExternalLink size={16} /><span className="texto-boton">Ver</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Historial de cursos (RF-CUR-06) */}
      <section className="tarjeta tarjeta--tabla seccion-detalle">
        <div className="seccion-detalle__cabecera"><h2 className="subtitulo">Cursos ({p.inscripciones.length})</h2></div>
        {p.inscripciones.length === 0 ? (
          <div className="estado-vacio"><p className="subtitulo">Todavía no está inscrito en ningún grupo</p></div>
        ) : (
          <table className="tabla">
            <thead><tr><th>Grupo</th><th>Fechas</th><th>Estatus del grupo</th><th>Su estatus</th><th>Materiales consultados</th></tr></thead>
            <tbody>
              {p.inscripciones.map((i) => (
                <tr key={i.id}>
                  <td data-etiqueta="Grupo"><Link to={`/grupos/${i.idGrupo}`} className="enlace-tabla">{i.clave}</Link><span className="auxiliar bloque">{i.curso} · {i.estandar}</span></td>
                  <td data-etiqueta="Fechas">{fecha(i.fechaInicio)} al {fecha(i.fechaFin)}</td>
                  <td data-etiqueta="Estatus del grupo"><EtiquetaEstatus tono={ESTATUS_GRUPO[i.estatusGrupo].tono}>{ESTATUS_GRUPO[i.estatusGrupo].texto}</EtiquetaEstatus></td>
                  <td data-etiqueta="Su estatus">
                    <EtiquetaEstatus tono={ESTATUS_INSCRIPCION[i.estatus].tono}>{ESTATUS_INSCRIPCION[i.estatus].texto}</EtiquetaEstatus>
                    {i.esRefuerzo && <span className="auxiliar bloque">Refuerzo</span>}
                  </td>
                  <td data-etiqueta="Materiales consultados">
                    {i.materiales.total === 0 ? <span className="auxiliar">Sin materiales</span> : `${i.materiales.consultados} de ${i.materiales.total}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Evaluaciones (RF-EVA-05) */}
      <section className="tarjeta tarjeta--tabla seccion-detalle">
        <div className="seccion-detalle__cabecera"><h2 className="subtitulo">Evaluaciones ({p.evaluaciones.length})</h2></div>
        {p.evaluaciones.length === 0 ? (
          <div className="estado-vacio"><p className="auxiliar">Todavía no presenta evaluaciones. Se evalúa después de marcar su capacitación como concluida.</p></div>
        ) : (
          <table className="tabla">
            <thead><tr><th>Estándar</th><th>Intento</th><th>Calificación</th><th>Evaluación</th><th>Dictamen</th><th className="tabla__acciones">Detalle</th></tr></thead>
            <tbody>
              {p.evaluaciones.map((e) => (
                <tr key={e.id}>
                  <td data-etiqueta="Estándar"><strong>{e.estandar}</strong><span className="auxiliar bloque">Grupo {e.grupo} · {e.instrumento}</span></td>
                  <td data-etiqueta="Intento">{e.numero} · {fecha(e.fechaAplicacion)}</td>
                  <td data-etiqueta="Calificación">{calificacion(e.calificacion)}<span className="auxiliar bloque">Mínima {calificacion(e.calificacionMinima)}</span></td>
                  <td data-etiqueta="Evaluación"><EtiquetaEstatus tono={ESTATUS_INTENTO[e.estatus].tono}>{ESTATUS_INTENTO[e.estatus].texto}</EtiquetaEstatus></td>
                  <td data-etiqueta="Dictamen">{e.dictamen ? <EtiquetaEstatus tono={DICTAMEN[e.dictamen].tono}>{DICTAMEN[e.dictamen].texto}</EtiquetaEstatus> : '—'}</td>
                  <td className="tabla__acciones"><Link to={`/por-evaluar/intento/${e.id}`} className="enlace-tabla">Ver</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="tarjeta estado-vacio seccion-detalle">
        <p className="subtitulo">Certificaciones</p>
        <p className="auxiliar">Esta parte del historial se agrega con el módulo de Certificaciones (Sprint 3, parte 3).</p>
      </section>

      {editando && (
        <FormularioParticipante participante={p} cursos={cursos} onCerrar={() => setEditando(false)} onGuardado={alGuardar} />
      )}
      {agregandoDoc && <AgregarDocumento idParticipante={p.id} onCerrar={() => setAgregandoDoc(false)} onGuardado={alGuardar} />}
    </>
  )
}

const Dato = ({ etiqueta, valor, children }) => (
  <div className="dato"><span className="auxiliar">{etiqueta}</span><strong>{valor}</strong>{children}</div>
)

function AgregarDocumento({ idParticipante, onCerrar, onGuardado }) {
  const [tipo, setTipo] = useState('ine')
  const [archivo, setArchivo] = useState(null)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e) => {
    e.preventDefault()
    setErrorServidor('')
    if (!archivo) { setErrores({ archivo: 'Seleccione el archivo.' }); return }
    if (tipo === 'fotografia' && (archivo.type === 'application/pdf' || archivo.size > 300 * 1024)) {
      setErrores({ archivo: 'La fotografía debe ser JPG o PNG de 300 KB como máximo.' }); return
    }
    setErrores({})
    setGuardando(true)
    const datos = new FormData()
    datos.append('tipoDocumento', tipo)
    datos.append('archivo', archivo)
    try {
      const { data } = await cliente.post(`/participantes/${idParticipante}/documentos`, datos)
      onGuardado(data.mensaje)
    } catch (err) {
      setErrores(erroresPorCampo(err))
      setErrorServidor(err.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Agregar documento" onCerrar={onCerrar} pie={<>
      <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button type="submit" form="form-documento" className="boton boton--principal" disabled={guardando}>
        {guardando ? <><LoaderCircle size={18} className="girando" /> Subiendo…</> : 'Agregar documento'}
      </button>
    </>}>
      <form id="form-documento" onSubmit={guardar} noValidate>
        {errorServidor && <Aviso tipo="error" titulo="No se pudo agregar">{errorServidor}</Aviso>}
        <Campo id="tipoDocumento" etiqueta="Tipo de documento" error={errores.tipoDocumento}>
          <select id="tipoDocumento" value={tipo} onChange={(e) => setTipo(e.target.value)} autoFocus>
            {TIPOS_DOCUMENTO.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
          </select>
        </Campo>
        <CampoArchivo id="archivo" etiqueta="Archivo" error={errores.archivo} archivo={archivo} onCambio={setArchivo}
          aceptar={tipo === 'fotografia' ? '.jpg,.jpeg,.png' : '.pdf,.jpg,.jpeg,.png'}
          ayuda={tipo === 'fotografia' ? 'JPG o PNG de 300 KB como máximo (CONOCER).' : 'PDF, JPG o PNG de 5 MB como máximo.'} />
      </form>
    </Modal>
  )
}
