import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileCheck2, LoaderCircle } from 'lucide-react'
import cliente from '../api/cliente.js'
import { descargarCertificado } from '../api/certificados.js'
import Aviso from '../components/Aviso.jsx'
import Campo from '../components/Campo.jsx'
import CampoArchivo from '../components/CampoArchivo.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import Modal from '../components/Modal.jsx'
import useAvisoTemporal from '../hooks/useAvisoTemporal.js'
import { ESTATUS_TRAMITE, ORDEN_TRAMITE, erroresPorCampo, fecha, fechaHora } from '../utils/formato.js'

// P-14 Detalle del trámite (CU-17 + CU-18; RF-CERT-02 a 05) — mockup M14, figura 15.
// Avanza el estatus en orden, resguarda el PDF de CONOCER (pasa a Emitido) y muestra el historial.
const PASO = {
  pagado: { boton: 'Marcar como pagado', ayuda: 'Por ejemplo: comprobante de pago recibido.' },
  en_tramite: { boton: 'Marcar en trámite ante CONOCER', ayuda: 'Por ejemplo: expediente enviado a CONOCER.' },
}

export default function TramiteDetalle() {
  const { id } = useParams()
  const [t, setT] = useState(null)
  const [error, setError] = useState('')
  const [aviso, mostrarAviso] = useAvisoTemporal(7000)
  const [avanzando, setAvanzando] = useState(false)
  const [errorDescarga, setErrorDescarga] = useState('')

  const cargar = useCallback(() => {
    cliente.get(`/tramites/${id}`).then(({ data }) => { setT(data.tramite); setError('') }).catch((err) => setError(err.mensaje))
  }, [id])
  useEffect(() => { cargar() }, [cargar])

  const volver = <Link to="/tramites" className="enlace-volver"><ArrowLeft size={18} /> Trámites</Link>
  if (error && !t) return <>{volver}<div style={{ marginTop: 16 }}><Aviso tipo="error" titulo="No se pudo abrir el trámite">{error}</Aviso></div></>
  if (!t) return <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando trámite…</p>

  const est = ESTATUS_TRAMITE[t.estatus]
  // Fecha de cada paso: la del historial (el más antiguo de ese estatus)
  const fechaPaso = Object.fromEntries([...t.historial].reverse().map((h) => [h.estatus, h]))
  const indice = ORDEN_TRAMITE.indexOf(t.estatus)
  const alAvanzar = (mensaje) => { setAvanzando(false); mostrarAviso(mensaje); cargar() }
  const descargar = async () => {
    setErrorDescarga('')
    try { await descargarCertificado(t.id) } catch (err) { setErrorDescarga(err.mensaje) }
  }

  return (
    <>
      {volver}
      <div className="encabezado-pantalla encabezado-pantalla--detalle">
        <div>
          <h1 className="titulo-pantalla fila-icono">Trámite {t.folioInterno} <EtiquetaEstatus tono={est.tono}>{est.texto}</EtiquetaEstatus></h1>
          <p className="auxiliar">
            <Link to={`/participantes/${t.participante.id}`} className="enlace-tabla">{t.participante.nombre}</Link> · {t.estandar.codigo} {t.estandar.nombre} ·
            Juicio de competencia: <strong className="texto-exito">Competente</strong> ({fecha(t.dictamen.fecha)}, <Link to={`/por-evaluar/intento/${t.dictamen.idIntento}`} className="enlace-tabla">intento {t.dictamen.numeroIntento}</Link>)
          </p>
        </div>
        {t.siguiente && <button className="boton boton--principal" onClick={() => setAvanzando(true)}>{PASO[t.siguiente].boton}</button>}
      </div>
      {aviso && <Aviso tipo="exito" titulo={aviso} flotante />}

      <section className="tarjeta seccion-detalle">
        <h2 className="subtitulo">Avance del trámite</h2>
        <ol className="avance-tramite">
          {ORDEN_TRAMITE.map((e, n) => {
            const h = fechaPaso[e]
            const hecho = n <= indice
            return (
              <li key={e} className={hecho ? 'avance-tramite__paso--hecho' : ''}>
                <strong>{ESTATUS_TRAMITE[e].texto}</strong>
                <span className="auxiliar">
                  {h ? `${fechaHora(h.fecha).slice(0, 10)}${h.observaciones && e !== 'emitido' ? ` · ${h.observaciones}` : ''}` : e === 'emitido' ? 'Al resguardar el certificado' : 'Pendiente'}
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      {t.estatus === 'en_tramite' && <ResguardarDocumento tramite={t} onGuardado={(m) => { mostrarAviso(m); cargar() }} />}

      {t.documento && (
        <section className="tarjeta seccion-detalle">
          <div className="seccion-detalle__cabecera" style={{ padding: 0, marginBottom: 16 }}>
            <h2 className="subtitulo fila-icono"><FileCheck2 size={22} /> Documento oficial de CONOCER</h2>
            <button className="boton boton--secundario" onClick={descargar}><Download size={18} /> Descargar PDF</button>
          </div>
          {errorDescarga && <div style={{ marginBottom: 16 }}><Aviso tipo="error" titulo="No se pudo descargar" onCerrar={() => setErrorDescarga('')}>{errorDescarga}</Aviso></div>}
          <div className="datos-grupo" style={{ marginBottom: 0 }}>
            <Dato etiqueta="Folio CONOCER" valor={t.documento.folioConocer} />
            <Dato etiqueta="Tipo de documento" valor={t.documento.tipoDocumento} />
            <Dato etiqueta="Fecha de emisión" valor={fecha(t.documento.fechaEmision)} />
            <Dato etiqueta="Vigencia" valor={t.documento.vigencia ? fecha(t.documento.vigencia) : 'Sin vencimiento'} />
            <Dato etiqueta="Entidad de certificación" valor={t.documento.entidad} />
          </div>
        </section>
      )}

      <section className="tarjeta tarjeta--tabla seccion-detalle">
        <div className="seccion-detalle__cabecera"><h2 className="subtitulo">Historial</h2></div>
        <ul className="historial-tramite">
          {t.historial.map((h) => (
            <li key={h.id}>
              <EtiquetaEstatus tono={ESTATUS_TRAMITE[h.estatus].tono}>{ESTATUS_TRAMITE[h.estatus].texto}</EtiquetaEstatus>
              <span className="historial-tramite__texto">{h.observaciones || ''}</span>
              <span className="auxiliar">{fechaHora(h.fecha)}</span>
            </li>
          ))}
        </ul>
      </section>

      {avanzando && <Avanzar tramite={t} onCerrar={() => setAvanzando(false)} onHecho={alAvanzar} />}
    </>
  )
}

const Dato = ({ etiqueta, valor }) => (
  <div className="dato"><span className="auxiliar">{etiqueta}</span><strong>{valor}</strong></div>
)

function Avanzar({ tramite, onCerrar, onHecho }) {
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const paso = PASO[tramite.siguiente]

  const confirmar = async () => {
    setEnviando(true)
    setError('')
    try {
      const { data } = await cliente.post(`/tramites/${tramite.id}/estatus`, { estatus: tramite.siguiente, observaciones: observaciones.trim() || null })
      onHecho(data.mensaje)
    } catch (err) {
      setError(err.mensaje)
      setEnviando(false)
    }
  }

  return (
    <Modal titulo={paso.boton} onCerrar={onCerrar} pie={<>
      <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button className="boton boton--principal" onClick={confirmar} disabled={enviando}>
        {enviando ? <><LoaderCircle size={18} className="girando" /> Guardando…</> : 'Confirmar'}
      </button>
    </>}>
      {error && <Aviso tipo="error" titulo="No se pudo cambiar el estatus">{error}</Aviso>}
      <p>El trámite <strong>{tramite.folioInterno}</strong> pasará de <strong>{ESTATUS_TRAMITE[tramite.estatus].texto}</strong> a <strong>{ESTATUS_TRAMITE[tramite.siguiente].texto}</strong>. El cambio queda en el historial y no se puede regresar.</p>
      <Campo id="obs-paso" etiqueta="Observaciones (opcional)" ayuda={paso.ayuda}>
        <input id="obs-paso" maxLength={1000} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} autoFocus />
      </Campo>
    </Modal>
  )
}

// CU-18: resguardar el PDF oficial; al guardarlo, el trámite pasa a Emitido y se avisa por correo
function ResguardarDocumento({ tramite, onGuardado }) {
  const [v, setV] = useState({ folioConocer: '', tipoDocumento: 'Certificado de competencia laboral', fechaEmision: '', vigencia: '' })
  const [archivo, setArchivo] = useState(null)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  // Al corregir un campo se quita su mensaje de error
  const cambiar = (campo) => (e) => {
    setV((x) => ({ ...x, [campo]: e.target.value }))
    setErrores(({ [campo]: _, ...resto }) => resto)
  }

  const elegir = (a) => {
    setArchivo(a)
    if (a && !/\.pdf$/i.test(a.name)) setErrores((x) => ({ ...x, archivo: 'El certificado debe ser PDF.' }))
    else if (a && a.size > 10 * 1024 * 1024) setErrores((x) => ({ ...x, archivo: 'El certificado debe pesar como máximo 10 MB.' }))
    else setErrores(({ archivo: _, ...resto }) => resto)
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    setErrorServidor('')
    const e = {}
    if (!archivo) e.archivo = 'Seleccione el PDF del certificado.'
    else if (!/\.pdf$/i.test(archivo.name)) e.archivo = 'El certificado debe ser PDF.'
    else if (archivo.size > 10 * 1024 * 1024) e.archivo = 'El certificado debe pesar como máximo 10 MB.'
    if (!v.folioConocer.trim()) e.folioConocer = 'Escriba el folio CONOCER.'
    if (!v.fechaEmision) e.fechaEmision = 'Escriba la fecha de emisión.'
    else if (v.fechaEmision > tramite.hoy) e.fechaEmision = 'La fecha de emisión no puede ser futura.'
    else if (v.fechaEmision < tramite.fechaSolicitud) e.fechaEmision = `No puede ser anterior a la solicitud (${fecha(tramite.fechaSolicitud)}).`
    if (v.vigencia && v.fechaEmision && v.vigencia < v.fechaEmision) e.vigencia = 'No puede ser anterior a la fecha de emisión.'
    setErrores(e)
    if (Object.keys(e).length) return
    setGuardando(true)
    const datos = new FormData()
    datos.append('archivo', archivo)
    datos.append('folioConocer', v.folioConocer.trim())
    datos.append('tipoDocumento', v.tipoDocumento.trim())
    datos.append('fechaEmision', v.fechaEmision)
    if (v.vigencia) datos.append('vigencia', v.vigencia)
    try {
      const { data } = await cliente.post(`/tramites/${tramite.id}/documento`, datos)
      onGuardado(data.mensaje)
    } catch (err) {
      setErrores(erroresPorCampo(err))
      setErrorServidor(err.mensaje)
      setGuardando(false)
    }
  }

  return (
    <section className="tarjeta seccion-detalle">
      <h2 className="subtitulo">Resguardar documento oficial de CONOCER</h2>
      <p className="auxiliar" style={{ marginTop: -8 }}>Al guardarlo, el trámite pasa a Emitido y se le avisa por correo al participante.</p>
      <form onSubmit={guardar} noValidate>
        {errorServidor && <div style={{ marginBottom: 12 }}><Aviso tipo="error" titulo="No se pudo guardar">{errorServidor}</Aviso></div>}
        <CampoArchivo id="certificado" etiqueta="PDF del certificado" error={errores.archivo} archivo={archivo} onCambio={elegir}
          aceptar=".pdf" ayuda="Solo PDF, máximo 10 MB." />
        <div className="tres-columnas">
          <Campo id="folioConocer" etiqueta="Folio CONOCER" error={errores.folioConocer}>
            <input id="folioConocer" maxLength={50} value={v.folioConocer} onChange={cambiar('folioConocer')} placeholder="Ej. D-0000123456" aria-invalid={Boolean(errores.folioConocer)} />
          </Campo>
          <Campo id="fechaEmision" etiqueta="Fecha de emisión" error={errores.fechaEmision}>
            <input id="fechaEmision" type="date" value={v.fechaEmision} min={tramite.fechaSolicitud} max={tramite.hoy} onChange={cambiar('fechaEmision')} aria-invalid={Boolean(errores.fechaEmision)} />
          </Campo>
          <Campo id="vigencia" etiqueta="Vigencia (opcional)" error={errores.vigencia} ayuda="Déjela vacía si no vence.">
            <input id="vigencia" type="date" value={v.vigencia} min={v.fechaEmision || undefined} onChange={cambiar('vigencia')} aria-invalid={Boolean(errores.vigencia)} />
          </Campo>
        </div>
        <Campo id="tipoDocumento" etiqueta="Tipo de documento" error={errores.tipoDocumento}>
          <input id="tipoDocumento" maxLength={100} value={v.tipoDocumento} onChange={cambiar('tipoDocumento')} />
        </Campo>
        <div className="pie-guardar">
          <button type="submit" className="boton boton--principal" disabled={guardando}>
            {guardando ? <><LoaderCircle size={18} className="girando" /> Guardando…</> : 'Guardar y marcar como emitido'}
          </button>
        </div>
      </form>
    </section>
  )
}
