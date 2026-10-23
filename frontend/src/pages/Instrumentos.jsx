import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, LoaderCircle, Pencil, Plus, Power, PowerOff } from 'lucide-react'
import cliente from '../api/cliente.js'
import Aviso from '../components/Aviso.jsx'
import Campo from '../components/Campo.jsx'
import Confirmacion from '../components/Confirmacion.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import Modal from '../components/Modal.jsx'
import useAvisoTemporal from '../hooks/useAvisoTemporal.js'
import { TIPO_INSTRUMENTO, calificacion, erroresPorCampo } from '../utils/formato.js'

// P-12 Instrumentos de evaluación (CU-14; RF-EVA-01 y 04) — Coordinador y Administrador.
// Cada estándar tiene su instrumento con su propia calificación mínima.
export default function Instrumentos() {
  const [estandares, setEstandares] = useState([])
  const [idEstandar, setIdEstandar] = useState('')
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')
  const [aviso, mostrarAviso] = useAvisoTemporal()
  const [formulario, setFormulario] = useState(null)
  const [confirmar, setConfirmar] = useState(null)

  useEffect(() => {
    cliente.get('/estandares').then(({ data }) => setEstandares(data.estandares)).catch(() => {})
  }, [])

  const cargar = useCallback(() => {
    cliente.get('/evaluaciones', { params: idEstandar ? { idEstandar } : {} })
      .then(({ data }) => { setLista(data.instrumentos); setError('') })
      .catch((err) => setError(err.mensaje))
  }, [idEstandar])
  useEffect(() => { cargar() }, [cargar])

  const alGuardar = (mensaje) => { setFormulario(null); setConfirmar(null); mostrarAviso(mensaje); cargar() }
  const conInstrumento = new Set((lista || []).filter((i) => i.activa).map((i) => i.idEstandar))
  const sinInstrumento = estandares.filter((e) => e.activo && !conInstrumento.has(e.id))

  return (
    <>
      <div className="encabezado-pantalla">
        <h1 className="titulo-pantalla fila-icono"><ClipboardList size={26} strokeWidth={1.75} /> Instrumentos de evaluación</h1>
        <button className="boton boton--principal" onClick={() => setFormulario({})}><Plus size={18} /> Registrar instrumento</button>
      </div>
      {aviso && <Aviso tipo="exito" titulo={aviso} flotante />}

      <p className="auxiliar" style={{ marginTop: -12, marginBottom: 16 }}>
        El instrumento pertenece al estándar: lo usan todos sus cursos y grupos. La calificación mínima decide si la evaluación queda aprobada.
      </p>
      {!idEstandar && lista && sinInstrumento.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Aviso tipo="info" titulo="Estándares sin instrumento activo">
            {sinInstrumento.map((e) => e.codigo).join(', ')}: sus participantes no se pueden evaluar hasta que registre su instrumento.
          </Aviso>
        </div>
      )}

      <div className="filtros filtros--uno">
        <div className="campo">
          <label htmlFor="f-estandar">Estándar</label>
          <select id="f-estandar" value={idEstandar} onChange={(e) => setIdEstandar(e.target.value)}>
            <option value="">Todos</option>
            {estandares.map((e) => <option key={e.id} value={e.id}>{e.codigo} — {e.nombre}</option>)}
          </select>
        </div>
      </div>

      {error ? <Aviso tipo="error" titulo="No se pudo cargar la lista">{error}</Aviso> : (
        <div className="tarjeta tarjeta--tabla">
          {!lista ? <p className="fila-icono auxiliar" style={{ padding: 16 }}><LoaderCircle size={20} className="girando" /> Cargando…</p> : lista.length === 0 ? (
            <div className="estado-vacio">
              <p className="subtitulo">No hay instrumentos registrados</p>
              <p className="auxiliar">Registre el instrumento de cada estándar para poder evaluar a sus participantes.</p>
            </div>
          ) : (
            <table className="tabla tabla--compacta">
              <thead><tr><th>Instrumento</th><th>Estándar</th><th>Tipo y mínima</th><th>Intentos</th><th>Estado</th><th className="tabla__acciones">Acciones</th></tr></thead>
              <tbody>
                {lista.map((i) => (
                  <tr key={i.id} className={i.activa ? '' : 'tabla__fila--inactiva'}>
                    <td data-etiqueta="Instrumento"><strong>{i.nombre}</strong>{i.descripcion && <span className="auxiliar bloque recorte">{i.descripcion}</span>}</td>
                    <td data-etiqueta="Estándar"><strong>{i.estandar.codigo}</strong><span className="auxiliar bloque recorte">{i.estandar.nombre}</span></td>
                    <td data-etiqueta="Tipo y mínima">{i.tipoTexto}<span className="auxiliar bloque">Mínima <strong>{calificacion(i.calificacionMinima)}</strong></span></td>
                    <td data-etiqueta="Intentos">
                      {i.calificados} calificados{i.pendientes > 0 && <span className="auxiliar bloque">{i.pendientes} pendientes</span>}
                    </td>
                    <td data-etiqueta="Estado">{i.activa ? <EtiquetaEstatus tono="exito">Activo</EtiquetaEstatus> : <EtiquetaEstatus>Desactivado</EtiquetaEstatus>}</td>
                    <td className="tabla__acciones">
                      <button className="boton boton--secundario boton--chico boton--accion" title="Editar" aria-label={`Editar ${i.nombre}`} onClick={() => setFormulario(i)}>
                        <Pencil size={16} /><span className="texto-boton">Editar</span>
                      </button>
                      <button className="boton boton--secundario boton--chico boton--accion" title={i.activa ? 'Desactivar' : 'Activar'} aria-label={`${i.activa ? 'Desactivar' : 'Activar'} ${i.nombre}`} onClick={() => setConfirmar(i)}>
                        {i.activa ? <PowerOff size={16} /> : <Power size={16} />}<span className="texto-boton">{i.activa ? 'Desactivar' : 'Activar'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {formulario && <FormularioInstrumento instrumento={formulario.id ? formulario : null} estandares={estandares} onCerrar={() => setFormulario(null)} onGuardado={alGuardar} />}
      {confirmar && (
        <Confirmacion titulo={confirmar.activa ? 'Desactivar instrumento' : 'Activar instrumento'}
          textoBoton={confirmar.activa ? 'Desactivar' : 'Activar'} peligro={confirmar.activa}
          accion={async () => (await cliente.patch(`/evaluaciones/${confirmar.id}/estado`, { activa: !confirmar.activa })).data.mensaje}
          onCerrar={() => setConfirmar(null)} onHecho={alGuardar}>
          {confirmar.activa
            ? <>¿Desactivar <strong>{confirmar.nombre}</strong>? Ya no se podrá usar en intentos nuevos; los resultados registrados se conservan.</>
            : <>¿Activar <strong>{confirmar.nombre}</strong>? Los evaluadores podrán usarlo en intentos nuevos.</>}
        </Confirmacion>
      )}
    </>
  )
}

function FormularioInstrumento({ instrumento, estandares, onCerrar, onGuardado }) {
  const esAlta = !instrumento
  const bloqueado = !esAlta && instrumento.calificados > 0 // ya hay resultados: solo nombre y descripción
  const [v, setV] = useState({
    idEstandar: instrumento ? String(instrumento.idEstandar) : '',
    nombre: instrumento?.nombre || '',
    descripcion: instrumento?.descripcion || '',
    tipo: instrumento?.tipo || 'guia_observacion',
    calificacionMinima: instrumento ? String(instrumento.calificacionMinima) : '',
  })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const cambiar = (campo) => (e) => setV((x) => ({ ...x, [campo]: e.target.value }))

  const guardar = async (evento) => {
    evento.preventDefault()
    setErrorServidor('')
    const e = {}
    if (!v.idEstandar) e.idEstandar = 'Seleccione el estándar de competencia.'
    if (!v.nombre.trim()) e.nombre = 'Escriba el nombre del instrumento.'
    const minima = Number(v.calificacionMinima)
    if (v.calificacionMinima === '' || !(minima >= 0 && minima <= 100)) e.calificacionMinima = 'Escriba un número de 0 a 100.'
    else if (!/^\d{1,3}(\.\d{1,2})?$/.test(v.calificacionMinima.trim())) e.calificacionMinima = 'Use como máximo dos decimales.'
    setErrores(e)
    if (Object.keys(e).length) return
    const cuerpo = { nombre: v.nombre.trim(), descripcion: v.descripcion.trim() || null }
    if (!bloqueado) Object.assign(cuerpo, { idEstandar: Number(v.idEstandar), tipo: v.tipo, calificacionMinima: minima })
    setGuardando(true)
    try {
      const { data } = esAlta ? await cliente.post('/evaluaciones', cuerpo) : await cliente.put(`/evaluaciones/${instrumento.id}`, cuerpo)
      onGuardado(data.mensaje)
    } catch (err) {
      setErrores(erroresPorCampo(err))
      setErrorServidor(err.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={esAlta ? 'Registrar instrumento' : 'Editar instrumento'} onCerrar={onCerrar} pie={<>
      <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button type="submit" form="form-instrumento" className="boton boton--principal" disabled={guardando}>
        {guardando ? <><LoaderCircle size={18} className="girando" /> Guardando…</> : esAlta ? 'Registrar instrumento' : 'Guardar cambios'}
      </button>
    </>}>
      <form id="form-instrumento" onSubmit={guardar} noValidate>
        {errorServidor && <Aviso tipo="error" titulo="No se pudo guardar">{errorServidor}</Aviso>}
        {bloqueado && <div style={{ marginBottom: 12 }}><Aviso tipo="info" titulo="Ya tiene resultados registrados">Solo puede cambiar el nombre y la descripción. Si el criterio cambió, desactívelo y registre uno nuevo.</Aviso></div>}
        <Campo id="idEstandar" etiqueta="Estándar de competencia" error={errores.idEstandar}>
          <select id="idEstandar" value={v.idEstandar} onChange={cambiar('idEstandar')} disabled={bloqueado} aria-invalid={Boolean(errores.idEstandar)} autoFocus={esAlta}>
            <option value="">Seleccione un estándar</option>
            {estandares.filter((e) => e.activo || String(e.id) === v.idEstandar).map((e) => <option key={e.id} value={e.id}>{e.codigo} — {e.nombre}</option>)}
          </select>
        </Campo>
        <Campo id="nombre" etiqueta="Nombre del instrumento" error={errores.nombre}>
          <input id="nombre" maxLength={150} value={v.nombre} onChange={cambiar('nombre')} placeholder="Por ejemplo: Evaluación EC0301" aria-invalid={Boolean(errores.nombre)} />
        </Campo>
        <div className="dos-columnas">
          <Campo id="tipo" etiqueta="Tipo de instrumento">
            <select id="tipo" value={v.tipo} onChange={cambiar('tipo')} disabled={bloqueado}>
              {Object.entries(TIPO_INSTRUMENTO).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
            </select>
          </Campo>
          <Campo id="calificacionMinima" etiqueta="Calificación mínima (0 a 100)" error={errores.calificacionMinima} ayuda="Igual o mayor = aprobada.">
            <input id="calificacionMinima" type="number" min={0} max={100} step="0.01" inputMode="decimal" value={v.calificacionMinima}
              onChange={cambiar('calificacionMinima')} disabled={bloqueado} aria-invalid={Boolean(errores.calificacionMinima)} />
          </Campo>
        </div>
        <Campo id="descripcion" etiqueta="Descripción (opcional)" error={errores.descripcion}>
          <textarea id="descripcion" rows={3} maxLength={2000} value={v.descripcion} onChange={cambiar('descripcion')}
            placeholder="Qué se evalúa y cómo se aplica" />
        </Campo>
      </form>
    </Modal>
  )
}
