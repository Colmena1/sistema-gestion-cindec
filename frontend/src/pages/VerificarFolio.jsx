import { useState } from 'react'
import { CircleAlert, CircleCheck, Clock, LoaderCircle, ShieldCheck } from 'lucide-react'
import cliente from '../api/cliente.js'
import Aviso from '../components/Aviso.jsx'
import logoRedConocer from '../assets/logo-red-conocer.png'
import { ESTATUS_TRAMITE, fecha } from '../utils/formato.js'

// P-25 Verificar certificación por folio (CU-20; RF-CERT-07, versión V1 interna) — mockup M25.
// Cualquier usuario con sesión escribe el folio CONOCER (o el folio interno del trámite).
export default function VerificarFolio() {
  const [folio, setFolio] = useState('')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)

  const verificar = async (e) => {
    e.preventDefault()
    setError('')
    setResultado(null)
    const valor = folio.trim()
    if (!valor) { setError('Escriba el folio que aparece en el certificado.'); return }
    setBuscando(true)
    try {
      const { data } = await cliente.get('/verificar-folio', { params: { folio: valor } })
      setResultado({ ...data.resultado, folio: valor })
    } catch (err) {
      setError(err.mensaje)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <>
      <h1 className="titulo-pantalla fila-icono"><ShieldCheck size={26} strokeWidth={1.75} /> Verificar certificación por folio</h1>
      <p className="auxiliar" style={{ marginTop: -12, marginBottom: 16 }}>Escriba el folio que aparece en el certificado para confirmar que es auténtico y está vigente.</p>

      <form className="tarjeta seccion-detalle" onSubmit={verificar} noValidate>
        <label htmlFor="folio" className="etiqueta-campo">Folio CONOCER o folio interno CINDEC</label>
        <div className="fila-verificar">
          <input id="folio" maxLength={50} value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="Ej. D-0000123456" aria-invalid={Boolean(error)} autoFocus />
          <button type="submit" className="boton boton--principal" disabled={buscando}>
            {buscando ? <LoaderCircle size={18} className="girando" /> : null} Verificar
          </button>
        </div>
        {error && <p className="campo__error">{error}</p>}
      </form>

      {resultado && <Resultado r={resultado} />}
    </>
  )
}

function Resultado({ r }) {
  if (!r.encontrado) {
    return (
      <section className="tarjeta seccion-detalle">
        <Aviso tipo="error" titulo="No se encontró ningún certificado con ese folio">
          Revise que el folio "{r.folio}" esté escrito igual que en el documento. Si es correcto, el certificado no fue resguardado en el sistema de CINDEC.
        </Aviso>
      </section>
    )
  }
  const doc = r.tipo === 'certificado' ? r : r.documento
  return (
    <section className="tarjeta seccion-detalle">
      {doc ? (
        doc.vigente ? (
          <div className="aviso aviso--exito"><CircleCheck size={22} /><div className="aviso__texto"><strong>Certificado válido y vigente</strong><p>Este documento fue emitido por CONOCER y está resguardado en el sistema de CINDEC.</p></div></div>
        ) : (
          <div className="aviso aviso--error"><CircleAlert size={22} /><div className="aviso__texto"><strong>Certificado auténtico, pero vencido</strong><p>Fue emitido por CONOCER y está resguardado en CINDEC; su vigencia terminó el {fecha(doc.vigencia)}.</p></div></div>
        )
      ) : (
        <div className="aviso aviso--alerta"><Clock size={22} /><div className="aviso__texto"><strong>Trámite en proceso: {ESTATUS_TRAMITE[r.estatus].texto.toLowerCase()}</strong><p>El folio {r.folioInterno} corresponde a un trámite de certificación que CONOCER todavía no emite.</p></div></div>
      )}
      <div className="datos-grupo" style={{ marginTop: 24, marginBottom: 0 }}>
        <Dato etiqueta="Nombre" valor={r.nombre} />
        <Dato etiqueta="Estándar de competencia" valor={`${r.estandar.codigo} ${r.estandar.nombre}`} />
        {doc ? <>
          <Dato etiqueta="Folio CONOCER" valor={doc.folioConocer} />
          <Dato etiqueta="Fecha de emisión" valor={fecha(doc.fechaEmision)} />
          <Dato etiqueta="Vigencia" valor={doc.vigencia ? fecha(doc.vigencia) : 'Sin vencimiento'} />
          <Dato etiqueta="Entidad de certificación" valor={doc.entidad} />
        </> : <Dato etiqueta="Fecha de solicitud" valor={fecha(r.fechaSolicitud)} />}
      </div>
      <div className="pie-red-conocer">
        <img src={logoRedConocer} alt="Red CONOCER" />
        <span className="auxiliar">Red CONOCER de prestadores de servicio</span>
      </div>
    </section>
  )
}

const Dato = ({ etiqueta, valor }) => (
  <div className="dato"><span className="auxiliar">{etiqueta}</span><strong>{valor}</strong></div>
)
