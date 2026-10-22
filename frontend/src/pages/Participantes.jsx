import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LoaderCircle, Plus, Search, UserRound } from 'lucide-react'
import cliente from '../api/cliente.js'
import Aviso from '../components/Aviso.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import FormularioParticipante from '../components/FormularioParticipante.jsx'
import useDebounce from '../hooks/useDebounce.js'

// P-10 Participantes (CU-10) — Coordinador y Administrador.
export default function Participantes() {
  const navegar = useNavigate()
  const [buscar, setBuscar] = useState('')
  const buscarRetrasado = useDebounce(buscar)
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState({ participantes: [], total: 0, paginas: 1 })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [cursos, setCursos] = useState([])
  const [registrando, setRegistrando] = useState(false)

  useEffect(() => { cliente.get('/participantes/cursos-disponibles').then(({ data }) => setCursos(data.cursos)).catch(() => {}) }, [])
  useEffect(() => { setPagina(1) }, [buscarRetrasado])

  const cargar = useCallback(() => {
    setCargando(true)
    setError('')
    const params = { pagina, limite: 10 }
    if (buscarRetrasado) params.buscar = buscarRetrasado
    cliente.get('/participantes', { params })
      .then(({ data }) => setDatos(data))
      .catch((err) => setError(err.mensaje))
      .finally(() => setCargando(false))
  }, [buscarRetrasado, pagina])

  useEffect(() => { cargar() }, [cargar])

  return (
    <>
      <div className="encabezado-pantalla">
        <h1 className="titulo-pantalla fila-icono"><UserRound size={26} strokeWidth={1.75} /> Participantes</h1>
        <button className="boton boton--principal" onClick={() => setRegistrando(true)}><Plus size={18} /> Registrar participante</button>
      </div>

      <div className="filtros filtros--uno">
        <div className="campo">
          <label htmlFor="buscar">Buscar</label>
          <div className="campo__con-icono">
            <Search size={18} />
            <input id="buscar" placeholder="Nombre, apellidos, correo o CURP" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
          </div>
        </div>
      </div>

      {error ? <Aviso tipo="error" titulo="No se pudo cargar la lista">{error}</Aviso> : (
        <div className="tarjeta tarjeta--tabla">
          {cargando ? <p className="fila-icono auxiliar relleno"><LoaderCircle size={20} className="girando" /> Cargando participantes…</p>
            : datos.participantes.length === 0 ? (
              <div className="estado-vacio">
                <p className="subtitulo">No hay participantes con esa búsqueda</p>
                <p className="auxiliar">Cambie la búsqueda o registre un participante.</p>
              </div>
            ) : (
              <table className="tabla tabla--clic">
                <thead><tr><th>Participante</th><th>CURP</th><th>Empresa</th><th>Cursos activos</th><th>Cuenta</th><th className="tabla__acciones"><span className="solo-lector">Abrir</span></th></tr></thead>
                <tbody>
                  {datos.participantes.map((p) => (
                    <tr key={p.id} onClick={() => navegar(`/participantes/${p.id}`)}>
                      <td data-etiqueta="Participante"><strong>{p.nombre}</strong><span className="auxiliar bloque">{p.correo}</span></td>
                      <td data-etiqueta="CURP">{p.curp}</td>
                      <td data-etiqueta="Empresa">{p.empresa || '—'}</td>
                      <td data-etiqueta="Cursos activos">{p.inscripcionesActivas}</td>
                      <td data-etiqueta="Cuenta">{p.activo ? <EtiquetaEstatus tono="exito">Activa</EtiquetaEstatus> : <EtiquetaEstatus>Desactivada</EtiquetaEstatus>}</td>
                      <td className="tabla__acciones">
                        <button className="boton boton--secundario boton--chico boton--accion" title="Ver expediente" aria-label={`Ver expediente de ${p.nombre}`}
                          onClick={(e) => { e.stopPropagation(); navegar(`/participantes/${p.id}`) }}>
                          <ChevronRight size={16} /><span className="texto-boton">Ver expediente</span>
                        </button>
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
          <span className="auxiliar">Página {pagina} de {datos.paginas} · {datos.total} participantes</span>
          <button className="boton boton--secundario boton--chico" disabled={pagina >= datos.paginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
        </div>
      ) : !cargando && datos.total > 0 && <p className="auxiliar paginacion">{datos.total} participantes</p>}

      {registrando && (
        <FormularioParticipante participante={null} cursos={cursos} onCerrar={() => setRegistrando(false)}
          onGuardado={(mensaje, id) => navegar(`/participantes/${id}`, { state: { aviso: mensaje } })} />
      )}
    </>
  )
}
