import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Download, FileText, FolderOpen, LoaderCircle, Pencil, PenLine, PlayCircle, Plus, Presentation, Trash2,
} from 'lucide-react'
import cliente from '../api/cliente.js'
import { abrirVideo, descargarMaterial, tamanoLegible } from '../api/materiales.js'
import Aviso from '../components/Aviso.jsx'
import Campo from '../components/Campo.jsx'
import CampoArchivo from '../components/CampoArchivo.jsx'
import Confirmacion from '../components/Confirmacion.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import Modal from '../components/Modal.jsx'
import { ROLES } from '../config/menu.js'
import { useSesion } from '../context/SesionContext.jsx'
import useAvisoTemporal from '../hooks/useAvisoTemporal.js'
import { erroresPorCampo, fechaDeInstante } from '../utils/formato.js'

// Materiales de aprendizaje.
//  - Participante: P-22 consultar y descargar (CU-13; mockup M22).
//  - Instructor, coordinación y administración: P-18 gestionar materiales del curso (CU-12).
const EXTENSIONES_MATERIAL = /\.(pdf|docx?|pptx?|xlsx?|jpe?g|png)$/i
const ICONO = { manual: FileText, presentacion: Presentation, pdf: FileText, ejercicio: PenLine, video: PlayCircle }

export default function Materiales() {
  const { usuario } = useSesion()
  return usuario.rol === ROLES.PARTICIPANTE ? <MisMateriales /> : <GestionMateriales />
}

const detalleMaterial = (m) => [m.tipoTexto, m.esVideo ? 'enlace externo' : m.formato, tamanoLegible(m.tamano)].filter(Boolean).join(' · ')

// =====================================================================
// Participante
// =====================================================================
function MisMateriales() {
  const [parametros] = useSearchParams()
  const cursoElegido = Number(parametros.get('curso')) || null
  const [cursos, setCursos] = useState(null)
  const [error, setError] = useState('')
  const [errorAccion, setErrorAccion] = useState('')
  const [trabajando, setTrabajando] = useState(null)

  const cargar = useCallback(() => {
    cliente.get('/mis-materiales').then(({ data }) => setCursos(data.cursos)).catch((err) => setError(err.mensaje))
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const abrir = async (m) => {
    setErrorAccion('')
    setTrabajando(m.id)
    try {
      if (m.esVideo) await abrirVideo(m.id)
      else await descargarMaterial(m.id, m.titulo)
      cargar() // actualiza la marca de "Consultado"
    } catch (err) {
      setErrorAccion(err.mensaje || 'No se pudo abrir el material.')
    } finally {
      setTrabajando(null)
    }
  }

  const lista = cursos ? (cursoElegido ? cursos.filter((c) => c.idCurso === cursoElegido) : cursos) : null

  return (
    <>
      <h1 className="titulo-pantalla fila-icono"><FolderOpen size={26} strokeWidth={1.75} /> Materiales</h1>
      {error && <Aviso tipo="error" titulo="No se pudieron cargar sus materiales">{error}</Aviso>}
      {errorAccion && <div style={{ marginBottom: 16 }}><Aviso tipo="error" titulo="No se pudo abrir el material" onCerrar={() => setErrorAccion('')}>{errorAccion}</Aviso></div>}
      {!lista && !error && <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando…</p>}
      {lista && lista.length === 0 && (
        <div className="tarjeta estado-vacio">
          <p className="subtitulo">Todavía no hay materiales para usted</p>
          <p className="auxiliar">Cuando esté inscrito en un curso, aquí aparecerán sus manuales, presentaciones, ejercicios y videos.</p>
        </div>
      )}
      {lista?.map((c) => {
        const consultados = c.materiales.filter((m) => m.consultado).length
        return (
          <section key={c.idCurso} className="tarjeta tarjeta--tabla seccion-detalle">
            <div className="seccion-detalle__cabecera">
              <div>
                <h2 className="subtitulo">{c.curso}</h2>
                <p className="auxiliar">{c.estandar} · Grupo {c.clave}{c.instructor && ` · Instructor: ${c.instructor}`}</p>
              </div>
              {c.materiales.length > 0 && <span className="auxiliar">Consultados: {consultados} de {c.materiales.length}</span>}
            </div>
            {c.materiales.length === 0 ? (
              <div className="estado-vacio"><p className="auxiliar">El instructor todavía no ha publicado materiales para este curso.</p></div>
            ) : (
              <ul className="lista-materiales">
                {c.materiales.map((m) => {
                  const Icono = ICONO[m.tipo] || FileText
                  return (
                    <li key={m.id}>
                      <span className="lista-materiales__icono"><Icono size={22} /></span>
                      <div className="lista-materiales__texto">
                        <strong>{m.titulo}</strong>
                        <span className="auxiliar">{detalleMaterial(m)}</span>
                      </div>
                      {m.consultado && <EtiquetaEstatus tono="exito">Consultado</EtiquetaEstatus>}
                      <button className="boton boton--secundario" onClick={() => abrir(m)} disabled={trabajando === m.id}>
                        {trabajando === m.id ? <LoaderCircle size={18} className="girando" /> : m.esVideo ? <PlayCircle size={18} /> : <Download size={18} />}
                        {m.esVideo ? 'Ver video' : 'Descargar'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </>
  )
}

// =====================================================================
// Instructor / coordinación
// =====================================================================
function GestionMateriales() {
  const [parametros, setParametros] = useSearchParams()
  const [cursos, setCursos] = useState(null)
  const [error, setError] = useState('')
  const idCurso = parametros.get('curso') || ''
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [aviso, mostrarAviso] = useAvisoTemporal()
  const [formulario, setFormulario] = useState(null)
  const [eliminar, setEliminar] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')

  useEffect(() => {
    cliente.get('/materiales/cursos').then(({ data }) => {
      setCursos(data.cursos)
      if (!parametros.get('curso') && data.cursos.length === 1) setParametros({ curso: String(data.cursos[0].id) }, { replace: true })
    }).catch((err) => setError(err.mensaje))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setErrorAccion('') }, [idCurso]) // al cambiar de curso se limpia el aviso anterior

  const cargar = useCallback(() => {
    if (!idCurso) { setDatos(null); return }
    setCargando(true)
    cliente.get(`/materiales/curso/${idCurso}`)
      .then(({ data }) => { setDatos(data); setError('') })
      .catch((err) => setError(err.mensaje))
      .finally(() => setCargando(false))
  }, [idCurso])
  useEffect(() => { cargar() }, [cargar])

  const alGuardar = (mensaje) => { setFormulario(null); setEliminar(null); mostrarAviso(mensaje); cargar() }
  const ver = async (m) => {
    setErrorAccion('')
    try { if (m.esVideo) await abrirVideo(m.id); else await descargarMaterial(m.id, m.titulo) } catch (err) { setErrorAccion(err.mensaje) }
  }

  return (
    <>
      <div className="encabezado-pantalla">
        <h1 className="titulo-pantalla fila-icono"><FolderOpen size={26} strokeWidth={1.75} /> Materiales del curso</h1>
        {datos && <button className="boton boton--principal" onClick={() => setFormulario({})}><Plus size={18} /> Agregar material</button>}
      </div>
      {aviso && <Aviso tipo="exito" titulo={aviso} flotante />}
      {error && <div style={{ marginBottom: 16 }}><Aviso tipo="error" titulo="No se pudo cargar">{error}</Aviso></div>}
      {errorAccion && <div style={{ marginBottom: 16 }}><Aviso tipo="error" titulo="No se pudo abrir el material" onCerrar={() => setErrorAccion('')}>{errorAccion}</Aviso></div>}

      {cursos && cursos.length === 0 ? (
        <div className="tarjeta estado-vacio">
          <p className="subtitulo">No tiene cursos asignados</p>
          <p className="auxiliar">Podrá publicar materiales cuando la coordinación lo asigne como instructor de un grupo.</p>
        </div>
      ) : (
        <div className="filtros filtros--uno">
          <div className="campo">
            <label htmlFor="curso">Curso</label>
            <select id="curso" value={idCurso} onChange={(e) => setParametros(e.target.value ? { curso: e.target.value } : {})}>
              <option value="">Seleccione un curso</option>
              {cursos?.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.estandar}) · {c.materiales} materiales</option>)}
            </select>
          </div>
        </div>
      )}

      {cargando && <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando materiales…</p>}

      {datos && !cargando && (
        <section className="tarjeta tarjeta--tabla seccion-detalle">
          <div className="seccion-detalle__cabecera">
            <div>
              <h2 className="subtitulo">{datos.curso.nombre}</h2>
              <p className="auxiliar">Los materiales los ven todos los grupos de este curso · {datos.participantesCurso} participantes inscritos</p>
            </div>
          </div>
          {datos.materiales.length === 0 ? (
            <div className="estado-vacio">
              <p className="subtitulo">Este curso todavía no tiene materiales</p>
              <p className="auxiliar">Agregue manuales, presentaciones, ejercicios o enlaces a video.</p>
            </div>
          ) : (
            <table className="tabla">
              <thead><tr><th>#</th><th>Material</th><th>Consultado por</th><th>Publicado</th><th className="tabla__acciones">Acciones</th></tr></thead>
              <tbody>
                {datos.materiales.map((m) => (
                  <tr key={m.id}>
                    <td data-etiqueta="Orden">{m.orden}</td>
                    <td data-etiqueta="Material"><strong>{m.titulo}</strong><span className="auxiliar bloque">{detalleMaterial(m)}</span></td>
                    <td data-etiqueta="Consultado por">{m.consultas} de {datos.participantesCurso}</td>
                    <td data-etiqueta="Publicado">{fechaDeInstante(m.fechaCarga)}</td>
                    <td className="tabla__acciones">
                      <button className="boton boton--secundario boton--chico boton--accion" title={m.esVideo ? 'Ver video' : 'Descargar'} aria-label={`Abrir ${m.titulo}`} onClick={() => ver(m)}>
                        {m.esVideo ? <PlayCircle size={16} /> : <Download size={16} />}<span className="texto-boton">{m.esVideo ? 'Ver video' : 'Descargar'}</span>
                      </button>
                      <button className="boton boton--secundario boton--chico boton--accion" title="Editar" aria-label={`Editar ${m.titulo}`} onClick={() => setFormulario(m)}>
                        <Pencil size={16} /><span className="texto-boton">Editar</span>
                      </button>
                      <button className="boton boton--secundario boton--chico boton--accion" title="Eliminar" aria-label={`Eliminar ${m.titulo}`} onClick={() => setEliminar(m)}>
                        <Trash2 size={16} /><span className="texto-boton">Eliminar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {formulario && <FormularioMaterial idCurso={idCurso} material={formulario.id ? formulario : null} onCerrar={() => setFormulario(null)} onGuardado={alGuardar} />}
      {eliminar && (
        <Confirmacion titulo="Eliminar material" textoBoton="Eliminar material" peligro
          accion={async () => (await cliente.delete(`/materiales/${eliminar.id}`)).data.mensaje}
          onCerrar={() => setEliminar(null)} onHecho={alGuardar}>
          ¿Eliminar <strong>{eliminar.titulo}</strong>? Si algún participante ya lo consultó, no se podrá eliminar para conservar su historial.
        </Confirmacion>
      )}
    </>
  )
}

function FormularioMaterial({ idCurso, material, onCerrar, onGuardado }) {
  const esAlta = !material
  const [v, setV] = useState({ titulo: material?.titulo || '', tipo: material?.tipo || 'manual', urlVideo: material?.urlVideo || '', orden: material ? String(material.orden) : '' })
  const [archivo, setArchivo] = useState(null)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const cambiar = (campo) => (e) => setV((x) => ({ ...x, [campo]: e.target.value }))
  const esVideo = esAlta ? v.tipo === 'video' : material.esVideo

  const guardar = async (evento) => {
    evento.preventDefault()
    setErrorServidor('')
    const e = {}
    if (!v.titulo.trim()) e.titulo = 'Escriba el título del material.'
    if (esVideo && !/^https?:\/\/\S+$/.test(v.urlVideo.trim())) e.urlVideo = 'Escriba el enlace completo del video, empezando con https://'
    if (esAlta && !esVideo && !archivo) e.archivo = 'Seleccione el archivo.'
    if (archivo && !EXTENSIONES_MATERIAL.test(archivo.name)) e.archivo = 'Tipo de archivo no permitido. Use PDF, Word, PowerPoint, Excel, JPG o PNG.'
    if (archivo && archivo.size > 20 * 1024 * 1024) e.archivo = 'El material debe pesar como máximo 20 MB.'
    if (v.orden && !(Number(v.orden) >= 1 && Number(v.orden) <= 999)) e.orden = 'Escriba un número entre 1 y 999.'
    setErrores(e)
    if (Object.keys(e).length) return
    setGuardando(true)
    try {
      let respuesta
      if (esAlta) {
        const datos = new FormData()
        datos.append('titulo', v.titulo.trim())
        datos.append('tipo', v.tipo)
        if (v.orden) datos.append('orden', v.orden)
        if (esVideo) datos.append('urlVideo', v.urlVideo.trim())
        else datos.append('archivo', archivo)
        respuesta = await cliente.post(`/materiales/curso/${idCurso}`, datos)
      } else {
        const cuerpo = { titulo: v.titulo.trim() }
        if (v.orden) cuerpo.orden = Number(v.orden)
        if (esVideo) cuerpo.urlVideo = v.urlVideo.trim()
        respuesta = await cliente.put(`/materiales/${material.id}`, cuerpo)
      }
      onGuardado(respuesta.data.mensaje)
    } catch (err) {
      setErrores(erroresPorCampo(err))
      setErrorServidor(err.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={esAlta ? 'Agregar material' : 'Editar material'} onCerrar={onCerrar} pie={<>
      <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button type="submit" form="form-material" className="boton boton--principal" disabled={guardando}>
        {guardando ? <><LoaderCircle size={18} className="girando" /> Guardando…</> : esAlta ? 'Agregar material' : 'Guardar cambios'}
      </button>
    </>}>
      <form id="form-material" onSubmit={guardar} noValidate>
        {errorServidor && <Aviso tipo="error" titulo="No se pudo guardar">{errorServidor}</Aviso>}
        <Campo id="titulo" etiqueta="Título" error={errores.titulo}>
          <input id="titulo" maxLength={200} value={v.titulo} onChange={cambiar('titulo')} placeholder="Por ejemplo: Manual del participante" aria-invalid={Boolean(errores.titulo)} autoFocus />
        </Campo>
        <div className="dos-columnas">
          <Campo id="tipo" etiqueta="Tipo">
            <select id="tipo" value={v.tipo} onChange={cambiar('tipo')} disabled={!esAlta}>
              <option value="manual">Manual</option>
              <option value="presentacion">Presentación</option>
              <option value="pdf">PDF</option>
              <option value="ejercicio">Ejercicio</option>
              <option value="video">Video (enlace)</option>
            </select>
          </Campo>
          <Campo id="orden" etiqueta="Orden en la lista (opcional)" error={errores.orden} ayuda={esAlta ? 'Si lo deja vacío, va al final.' : undefined}>
            <input id="orden" type="number" min={1} max={999} value={v.orden} onChange={cambiar('orden')} />
          </Campo>
        </div>
        {esVideo ? (
          <Campo id="urlVideo" etiqueta="Enlace del video" error={errores.urlVideo} ayuda="YouTube, Google Drive, Vimeo u otro enlace público.">
            <input id="urlVideo" type="url" placeholder="https://www.youtube.com/watch?v=…" value={v.urlVideo} onChange={cambiar('urlVideo')} aria-invalid={Boolean(errores.urlVideo)} />
          </Campo>
        ) : esAlta && (
          <CampoArchivo id="archivo" etiqueta="Archivo" error={errores.archivo} archivo={archivo} onCambio={setArchivo}
            aceptar=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
            ayuda="PDF, Word, PowerPoint, Excel, JPG o PNG de hasta 20 MB." />
        )}
      </form>
    </Modal>
  )
}

