import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, Eye, LoaderCircle, PlayCircle } from 'lucide-react'
import cliente from '../api/cliente.js'
import Aviso from '../components/Aviso.jsx'
import Campo from '../components/Campo.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import Modal from '../components/Modal.jsx'
import { DICTAMEN, ESTATUS_GRUPO, ESTATUS_INSCRIPCION, ESTATUS_INTENTO, calificacion, fecha } from '../utils/formato.js'

// P-19 Por evaluar (CU-15; RF-EVA-02, 03) — Evaluador.
// Los grupos que tiene asignados y, en cada uno, sus participantes con el estado de su evaluación.
export default function PorEvaluar() {
  const navegar = useNavigate()
  const [grupos, setGrupos] = useState(null)
  const [error, setError] = useState('')
  const [errorAccion, setErrorAccion] = useState('')
  const [iniciando, setIniciando] = useState(null) // idInscripcion en proceso
  const [elegir, setElegir] = useState(null) // { grupo, participante } cuando hay varios instrumentos

  useEffect(() => {
    cliente.get('/por-evaluar').then(({ data }) => setGrupos(data.grupos)).catch((err) => setError(err.mensaje))
  }, [])

  const iniciar = async (participante, idEvaluacion) => {
    setErrorAccion('')
    setIniciando(participante.idInscripcion)
    try {
      const { data } = await cliente.post('/intentos', { idInscripcion: participante.idInscripcion, idEvaluacion: idEvaluacion || null })
      navegar(`/por-evaluar/intento/${data.intento.id}`)
    } catch (err) {
      setErrorAccion(err.mensaje)
      setIniciando(null)
      setElegir(null)
    }
  }
  const alIniciar = (grupo, participante) => {
    if (grupo.instrumentos.length > 1) setElegir({ grupo, participante })
    else iniciar(participante)
  }

  return (
    <>
      <h1 className="titulo-pantalla fila-icono"><ClipboardCheck size={26} strokeWidth={1.75} /> Por evaluar</h1>
      {error && <Aviso tipo="error" titulo="No se pudieron cargar sus grupos">{error}</Aviso>}
      {errorAccion && <div style={{ marginBottom: 16 }}><Aviso tipo="error" titulo="No se pudo iniciar la evaluación" onCerrar={() => setErrorAccion('')}>{errorAccion}</Aviso></div>}
      {!grupos && !error && <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando…</p>}
      {grupos && grupos.length === 0 && (
        <div className="tarjeta estado-vacio">
          <p className="subtitulo">Todavía no tiene grupos asignados</p>
          <p className="auxiliar">Cuando la coordinación lo asigne como evaluador de un grupo, aparecerá aquí.</p>
        </div>
      )}

      {grupos?.map((g) => (
        <section key={g.id} className="tarjeta tarjeta--tabla seccion-detalle">
          <div className="seccion-detalle__cabecera">
            <div>
              <h2 className="subtitulo">{g.clave} · {g.curso}</h2>
              <p className="auxiliar">
                {g.estandar} · {fecha(g.fechaInicio)} al {fecha(g.fechaFin)}
                {g.instrumentos.length === 1 && ` · ${g.instrumentos[0].tipoTexto}, mínima ${calificacion(g.instrumentos[0].calificacionMinima)}`}
              </p>
            </div>
            <EtiquetaEstatus tono={ESTATUS_GRUPO[g.estatus].tono}>{ESTATUS_GRUPO[g.estatus].texto}</EtiquetaEstatus>
          </div>
          {g.instrumentos.length === 0 && g.participantes.some((p) => p.puedeIniciar) && (
            <div className="relleno-lateral">
              <Aviso tipo="info" titulo="Sin instrumento de evaluación">La coordinación todavía no registra el instrumento del estándar {g.estandar}; pídale que lo dé de alta para poder evaluar.</Aviso>
            </div>
          )}
          {g.participantes.length === 0 ? (
            <div className="estado-vacio"><p className="auxiliar">El grupo todavía no tiene participantes inscritos.</p></div>
          ) : (
            <table className="tabla tabla--compacta">
              <thead><tr><th>Participante</th><th>Capacitación</th><th>Último resultado</th><th className="tabla__acciones">Acción</th></tr></thead>
              <tbody>
                {g.participantes.map((p) => (
                  <tr key={p.idInscripcion}>
                    <td data-etiqueta="Participante"><strong>{p.nombre}</strong></td>
                    <td data-etiqueta="Capacitación">
                      <EtiquetaEstatus tono={ESTATUS_INSCRIPCION[p.estatusInscripcion].tono}>{ESTATUS_INSCRIPCION[p.estatusInscripcion].texto}</EtiquetaEstatus>
                    </td>
                    <td data-etiqueta="Último resultado">
                      {p.ultimo ? (
                        <div className="celda-etiquetas">
                          <EtiquetaEstatus tono={ESTATUS_INTENTO[p.ultimo.estatus].tono}>
                            Intento {p.ultimo.numero} · {ESTATUS_INTENTO[p.ultimo.estatus].texto}{p.ultimo.calificacion !== null && ` (${calificacion(p.ultimo.calificacion)})`}
                          </EtiquetaEstatus>
                          {p.ultimo.dictamen && <EtiquetaEstatus tono={DICTAMEN[p.ultimo.dictamen].tono}>{DICTAMEN[p.ultimo.dictamen].texto}</EtiquetaEstatus>}
                        </div>
                      ) : <span className="auxiliar">Sin evaluar</span>}
                    </td>
                    <td className="tabla__acciones">
                      <Accion grupo={g} p={p} iniciando={iniciando === p.idInscripcion}
                        onIniciar={() => alIniciar(g, p)} onAbrir={(id) => navegar(`/por-evaluar/intento/${id}`)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}

      {elegir && (
        <ElegirInstrumento grupo={elegir.grupo} participante={elegir.participante} enviando={iniciando !== null}
          onCerrar={() => setElegir(null)} onElegir={(idEvaluacion) => iniciar(elegir.participante, idEvaluacion)} />
      )}
    </>
  )
}

function Accion({ grupo, p, iniciando, onIniciar, onAbrir }) {
  if (p.idPendiente) {
    return <button className="boton boton--principal boton--chico" onClick={() => onAbrir(p.idPendiente)}><PlayCircle size={16} /> Continuar</button>
  }
  if (p.puedeIniciar && grupo.instrumentos.length > 0) {
    return (
      <button className="boton boton--principal boton--chico" onClick={onIniciar} disabled={iniciando}>
        {iniciando ? <LoaderCircle size={16} className="girando" /> : <PlayCircle size={16} />} {p.intentos ? 'Nuevo intento' : 'Evaluar'}
      </button>
    )
  }
  if (p.ultimo) return <button className="boton boton--secundario boton--chico" onClick={() => onAbrir(p.ultimo.id)}><Eye size={16} /> Ver</button>
  if (p.estatusInscripcion === 'inscrito') return <span className="auxiliar">En capacitación</span>
  return <span className="auxiliar">—</span>
}

function ElegirInstrumento({ grupo, participante, enviando, onCerrar, onElegir }) {
  const [id, setId] = useState(String(grupo.instrumentos[0].id))
  return (
    <Modal titulo="Elegir instrumento" onCerrar={onCerrar} pie={<>
      <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button className="boton boton--principal" onClick={() => onElegir(Number(id))} disabled={enviando}>
        {enviando ? <><LoaderCircle size={18} className="girando" /> Iniciando…</> : 'Iniciar evaluación'}
      </button>
    </>}>
      <p>El estándar {grupo.estandar} tiene varios instrumentos activos. ¿Con cuál evaluará a <strong>{participante.nombre}</strong>?</p>
      <Campo id="instrumento" etiqueta="Instrumento">
        <select id="instrumento" value={id} onChange={(e) => setId(e.target.value)} autoFocus>
          {grupo.instrumentos.map((i) => <option key={i.id} value={i.id}>{i.nombre} · {i.tipoTexto} · mínima {calificacion(i.calificacionMinima)}</option>)}
        </select>
      </Campo>
    </Modal>
  )
}
