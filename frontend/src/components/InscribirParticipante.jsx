import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, LoaderCircle, Search } from 'lucide-react'
import cliente from '../api/cliente.js'
import Modal from './Modal.jsx'
import Aviso from './Aviso.jsx'
import useDebounce from '../hooks/useDebounce.js'
import { fecha } from '../utils/formato.js'

// P-09 Inscribir participante (CU-07 «include» CU-08; mockups M09 y M09b).
// Busca al participante, avisa si ya está inscrito y muestra los lugares que quedan.
// Si no hay cupo, el botón se deshabilita y se ofrecen otros grupos del mismo curso.
const SITUACION = {
  inscrito: 'Ya está inscrito(a) en este grupo',
  cuenta_desactivada: 'Su cuenta está desactivada',
  baja: 'Estuvo dado(a) de baja; se reactivará',
}

export default function InscribirParticipante({ grupo, onCerrar, onInscrito }) {
  const [buscar, setBuscar] = useState('')
  const texto = useDebounce(buscar.trim(), 300)
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [elegido, setElegido] = useState(null)
  const [esRefuerzo, setEsRefuerzo] = useState(false)
  const [error, setError] = useState('')
  const [sinCupo, setSinCupo] = useState(grupo.lugaresLibres <= 0 ? { otrosGrupos: null } : null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (texto.length < 2) { setResultados([]); return }
    setBuscando(true)
    cliente.get(`/grupos/${grupo.id}/candidatos`, { params: { buscar: texto } })
      .then(({ data }) => setResultados(data.participantes))
      .catch(() => setResultados([]))
      .finally(() => setBuscando(false))
  }, [texto, grupo.id])

  const inscribir = async () => {
    setError('')
    setEnviando(true)
    try {
      const { data } = await cliente.post(`/grupos/${grupo.id}/inscripciones`, { idParticipante: elegido.id, esRefuerzo })
      onInscrito(`${elegido.nombre} quedó inscrito(a). Quedan ${data.lugaresLibres} lugares.`)
    } catch (err) {
      const detalles = err.response?.data?.detalles
      if (detalles?.sinCupo) setSinCupo({ otrosGrupos: detalles.otrosGrupos })
      else setError(err.mensaje)
      setEnviando(false)
    }
  }

  const subtitulo = grupo.estatus === 'en_curso' ? 'en curso' : `inicia el ${fecha(grupo.fechaInicio)}`

  return (
    <Modal titulo="Inscribir participante" onCerrar={onCerrar} pie={<>
      <button className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button className="boton boton--principal" disabled={!elegido || Boolean(sinCupo) || enviando} onClick={inscribir}>
        {enviando ? <><LoaderCircle size={18} className="girando" /> Inscribiendo…</> : 'Inscribir participante'}
      </button>
    </>}>
      <p className="auxiliar" style={{ marginBottom: 16 }}>Grupo {grupo.clave} · {subtitulo}</p>
      {error && <Aviso tipo="error" titulo="No se pudo inscribir">{error}</Aviso>}

      <div className="campo">
        <label htmlFor="buscar-participante">Buscar participante</label>
        <div className="campo__con-icono">
          <Search size={18} />
          <input id="buscar-participante" autoFocus value={buscar} onChange={(e) => { setBuscar(e.target.value); setElegido(null) }} />
        </div>
        <p className="auxiliar">Por nombre, apellidos o CURP. Si no aparece, regístrelo primero en <Link to="/participantes" className="enlace-tabla">Participantes</Link>.</p>
      </div>

      {buscando && <p className="fila-icono auxiliar"><LoaderCircle size={18} className="girando" /> Buscando…</p>}
      {!buscando && texto.length >= 2 && resultados.length === 0 && <p className="auxiliar">No se encontró ningún participante con “{texto}”.</p>}
      {resultados.length > 0 && (
        <ul className="lista-seleccion" role="listbox" aria-label="Participantes encontrados">
          {resultados.map((p) => {
            const bloqueado = p.situacion === 'inscrito' || p.situacion === 'cuenta_desactivada'
            const activo = elegido?.id === p.id
            return (
              <li key={p.id}>
                <button type="button" role="option" aria-selected={activo} disabled={bloqueado}
                  className={`lista-seleccion__opcion ${activo ? 'lista-seleccion__opcion--elegida' : ''}`}
                  onClick={() => setElegido(p)}>
                  <span><strong>{p.nombre}</strong><span className="auxiliar bloque">{p.curp}</span></span>
                  {activo ? <Check size={20} /> : SITUACION[p.situacion] && <span className="auxiliar">{SITUACION[p.situacion]}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <label className="casilla">
        <input type="checkbox" checked={esRefuerzo} onChange={(e) => setEsRefuerzo(e.target.checked)} />
        Es refuerzo (vuelve a tomar el curso después de una evaluación no aprobada)
      </label>

      {sinCupo ? (
        <>
          <Aviso tipo="error" titulo="El grupo ya no tiene lugares disponibles">
            Los {grupo.cupo} lugares están ocupados. Elija otro grupo del mismo curso o solicite que se amplíe el cupo.
          </Aviso>
          {sinCupo.otrosGrupos && sinCupo.otrosGrupos.length > 0 && (
            <div className="otros-grupos">
              <p className="auxiliar">Grupos de {grupo.curso?.estandar} con lugares:</p>
              {sinCupo.otrosGrupos.map((g) => (
                <Link key={g.id} to={`/grupos/${g.id}`} className="boton boton--secundario boton--chico" onClick={onCerrar}>
                  {g.clave} · inicia {fecha(g.fechaInicio)} · {g.lugaresLibres} libres
                </Link>
              ))}
            </div>
          )}
          {!sinCupo.otrosGrupos && (
            <Link to={`/grupos?curso=${grupo.idCurso}`} className="boton boton--secundario" onClick={onCerrar}>Ver otros grupos de {grupo.curso?.estandar}</Link>
          )}
        </>
      ) : (
        <Aviso tipo="info" titulo={`Quedan ${grupo.lugaresLibres} lugares de ${grupo.cupo}`}>
          Cuando el grupo se llene, el sistema ya no permitirá más inscripciones.
        </Aviso>
      )}
    </Modal>
  )
}
