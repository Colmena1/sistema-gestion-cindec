import { useEffect, useState } from 'react'
import { Download, FileBadge, LoaderCircle } from 'lucide-react'
import cliente from '../api/cliente.js'
import { descargarCertificado } from '../api/certificados.js'
import Aviso from '../components/Aviso.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import { ESTATUS_TRAMITE, ORDEN_TRAMITE, fecha } from '../utils/formato.js'

// P-24 Mis certificados (CU-19; RF-CERT-06) — Participante.
// Ve el avance de sus trámites y descarga sus certificados ya emitidos.
export default function MisCertificados() {
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')
  const [errorDescarga, setErrorDescarga] = useState('')
  const [descargando, setDescargando] = useState(null)

  useEffect(() => {
    cliente.get('/mis-certificados').then(({ data }) => setLista(data.certificados)).catch((err) => setError(err.mensaje))
  }, [])

  const descargar = async (id) => {
    setErrorDescarga('')
    setDescargando(id)
    try { await descargarCertificado(id) } catch (err) { setErrorDescarga(err.mensaje) } finally { setDescargando(null) }
  }

  return (
    <>
      <h1 className="titulo-pantalla fila-icono"><FileBadge size={26} strokeWidth={1.75} /> Mis certificados</h1>
      {error && <Aviso tipo="error" titulo="No se pudieron cargar sus certificados">{error}</Aviso>}
      {errorDescarga && <div style={{ marginBottom: 16 }}><Aviso tipo="error" titulo="No se pudo descargar" onCerrar={() => setErrorDescarga('')}>{errorDescarga}</Aviso></div>}
      {!lista && !error && <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando…</p>}
      {lista && lista.length === 0 && (
        <div className="tarjeta estado-vacio">
          <p className="subtitulo">Todavía no tiene certificados</p>
          <p className="auxiliar">Cuando sea dictaminado competente, CINDEC iniciará su trámite ante CONOCER y aquí verá su avance y su certificado.</p>
        </div>
      )}
      <div className="tarjetas">
        {lista?.map((c) => {
          const est = ESTATUS_TRAMITE[c.estatus]
          return (
            <article key={c.id} className="tarjeta tarjeta-curso">
              <header className="tarjeta-curso__cabecera">
                <div>
                  <h2 className="subtitulo">{c.estandar.codigo}</h2>
                  <p className="auxiliar">{c.estandar.nombre}</p>
                </div>
                <EtiquetaEstatus tono={est.tono}>{est.texto}</EtiquetaEstatus>
              </header>
              {c.documento ? (
                <>
                  <p className="auxiliar" style={{ margin: 0 }}>
                    Folio CONOCER <strong>{c.documento.folioConocer}</strong> · Emitido el {fecha(c.documento.fechaEmision)} ·
                    {c.documento.vigencia ? ` Vigente hasta ${fecha(c.documento.vigencia)}` : ' Sin vencimiento'}
                  </p>
                  <button className="boton boton--principal" onClick={() => descargar(c.id)} disabled={descargando === c.id}>
                    {descargando === c.id ? <LoaderCircle size={18} className="girando" /> : <Download size={18} />} Descargar certificado
                  </button>
                </>
              ) : (
                <>
                  <p className="auxiliar" style={{ margin: 0 }}>Trámite {c.folioInterno}, solicitado el {fecha(c.fechaSolicitud)}. CONOCER todavía no emite su certificado.</p>
                  <ol className="avance-tramite avance-tramite--chico">
                    {ORDEN_TRAMITE.map((e, n) => (
                      <li key={e} className={n <= ORDEN_TRAMITE.indexOf(c.estatus) ? 'avance-tramite__paso--hecho' : ''}><strong>{ESTATUS_TRAMITE[e].texto}</strong></li>
                    ))}
                  </ol>
                </>
              )}
            </article>
          )
        })}
      </div>
    </>
  )
}
