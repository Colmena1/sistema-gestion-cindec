import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Award, LoaderCircle, Plus, Search } from 'lucide-react'
import cliente from '../api/cliente.js'
import Aviso from '../components/Aviso.jsx'
import Campo from '../components/Campo.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import Modal from '../components/Modal.jsx'
import useDebounce from '../hooks/useDebounce.js'
import { ESTATUS_TRAMITE, ORDEN_TRAMITE, calificacion, fecha } from '../utils/formato.js'

// P-13 Trámites de certificación (CU-17; RF-CERT-02, 05) — Coordinador y Administrador.
// Filtra por estatus, participante o folio y fechas de solicitud.
export default function Tramites() {
  const navegar = useNavigate()
  const [parametros, setParametros] = useSearchParams()
  const estatus = parametros.get('estatus') || ''
  const [buscar, setBuscar] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const buscarRetrasado = useDebounce(buscar)
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [iniciando, setIniciando] = useState(false)

  const cargar = useCallback(() => {
    const params = {}
    if (estatus) params.estatus = estatus
    if (buscarRetrasado) params.buscar = buscarRetrasado
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta
    cliente.get('/tramites', { params })
      .then(({ data }) => { setDatos(data); setError('') })
      .catch((err) => setError(err.mensaje))
  }, [estatus, buscarRetrasado, desde, hasta])
  useEffect(() => { cargar() }, [cargar])

  const total = datos ? Object.values(datos.porEstatus).reduce((a, b) => a + b, 0) : 0

  return (
    <>
      <div className="encabezado-pantalla">
        <h1 className="titulo-pantalla fila-icono"><Award size={26} strokeWidth={1.75} /> Trámites de certificación</h1>
        <button className="boton boton--principal" onClick={() => setIniciando(true)}><Plus size={18} /> Iniciar trámite</button>
      </div>

      <div className="pestanas" role="tablist">
        <button role="tab" aria-selected={!estatus} className={`pestana ${!estatus ? 'pestana--activa' : ''}`} onClick={() => setParametros({})}>
          Todos{datos && ` (${total})`}
        </button>
        {ORDEN_TRAMITE.map((e) => (
          <button key={e} role="tab" aria-selected={estatus === e} className={`pestana ${estatus === e ? 'pestana--activa' : ''}`} onClick={() => setParametros({ estatus: e })}>
            {ESTATUS_TRAMITE[e].texto}{datos && ` (${datos.porEstatus[e]})`}
          </button>
        ))}
      </div>

      <div className="filtros">
        <div className="campo">
          <label htmlFor="buscar">Buscar</label>
          <div className="campo__con-icono">
            <Search size={18} />
            <input id="buscar" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Participante, CURP o folio" />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="desde">Solicitado desde</label>
          <input id="desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="hasta">Hasta</label>
          <input id="hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      {error ? <Aviso tipo="error" titulo="No se pudo cargar la lista">{error}</Aviso> : (
        <div className="tarjeta tarjeta--tabla">
          {!datos ? <p className="fila-icono auxiliar" style={{ padding: 16 }}><LoaderCircle size={20} className="girando" /> Cargando…</p>
            : datos.tramites.length === 0 ? (
              <div className="estado-vacio">
                <p className="subtitulo">No hay trámites con esos filtros</p>
                <p className="auxiliar">Inicie un trámite para cada participante con juicio de competencia "competente".</p>
              </div>
            ) : (
              <table className="tabla tabla--clic tabla--compacta">
                <thead><tr><th>Folio</th><th>Participante</th><th>Estándar</th><th>Solicitud</th><th>Estatus</th></tr></thead>
                <tbody>
                  {datos.tramites.map((t) => (
                    <tr key={t.id} onClick={() => navegar(`/tramites/${t.id}`)}>
                      <td data-etiqueta="Folio"><strong className="enlace-tabla">{t.folioInterno}</strong>{t.documento && <span className="auxiliar bloque">CONOCER {t.documento.folioConocer}</span>}</td>
                      <td data-etiqueta="Participante"><strong>{t.participante.nombre}</strong><span className="auxiliar bloque">Grupo {t.grupo}</span></td>
                      <td data-etiqueta="Estándar"><strong>{t.estandar.codigo}</strong><span className="auxiliar bloque recorte">{t.estandar.nombre}</span></td>
                      <td data-etiqueta="Solicitud">{fecha(t.fechaSolicitud)}</td>
                      <td data-etiqueta="Estatus"><EtiquetaEstatus tono={ESTATUS_TRAMITE[t.estatus].tono}>{ESTATUS_TRAMITE[t.estatus].texto}</EtiquetaEstatus></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      )}

      {iniciando && <IniciarTramite onCerrar={() => setIniciando(false)} onCreado={(id) => navegar(`/tramites/${id}`)} />}
    </>
  )
}

// Elige a un participante competente sin trámite (CU-17: solo nace de un juicio "competente")
function IniciarTramite({ onCerrar, onCreado }) {
  const [candidatos, setCandidatos] = useState(null)
  const [elegido, setElegido] = useState(null)
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cliente.get('/tramites/candidatos').then(({ data }) => setCandidatos(data.candidatos)).catch((err) => setError(err.mensaje))
  }, [])

  const crear = async () => {
    if (!elegido) { setError('Seleccione al participante.'); return }
    setGuardando(true)
    setError('')
    try {
      const { data } = await cliente.post('/tramites', { idIntento: elegido, observaciones: observaciones.trim() || null })
      onCreado(data.tramite.id)
    } catch (err) {
      setError(err.mensaje)
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Iniciar trámite de certificación" onCerrar={onCerrar} pie={<>
      <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button className="boton boton--principal" onClick={crear} disabled={guardando || !candidatos?.length}>
        {guardando ? <><LoaderCircle size={18} className="girando" /> Iniciando…</> : 'Iniciar trámite'}
      </button>
    </>}>
      {error && <Aviso tipo="error" titulo="No se pudo iniciar">{error}</Aviso>}
      <p className="auxiliar">Solo aparecen participantes con juicio de competencia <strong>competente</strong> que todavía no tienen trámite.</p>
      {!candidatos && !error && <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando…</p>}
      {candidatos?.length === 0 && (
        <div className="estado-vacio"><p className="subtitulo">No hay participantes pendientes de trámite</p><p className="auxiliar">Cuando un evaluador emita un juicio "competente", aparecerá aquí.</p></div>
      )}
      {candidatos?.length > 0 && (
        <ul className="lista-seleccion">
          {candidatos.map((c) => (
            <li key={c.idIntento}>
              <button type="button" className={`lista-seleccion__opcion ${elegido === c.idIntento ? 'lista-seleccion__opcion--elegida' : ''}`} onClick={() => setElegido(c.idIntento)}>
                <span><strong>{c.participante}</strong><span className="auxiliar bloque">{c.estandar} · {c.curso} · Grupo {c.grupo}</span></span>
                <span className="auxiliar">Competente · {calificacion(c.calificacion)} · {fecha(c.fechaDictamen)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {candidatos?.length > 0 && (
        <Campo id="obs-tramite" etiqueta="Observaciones (opcional)">
          <input id="obs-tramite" maxLength={1000} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Por ejemplo: expediente completo" />
        </Campo>
      )}
    </Modal>
  )
}
