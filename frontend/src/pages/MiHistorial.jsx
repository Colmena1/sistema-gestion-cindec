import { useEffect, useState } from 'react'
import { History, LoaderCircle } from 'lucide-react'
import cliente from '../api/cliente.js'
import Aviso from '../components/Aviso.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import { DICTAMEN, ESTATUS_INSCRIPCION, ESTATUS_INTENTO, ESTATUS_TRAMITE, calificacion, fecha } from '../utils/formato.js'

// P-23 Mi historial (CU-11; RF-CUR-06, RF-EVA-05) — Participante.
// En un solo lugar: sus cursos, sus evaluaciones y sus certificaciones.
export default function MiHistorial() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([cliente.get('/mis-cursos'), cliente.get('/mi-historial')])
      .then(([cursos, historial]) => setDatos({ cursos: cursos.data.cursos, ...historial.data }))
      .catch((err) => setError(err.mensaje))
  }, [])

  return (
    <>
      <h1 className="titulo-pantalla fila-icono"><History size={26} strokeWidth={1.75} /> Mi historial</h1>
      {error && <Aviso tipo="error" titulo="No se pudo cargar su historial">{error}</Aviso>}
      {!datos && !error && <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando…</p>}
      {datos && <>
        <section className="tarjeta tarjeta--tabla seccion-detalle">
          <div className="seccion-detalle__cabecera"><h2 className="subtitulo">Cursos ({datos.cursos.length})</h2></div>
          {datos.cursos.length === 0 ? <div className="estado-vacio"><p className="auxiliar">Todavía no está inscrito en ningún curso.</p></div> : (
            <table className="tabla tabla--compacta">
              <thead><tr><th>Curso</th><th>Grupo y fechas</th><th>Asistencia</th><th>Capacitación</th></tr></thead>
              <tbody>
                {datos.cursos.map((c) => (
                  <tr key={c.idInscripcion}>
                    <td data-etiqueta="Curso"><strong>{c.curso}</strong><span className="auxiliar bloque">{c.estandar}</span></td>
                    <td data-etiqueta="Grupo y fechas">{c.clave}<span className="auxiliar bloque">{fecha(c.fechaInicio)} al {fecha(c.fechaFin)}</span></td>
                    <td data-etiqueta="Asistencia">{c.asistencias.registradas ? `${c.asistencias.presentes} de ${c.asistencias.registradas} sesiones` : <span className="auxiliar">Sin registro</span>}</td>
                    <td data-etiqueta="Capacitación"><EtiquetaEstatus tono={ESTATUS_INSCRIPCION[c.estatus].tono}>{ESTATUS_INSCRIPCION[c.estatus].texto}</EtiquetaEstatus></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="tarjeta tarjeta--tabla seccion-detalle">
          <div className="seccion-detalle__cabecera"><h2 className="subtitulo">Evaluaciones ({datos.evaluaciones.length})</h2></div>
          {datos.evaluaciones.length === 0 ? <div className="estado-vacio"><p className="auxiliar">Todavía no presenta evaluaciones.</p></div> : (
            <table className="tabla tabla--compacta">
              <thead><tr><th>Estándar</th><th>Intento</th><th>Calificación</th><th>Resultado</th></tr></thead>
              <tbody>
                {datos.evaluaciones.map((e) => (
                  <tr key={e.id}>
                    <td data-etiqueta="Estándar"><strong>{e.estandar}</strong><span className="auxiliar bloque">{e.curso}</span></td>
                    <td data-etiqueta="Intento">{e.numero} · {fecha(e.fechaAplicacion)}</td>
                    <td data-etiqueta="Calificación">{calificacion(e.calificacion)}<span className="auxiliar bloque">Mínima {calificacion(e.calificacionMinima)}</span></td>
                    <td data-etiqueta="Resultado">
                      <div className="celda-etiquetas">
                        <EtiquetaEstatus tono={ESTATUS_INTENTO[e.estatus].tono}>Evaluación {ESTATUS_INTENTO[e.estatus].texto.toLowerCase()}</EtiquetaEstatus>
                        {e.dictamen && <EtiquetaEstatus tono={DICTAMEN[e.dictamen].tono}>{DICTAMEN[e.dictamen].texto}</EtiquetaEstatus>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="tarjeta tarjeta--tabla seccion-detalle">
          <div className="seccion-detalle__cabecera"><h2 className="subtitulo">Certificaciones ({datos.certificaciones.length})</h2></div>
          {datos.certificaciones.length === 0 ? <div className="estado-vacio"><p className="auxiliar">Todavía no tiene trámites de certificación.</p></div> : (
            <table className="tabla tabla--compacta">
              <thead><tr><th>Estándar</th><th>Trámite</th><th>Estatus</th><th>Certificado</th></tr></thead>
              <tbody>
                {datos.certificaciones.map((c) => (
                  <tr key={c.id}>
                    <td data-etiqueta="Estándar"><strong>{c.estandar.codigo}</strong><span className="auxiliar bloque recorte">{c.estandar.nombre}</span></td>
                    <td data-etiqueta="Trámite">{c.folioInterno}<span className="auxiliar bloque">Solicitado el {fecha(c.fechaSolicitud)}</span></td>
                    <td data-etiqueta="Estatus"><EtiquetaEstatus tono={ESTATUS_TRAMITE[c.estatus].tono}>{ESTATUS_TRAMITE[c.estatus].texto}</EtiquetaEstatus></td>
                    <td data-etiqueta="Certificado">{c.documento ? <>Folio {c.documento.folioConocer}<span className="auxiliar bloque">Emitido el {fecha(c.documento.fechaEmision)}</span></> : <span className="auxiliar">En proceso</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </>}
    </>
  )
}
