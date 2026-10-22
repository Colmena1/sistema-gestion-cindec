import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, LoaderCircle, Pencil, Plus, Power, PowerOff, Search } from 'lucide-react'
import cliente from '../api/cliente.js'
import Modal from '../components/Modal.jsx'
import Campo from '../components/Campo.jsx'
import Aviso from '../components/Aviso.jsx'
import Confirmacion from '../components/Confirmacion.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import useDebounce from '../hooks/useDebounce.js'
import useAvisoTemporal from '../hooks/useAvisoTemporal.js'

// P-06 Cursos y estándares (CU-04, RF-CUR-01) — Coordinador y Administrador.
// Dos pestañas: Cursos (plantillas de lo que se enseña) y Estándares de competencia (CONOCER).
export default function CursosEstandares() {
  const [parametros, setParametros] = useSearchParams()
  const pestana = parametros.get('pestana') === 'estandares' ? 'estandares' : 'cursos'
  const [aviso, mostrarAviso] = useAvisoTemporal()

  return (
    <>
      <h1 className="titulo-pantalla fila-icono"><BookOpen size={26} strokeWidth={1.75} /> Cursos y estándares</h1>

      <div className="pestanas" role="tablist">
        <button role="tab" aria-selected={pestana === 'cursos'} className={`pestana ${pestana === 'cursos' ? 'pestana--activa' : ''}`}
          onClick={() => setParametros({})}>Cursos</button>
        <button role="tab" aria-selected={pestana === 'estandares'} className={`pestana ${pestana === 'estandares' ? 'pestana--activa' : ''}`}
          onClick={() => setParametros({ pestana: 'estandares' })}>Estándares de competencia</button>
      </div>

      {aviso && <Aviso tipo="exito" titulo={aviso} flotante />}

      {pestana === 'cursos' ? <PestanaCursos onAviso={mostrarAviso} /> : <PestanaEstandares onAviso={mostrarAviso} />}
    </>
  )
}

// =====================================================================
// Pestaña: Cursos
// =====================================================================
function PestanaCursos({ onAviso }) {
  const [estandares, setEstandares] = useState([])
  const [buscar, setBuscar] = useState('')
  const [idEstandar, setIdEstandar] = useState('')
  const [activo, setActivo] = useState('true')
  const buscarRetrasado = useDebounce(buscar)
  const [cursos, setCursos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [formulario, setFormulario] = useState(null)
  const [confirmar, setConfirmar] = useState(null)

  useEffect(() => {
    cliente.get('/estandares').then(({ data }) => setEstandares(data.estandares)).catch(() => {})
  }, [])

  const cargar = useCallback(() => {
    setCargando(true)
    setError('')
    const params = {}
    if (buscarRetrasado) params.buscar = buscarRetrasado
    if (idEstandar) params.idEstandar = idEstandar
    if (activo) params.activo = activo
    cliente.get('/cursos', { params })
      .then(({ data }) => setCursos(data.cursos))
      .catch((err) => setError(err.mensaje))
      .finally(() => setCargando(false))
  }, [buscarRetrasado, idEstandar, activo])

  useEffect(() => { cargar() }, [cargar])

  const alGuardar = (mensaje) => { setFormulario(null); setConfirmar(null); onAviso(mensaje); cargar() }

  return (
    <>
      <div className="barra-acciones">
        <p className="auxiliar">El curso es la plantilla de lo que se enseña. Las fechas, el cupo y la modalidad se definen en cada grupo.</p>
        <button className="boton boton--principal" onClick={() => setFormulario({ valores: { idEstandar: '', nombre: '', descripcion: '' } })}>
          <Plus size={18} /> Registrar curso
        </button>
      </div>

      <div className="filtros">
        <CampoBuscar valor={buscar} onCambio={setBuscar} placeholder="Nombre del curso" />
        <div className="campo">
          <label htmlFor="f-estandar">Estándar</label>
          <select id="f-estandar" value={idEstandar} onChange={(e) => setIdEstandar(e.target.value)}>
            <option value="">Todos</option>
            {estandares.map((e) => <option key={e.id} value={e.id}>{e.codigo} — {e.nombre}</option>)}
          </select>
        </div>
        <FiltroEstado valor={activo} onCambio={setActivo} />
      </div>

      {error ? <Aviso tipo="error" titulo="No se pudo cargar la lista">{error}</Aviso> : (
        <div className="tarjeta tarjeta--tabla">
          {cargando ? <Cargando texto="Cargando cursos…" /> : cursos.length === 0 ? (
            <div className="estado-vacio">
              <p className="subtitulo">No hay cursos con esos filtros</p>
              <p className="auxiliar">Cambie los filtros o registre un curso nuevo.</p>
            </div>
          ) : (
            <table className="tabla">
              <thead><tr><th>Curso</th><th>Estándar</th><th>Grupos vigentes</th><th>Estado</th><th className="tabla__acciones">Acciones</th></tr></thead>
              <tbody>
                {cursos.map((c) => (
                  <tr key={c.id} className={c.activo ? '' : 'tabla__fila--inactiva'}>
                    <td data-etiqueta="Curso">
                      <strong>{c.nombre}</strong>
                      {c.descripcion && <span className="auxiliar bloque recorte">{c.descripcion}</span>}
                    </td>
                    <td data-etiqueta="Estándar">
                      <strong>{c.estandar?.codigo}</strong>
                      <span className="auxiliar bloque recorte">{c.estandar?.nombre}</span>
                    </td>
                    <td data-etiqueta="Grupos vigentes">{c.gruposVigentes}</td>
                    <td data-etiqueta="Estado"><EstadoActivo activo={c.activo} /></td>
                    <td className="tabla__acciones">
                      <BotonAccion icono={Pencil} texto="Editar" onClick={() => setFormulario({ id: c.id, valores: { idEstandar: String(c.idEstandar), nombre: c.nombre, descripcion: c.descripcion || '' } })} />
                      <BotonAccion icono={c.activo ? PowerOff : Power} texto={c.activo ? 'Desactivar' : 'Activar'} onClick={() => setConfirmar(c)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {formulario && (
        <FormularioCurso formulario={formulario} estandares={estandares} onCerrar={() => setFormulario(null)} onGuardado={alGuardar} />
      )}
      {confirmar && (
        <Confirmacion
          titulo={confirmar.activo ? 'Desactivar curso' : 'Activar curso'}
          textoBoton={confirmar.activo ? 'Desactivar curso' : 'Activar curso'}
          peligro={confirmar.activo}
          accion={async () => (await cliente.patch(`/cursos/${confirmar.id}/estado`, { activo: !confirmar.activo })).data.mensaje}
          onCerrar={() => setConfirmar(null)}
          onHecho={alGuardar}
        >
          {confirmar.activo
            ? <>¿Desactivar <strong>{confirmar.nombre}</strong>? Ya no se podrán abrir grupos nuevos de este curso; su información y su historial se conservan.</>
            : <>¿Activar <strong>{confirmar.nombre}</strong>? Se podrán abrir grupos nuevos de este curso.</>}
        </Confirmacion>
      )}
    </>
  )
}

function FormularioCurso({ formulario, estandares, onCerrar, onGuardado }) {
  const esAlta = !formulario.id
  const [valores, setValores] = useState(formulario.valores)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  // Solo se ofrecen estándares activos (y el actual, aunque esté desactivado, para no perderlo al editar)
  const opciones = estandares.filter((e) => e.activo || String(e.id) === formulario.valores.idEstandar)
  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }))

  const guardar = async (evento) => {
    evento.preventDefault()
    setErrorServidor('')
    const e = {}
    if (!valores.idEstandar) e.idEstandar = 'Seleccione el estándar de competencia.'
    if (!valores.nombre.trim()) e.nombre = 'Escriba el nombre del curso.'
    setErrores(e)
    if (Object.keys(e).length) return
    setGuardando(true)
    const cuerpo = { idEstandar: Number(valores.idEstandar), nombre: valores.nombre.trim(), descripcion: valores.descripcion.trim() }
    try {
      const { data } = esAlta ? await cliente.post('/cursos', cuerpo) : await cliente.put(`/cursos/${formulario.id}`, cuerpo)
      onGuardado(data.mensaje)
    } catch (err) {
      setErrores(erroresPorCampo(err))
      setErrorServidor(err.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={esAlta ? 'Registrar curso' : 'Editar curso'} onCerrar={onCerrar}
      pie={<PieFormulario formId="form-curso" guardando={guardando} texto={esAlta ? 'Registrar curso' : 'Guardar cambios'} onCerrar={onCerrar} />}>
      <form id="form-curso" onSubmit={guardar} noValidate>
        {errorServidor && <Aviso tipo="error" titulo="No se pudo guardar">{errorServidor}</Aviso>}
        <Campo id="idEstandar" etiqueta="Estándar de competencia" error={errores.idEstandar}
          ayuda={opciones.length === 0 ? 'Primero registre un estándar en la pestaña "Estándares de competencia".' : undefined}>
          <select id="idEstandar" value={valores.idEstandar} onChange={cambiar('idEstandar')} aria-invalid={Boolean(errores.idEstandar)} autoFocus>
            <option value="">Seleccione un estándar</option>
            {opciones.map((e) => <option key={e.id} value={e.id}>{e.codigo} — {e.nombre}</option>)}
          </select>
        </Campo>
        <Campo id="nombre" etiqueta="Nombre del curso" error={errores.nombre}>
          <input id="nombre" maxLength={150} value={valores.nombre} onChange={cambiar('nombre')} aria-invalid={Boolean(errores.nombre)} />
        </Campo>
        <Campo id="descripcion" etiqueta="Descripción (opcional)" error={errores.descripcion}>
          <textarea id="descripcion" rows={3} maxLength={2000} value={valores.descripcion} onChange={cambiar('descripcion')} />
        </Campo>
      </form>
    </Modal>
  )
}

// =====================================================================
// Pestaña: Estándares de competencia
// =====================================================================
function PestanaEstandares({ onAviso }) {
  const [buscar, setBuscar] = useState('')
  const [activo, setActivo] = useState('true')
  const buscarRetrasado = useDebounce(buscar)
  const [estandares, setEstandares] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [formulario, setFormulario] = useState(null)
  const [confirmar, setConfirmar] = useState(null)

  const cargar = useCallback(() => {
    setCargando(true)
    setError('')
    const params = {}
    if (buscarRetrasado) params.buscar = buscarRetrasado
    if (activo) params.activo = activo
    cliente.get('/estandares', { params })
      .then(({ data }) => setEstandares(data.estandares))
      .catch((err) => setError(err.mensaje))
      .finally(() => setCargando(false))
  }, [buscarRetrasado, activo])

  useEffect(() => { cargar() }, [cargar])

  const alGuardar = (mensaje) => { setFormulario(null); setConfirmar(null); onAviso(mensaje); cargar() }

  return (
    <>
      <div className="barra-acciones">
        <p className="auxiliar">Estándares de competencia de CONOCER con los que CINDEC capacita y evalúa.</p>
        <button className="boton boton--principal" onClick={() => setFormulario({ valores: { codigo: '', nombre: '', descripcion: '' } })}>
          <Plus size={18} /> Registrar estándar
        </button>
      </div>

      <div className="filtros filtros--dos">
        <CampoBuscar valor={buscar} onCambio={setBuscar} placeholder="Código o nombre" />
        <FiltroEstado valor={activo} onCambio={setActivo} />
      </div>

      {error ? <Aviso tipo="error" titulo="No se pudo cargar la lista">{error}</Aviso> : (
        <div className="tarjeta tarjeta--tabla">
          {cargando ? <Cargando texto="Cargando estándares…" /> : estandares.length === 0 ? (
            <div className="estado-vacio">
              <p className="subtitulo">No hay estándares con esos filtros</p>
              <p className="auxiliar">Cambie los filtros o registre un estándar nuevo.</p>
            </div>
          ) : (
            <table className="tabla">
              <thead><tr><th>Código</th><th>Nombre</th><th>Cursos activos</th><th>Estado</th><th className="tabla__acciones">Acciones</th></tr></thead>
              <tbody>
                {estandares.map((e) => (
                  <tr key={e.id} className={e.activo ? '' : 'tabla__fila--inactiva'}>
                    <td data-etiqueta="Código"><strong>{e.codigo}</strong></td>
                    <td data-etiqueta="Nombre">{e.nombre}</td>
                    <td data-etiqueta="Cursos activos">{e.cursosActivos}</td>
                    <td data-etiqueta="Estado"><EstadoActivo activo={e.activo} /></td>
                    <td className="tabla__acciones">
                      <BotonAccion icono={Pencil} texto="Editar" onClick={() => setFormulario({ id: e.id, valores: { codigo: e.codigo, nombre: e.nombre, descripcion: e.descripcion || '' } })} />
                      <BotonAccion icono={e.activo ? PowerOff : Power} texto={e.activo ? 'Desactivar' : 'Activar'} onClick={() => setConfirmar(e)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {formulario && <FormularioEstandar formulario={formulario} onCerrar={() => setFormulario(null)} onGuardado={alGuardar} />}
      {confirmar && (
        <Confirmacion
          titulo={confirmar.activo ? 'Desactivar estándar' : 'Activar estándar'}
          textoBoton={confirmar.activo ? 'Desactivar estándar' : 'Activar estándar'}
          peligro={confirmar.activo}
          accion={async () => (await cliente.patch(`/estandares/${confirmar.id}/estado`, { activo: !confirmar.activo })).data.mensaje}
          onCerrar={() => setConfirmar(null)}
          onHecho={alGuardar}
        >
          {confirmar.activo
            ? <>¿Desactivar el estándar <strong>{confirmar.codigo}</strong>? No se podrán registrar cursos nuevos con él. Si tiene cursos activos, primero hay que desactivarlos.</>
            : <>¿Activar el estándar <strong>{confirmar.codigo}</strong>? Se podrán registrar cursos con él.</>}
        </Confirmacion>
      )}
    </>
  )
}

function FormularioEstandar({ formulario, onCerrar, onGuardado }) {
  const esAlta = !formulario.id
  const [valores, setValores] = useState(formulario.valores)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }))

  const guardar = async (evento) => {
    evento.preventDefault()
    setErrorServidor('')
    const e = {}
    const codigo = valores.codigo.trim().toUpperCase()
    if (!/^EC\d{4}(\.\d{2})?$/.test(codigo)) e.codigo = 'Escriba el código como lo publica CONOCER, por ejemplo EC0301 o EC0110.02.'
    if (!valores.nombre.trim()) e.nombre = 'Escriba el nombre del estándar.'
    setErrores(e)
    if (Object.keys(e).length) return
    setGuardando(true)
    const cuerpo = { codigo, nombre: valores.nombre.trim(), descripcion: valores.descripcion.trim() }
    try {
      const { data } = esAlta ? await cliente.post('/estandares', cuerpo) : await cliente.put(`/estandares/${formulario.id}`, cuerpo)
      onGuardado(data.mensaje)
    } catch (err) {
      setErrores(erroresPorCampo(err))
      setErrorServidor(err.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={esAlta ? 'Registrar estándar de competencia' : 'Editar estándar de competencia'} onCerrar={onCerrar}
      pie={<PieFormulario formId="form-estandar" guardando={guardando} texto={esAlta ? 'Registrar estándar' : 'Guardar cambios'} onCerrar={onCerrar} />}>
      <form id="form-estandar" onSubmit={guardar} noValidate>
        {errorServidor && <Aviso tipo="error" titulo="No se pudo guardar">{errorServidor}</Aviso>}
        <Campo id="codigo" etiqueta="Código" error={errores.codigo} ayuda="Como aparece en el Registro Nacional de Estándares de Competencia, por ejemplo EC0301.">
          <input id="codigo" maxLength={20} value={valores.codigo} onChange={cambiar('codigo')} aria-invalid={Boolean(errores.codigo)} autoFocus />
        </Campo>
        <Campo id="nombre" etiqueta="Nombre del estándar" error={errores.nombre}>
          <input id="nombre" maxLength={255} value={valores.nombre} onChange={cambiar('nombre')} aria-invalid={Boolean(errores.nombre)} />
        </Campo>
        <Campo id="descripcion" etiqueta="Descripción (opcional)" error={errores.descripcion}>
          <textarea id="descripcion" rows={3} maxLength={2000} value={valores.descripcion} onChange={cambiar('descripcion')} />
        </Campo>
      </form>
    </Modal>
  )
}

// =====================================================================
// Piezas pequeñas compartidas por las dos pestañas
// =====================================================================
function CampoBuscar({ valor, onCambio, placeholder }) {
  return (
    <div className="campo">
      <label htmlFor="buscar">Buscar</label>
      <div className="campo__con-icono">
        <Search size={18} />
        <input id="buscar" placeholder={placeholder} value={valor} onChange={(e) => onCambio(e.target.value)} />
      </div>
    </div>
  )
}

function FiltroEstado({ valor, onCambio }) {
  return (
    <div className="campo">
      <label htmlFor="f-estado">Estado</label>
      <select id="f-estado" value={valor} onChange={(e) => onCambio(e.target.value)}>
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Desactivados</option>
      </select>
    </div>
  )
}

const EstadoActivo = ({ activo }) => activo
  ? <EtiquetaEstatus tono="exito">Activo</EtiquetaEstatus>
  : <EtiquetaEstatus>Desactivado</EtiquetaEstatus>

const BotonAccion = ({ icono: Icono, texto, onClick }) => (
  <button className="boton boton--secundario boton--chico boton--accion" title={texto} aria-label={texto} onClick={onClick}>
    <Icono size={16} /><span className="texto-boton">{texto}</span>
  </button>
)

const Cargando = ({ texto }) => <p className="fila-icono auxiliar relleno"><LoaderCircle size={20} className="girando" /> {texto}</p>

const PieFormulario = ({ formId, guardando, texto, onCerrar }) => (
  <>
    <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
    <button type="submit" form={formId} className="boton boton--principal" disabled={guardando}>
      {guardando ? <><LoaderCircle size={18} className="girando" /> Guardando…</> : texto}
    </button>
  </>
)

// Convierte los errores por campo que devuelve la API en { campo: mensaje }.
function erroresPorCampo(err) {
  const detalles = err.response?.data?.detalles
  const porCampo = {}
  if (Array.isArray(detalles)) detalles.forEach((d) => { if (d.campo) porCampo[d.campo] = d.mensaje })
  return porCampo
}
