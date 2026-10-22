import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Layers, LoaderCircle, Plus, Search } from 'lucide-react'
import cliente from '../api/cliente.js'
import Aviso from '../components/Aviso.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import FormularioGrupo from '../components/FormularioGrupo.jsx'
import useDebounce from '../hooks/useDebounce.js'
import { ESTATUS_GRUPO, MODALIDAD, fecha } from '../utils/formato.js'

// P-07 Grupos (CU-05) — Coordinador y Administrador.
// Lista con cupo y estatus; desde aquí se crea un grupo y se abre su detalle.
export default function Grupos() {
  const navegar = useNavigate()
  const [cursos, setCursos] = useState([])
  const [personal, setPersonal] = useState({ instructores: [], evaluadores: [] })
  const [buscar, setBuscar] = useState('')
  const [idCurso, setIdCurso] = useState('')
  const [estatus, setEstatus] = useState('')
  const [pagina, setPagina] = useState(1)
  const buscarRetrasado = useDebounce(buscar)
  const [datos, setDatos] = useState({ grupos: [], total: 0, paginas: 1 })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    cliente.get('/cursos').then(({ data }) => setCursos(data.cursos)).catch(() => {})
    cliente.get('/grupos/personal').then(({ data }) => setPersonal(data)).catch(() => {})
  }, [])

  useEffect(() => { setPagina(1) }, [buscarRetrasado, idCurso, estatus])

  const cargar = useCallback(() => {
    setCargando(true)
    setError('')
    const params = { pagina, limite: 10 }
    if (buscarRetrasado) params.buscar = buscarRetrasado
    if (idCurso) params.idCurso = idCurso
    if (estatus) params.estatus = estatus
    cliente.get('/grupos', { params })
      .then(({ data }) => setDatos(data))
      .catch((err) => setError(err.mensaje))
      .finally(() => setCargando(false))
  }, [buscarRetrasado, idCurso, estatus, pagina])

  useEffect(() => { cargar() }, [cargar])

  return (
    <>
      <div className="encabezado-pantalla">
        <h1 className="titulo-pantalla fila-icono"><Layers size={26} strokeWidth={1.75} /> Grupos</h1>
        <button className="boton boton--principal" onClick={() => setCreando(true)}><Plus size={18} /> Crear grupo</button>
      </div>

      <div className="filtros">
        <div className="campo">
          <label htmlFor="buscar">Buscar</label>
          <div className="campo__con-icono">
            <Search size={18} />
            <input id="buscar" placeholder="Clave del grupo" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="f-curso">Curso</label>
          <select id="f-curso" value={idCurso} onChange={(e) => setIdCurso(e.target.value)}>
            <option value="">Todos</option>
            {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="f-estatus">Estatus</label>
          <select id="f-estatus" value={estatus} onChange={(e) => setEstatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(ESTATUS_GRUPO).map(([valor, { texto }]) => <option key={valor} value={valor}>{texto}</option>)}
          </select>
        </div>
      </div>

      {error ? <Aviso tipo="error" titulo="No se pudo cargar la lista">{error}</Aviso> : (
        <div className="tarjeta tarjeta--tabla">
          {cargando ? (
            <p className="fila-icono auxiliar relleno"><LoaderCircle size={20} className="girando" /> Cargando grupos…</p>
          ) : datos.grupos.length === 0 ? (
            <div className="estado-vacio">
              <p className="subtitulo">No hay grupos con esos filtros</p>
              <p className="auxiliar">Cambie los filtros o cree un grupo nuevo.</p>
            </div>
          ) : (
            <table className="tabla tabla--clic">
              <thead><tr><th>Grupo</th><th>Fechas</th><th>Modalidad</th><th>Lugares</th><th>Estatus</th><th className="tabla__acciones"><span className="solo-lector">Abrir</span></th></tr></thead>
              <tbody>
                {datos.grupos.map((g) => (
                  <tr key={g.id} onClick={() => navegar(`/grupos/${g.id}`)}>
                    <td data-etiqueta="Grupo">
                      <strong>{g.clave}</strong>
                      <span className="auxiliar bloque recorte">{g.curso?.nombre} · {g.curso?.estandar}</span>
                    </td>
                    <td data-etiqueta="Fechas">{fecha(g.fechaInicio)} al {fecha(g.fechaFin)}</td>
                    <td data-etiqueta="Modalidad">{MODALIDAD[g.modalidad]}</td>
                    <td data-etiqueta="Lugares">
                      {g.inscritos} de {g.cupo}
                      <span className={`auxiliar bloque ${g.lugaresLibres === 0 ? 'texto-alerta' : ''}`}>
                        {g.lugaresLibres === 0 ? 'Sin lugares' : `${g.lugaresLibres} libres`}
                      </span>
                    </td>
                    <td data-etiqueta="Estatus"><EtiquetaEstatus tono={ESTATUS_GRUPO[g.estatus].tono}>{ESTATUS_GRUPO[g.estatus].texto}</EtiquetaEstatus></td>
                    <td className="tabla__acciones">
                      <Link to={`/grupos/${g.id}`} className="boton boton--secundario boton--chico boton--accion" title="Ver detalle"
                        aria-label={`Ver detalle del grupo ${g.clave}`} onClick={(e) => e.stopPropagation()}>
                        <ChevronRight size={16} /><span className="texto-boton">Ver detalle</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {datos.paginas > 1 ? (
        <div className="paginacion">
          <button className="boton boton--secundario boton--chico" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
          <span className="auxiliar">Página {pagina} de {datos.paginas} · {datos.total} grupos</span>
          <button className="boton boton--secundario boton--chico" disabled={pagina >= datos.paginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
        </div>
      ) : !cargando && datos.total > 0 && <p className="auxiliar paginacion">{datos.total} grupos</p>}

      {creando && (
        <FormularioGrupo grupo={null} cursos={cursos} personal={personal} onCerrar={() => setCreando(false)}
          onGuardado={(mensaje, grupo) => navegar(`/grupos/${grupo.id}`, { state: { aviso: mensaje } })} />
      )}
    </>
  )
}
