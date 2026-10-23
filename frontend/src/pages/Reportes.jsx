import { useEffect, useState } from 'react'
import { ChartColumn, FileSpreadsheet, FileText, LoaderCircle, Search } from 'lucide-react'
import cliente from '../api/cliente.js'
import { descargarReporte } from '../api/reportes.js'
import Aviso from '../components/Aviso.jsx'
import { ESTATUS_TRAMITE, ORDEN_TRAMITE, erroresPorCampo } from '../utils/formato.js'

// P-15 Reportes (CU-22; RF-REP-01 y 02) — Coordinador y Administrador.
// Elige el reporte y el periodo, ve la vista previa y lo exporta a PDF o Excel.
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date())
const inicioDeAnio = () => `${hoy().slice(0, 4)}-01-01`

export default function Reportes() {
  const [catalogo, setCatalogo] = useState(null)
  const [cursos, setCursos] = useState([])
  const [clave, setClave] = useState('')
  const [f, setF] = useState({ desde: inicioDeAnio(), hasta: hoy(), idCurso: '', estatus: '' })
  const [reporte, setReporte] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [descargando, setDescargando] = useState('')
  const [error, setError] = useState('')
  const [errores, setErrores] = useState({})

  useEffect(() => {
    cliente.get('/reportes').then(({ data }) => { setCatalogo(data.reportes); setClave(data.reportes[0]?.clave || '') }).catch((err) => setError(err.mensaje))
    cliente.get('/cursos').then(({ data }) => setCursos(data.cursos)).catch(() => {})
  }, [])

  const elegido = catalogo?.find((r) => r.clave === clave)
  const params = () => {
    const p = {}
    if (f.desde) p.desde = f.desde
    if (f.hasta) p.hasta = f.hasta
    if (f.idCurso && elegido?.filtros.includes('curso')) p.idCurso = f.idCurso
    if (f.estatus && elegido?.filtros.includes('estatus')) p.estatus = f.estatus
    return p
  }
  const validar = () => {
    const e = {}
    if (f.desde && f.hasta && f.desde > f.hasta) e.desde = 'Debe ser anterior o igual a "hasta".'
    setErrores(e)
    return !Object.keys(e).length
  }
  const cambiar = (campo) => (e) => { setF((x) => ({ ...x, [campo]: e.target.value })); setReporte(null) }
  const elegir = (c) => { setClave(c); setReporte(null); setError('') }

  const generar = async () => {
    if (!validar()) return
    setCargando(true)
    setError('')
    try {
      const { data } = await cliente.get(`/reportes/${clave}`, { params: params(), timeout: 60000 })
      setReporte(data.reporte)
    } catch (err) {
      setErrores(erroresPorCampo(err))
      setError(err.mensaje)
    } finally {
      setCargando(false)
    }
  }
  const descargar = async (formato) => {
    if (!validar()) return
    setDescargando(formato)
    setError('')
    try { await descargarReporte(clave, formato, params()) } catch (err) { setError(err.mensaje) } finally { setDescargando('') }
  }

  return (
    <>
      <h1 className="titulo-pantalla fila-icono"><ChartColumn size={26} strokeWidth={1.75} /> Reportes</h1>
      {!catalogo && !error && <p className="fila-icono auxiliar"><LoaderCircle size={20} className="girando" /> Cargando…</p>}

      {catalogo && (
        <div className="reportes">
          <nav className="reportes__lista tarjeta" aria-label="Reportes disponibles">
            <ul className="lista-seleccion">
              {catalogo.map((r) => (
                <li key={r.clave}>
                  <button type="button" className={`lista-seleccion__opcion ${clave === r.clave ? 'lista-seleccion__opcion--elegida' : ''}`} onClick={() => elegir(r.clave)} aria-pressed={clave === r.clave}>
                    <strong>{r.titulo}</strong>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="reportes__detalle">
            {elegido && (
              <section className="tarjeta seccion-detalle">
                <h2 className="subtitulo" style={{ marginTop: 0 }}>{elegido.titulo}</h2>
                <p className="auxiliar" style={{ marginTop: -8 }}>{elegido.descripcion}</p>
                <div className="filtros-reporte">
                  <div className="campo">
                    <label htmlFor="desde">Desde <span className="auxiliar">({elegido.periodo.toLowerCase()})</span></label>
                    <input id="desde" type="date" value={f.desde} max={f.hasta || undefined} onChange={cambiar('desde')} aria-invalid={Boolean(errores.desde)} />
                    {errores.desde && <p className="campo__error">{errores.desde}</p>}
                  </div>
                  <div className="campo">
                    <label htmlFor="hasta">Hasta</label>
                    <input id="hasta" type="date" value={f.hasta} min={f.desde || undefined} onChange={cambiar('hasta')} />
                  </div>
                  {elegido.filtros.includes('curso') && (
                    <div className="campo">
                      <label htmlFor="curso">Curso</label>
                      <select id="curso" value={f.idCurso} onChange={cambiar('idCurso')}>
                        <option value="">Todos</option>
                        {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                  )}
                  {elegido.filtros.includes('estatus') && (
                    <div className="campo">
                      <label htmlFor="estatus">Estatus</label>
                      <select id="estatus" value={f.estatus} onChange={cambiar('estatus')}>
                        <option value="">Todos</option>
                        {ORDEN_TRAMITE.map((e) => <option key={e} value={e}>{ESTATUS_TRAMITE[e].texto}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <p className="auxiliar" style={{ margin: '0 0 12px' }}>Deje las fechas vacías para incluir todo el historial.</p>
                <div className="grupo-botones">
                  <button className="boton boton--principal" onClick={generar} disabled={cargando}>
                    {cargando ? <LoaderCircle size={18} className="girando" /> : <Search size={18} />} Ver reporte
                  </button>
                  <button className="boton boton--secundario" onClick={() => descargar('pdf')} disabled={Boolean(descargando)}>
                    {descargando === 'pdf' ? <LoaderCircle size={18} className="girando" /> : <FileText size={18} />} Descargar PDF
                  </button>
                  <button className="boton boton--secundario" onClick={() => descargar('excel')} disabled={Boolean(descargando)}>
                    {descargando === 'excel' ? <LoaderCircle size={18} className="girando" /> : <FileSpreadsheet size={18} />} Descargar Excel
                  </button>
                </div>
              </section>
            )}

            {error && <div style={{ marginBottom: 16 }}><Aviso tipo="error" titulo="No se pudo generar el reporte" onCerrar={() => setError('')}>{error}</Aviso></div>}

            {reporte && (
              <section className="tarjeta tarjeta--tabla seccion-detalle">
                <div className="seccion-detalle__cabecera">
                  <div>
                    <h2 className="subtitulo">Vista previa · {reporte.filas.length} registro(s)</h2>
                    <p className="auxiliar">{reporte.filtrosTexto.join(' · ')}</p>
                  </div>
                </div>
                {reporte.resumen.length > 0 && (
                  <div className="resumen-reporte relleno-lateral">
                    {reporte.resumen.map((r) => (
                      <div key={r.etiqueta} className="resumen-reporte__dato"><span className="auxiliar">{r.etiqueta}</span><strong>{r.valor}</strong></div>
                    ))}
                  </div>
                )}
                {reporte.filas.length === 0 ? (
                  <div className="estado-vacio"><p className="subtitulo">No hay registros con esos filtros</p><p className="auxiliar">Amplíe el periodo o quite el filtro de curso.</p></div>
                ) : (
                  <div className="tabla-desplazable">
                    <table className="tabla tabla--compacta">
                      <thead><tr>{reporte.columnas.map((c) => <th key={c.clave} style={{ textAlign: c.alinear }}>{c.titulo}</th>)}</tr></thead>
                      <tbody>
                        {reporte.filas.slice(0, 200).map((fila, i) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <tr key={i}>
                            {reporte.columnas.map((c) => <td key={c.clave} data-etiqueta={c.titulo} style={{ textAlign: c.alinear }}>{fila[c.clave] === '' || fila[c.clave] === null ? '—' : fila[c.clave]}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reporte.filas.length > 200 && <p className="auxiliar relleno-lateral">Se muestran los primeros 200 registros; el PDF y el Excel incluyen todos.</p>}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}
    </>
  )
}
