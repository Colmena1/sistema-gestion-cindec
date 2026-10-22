import { useCallback, useEffect, useState } from 'react'
import { CircleAlert, CircleCheck, Eye, EyeOff, LoaderCircle, Pencil, Plus, Search, UserCheck, UserX, Users } from 'lucide-react'
import cliente from '../api/cliente.js'
import Modal from '../components/Modal.jsx'
import EtiquetaEstatus from '../components/EtiquetaEstatus.jsx'
import { NOMBRE_CORTO_ROL } from '../config/menu.js'
import { useSesion } from '../context/SesionContext.jsx'

// P-05 Usuarios (CU-03, RF-USR-01, 02 y 04) — solo Administrador general.
// Lista con buscador y filtros, alta, edición y activar/desactivar.

const FORM_VACIO = { nombre: '', apellidos: '', correo: '', idRol: '', contrasena: '' }
const REGLA_CONTRASENA = /^(?=.*[A-Za-zÁÉÍÓÚÑáéíóúñ])(?=.*\d).{8,72}$/

const fechaCorta = (f) => f
  ? new Date(f).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  : 'Nunca'

export default function Usuarios() {
  const { usuario: yo } = useSesion()
  const [roles, setRoles] = useState([])
  const [filtros, setFiltros] = useState({ buscar: '', idRol: '', activo: '', pagina: 1 })
  const [buscarTexto, setBuscarTexto] = useState('')
  const [datos, setDatos] = useState({ usuarios: [], total: 0, paginas: 1 })
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [aviso, setAviso] = useState('')

  const [formulario, setFormulario] = useState(null) // null = cerrado; { modo: 'crear' | 'editar', ... }
  const [confirmar, setConfirmar] = useState(null)   // usuario a activar/desactivar

  // Catálogo de roles (una sola vez)
  useEffect(() => {
    cliente.get('/usuarios/roles').then(({ data }) => setRoles(data.roles)).catch(() => {})
  }, [])

  // El buscador espera a que deje de escribir (400 ms) para no consultar en cada tecla (RNF-15).
  useEffect(() => {
    const t = setTimeout(() => setFiltros((f) => (f.buscar === buscarTexto ? f : { ...f, buscar: buscarTexto, pagina: 1 })), 400)
    return () => clearTimeout(t)
  }, [buscarTexto])

  const cargar = useCallback(() => {
    setCargando(true)
    setErrorCarga('')
    const params = { pagina: filtros.pagina, limite: 10 }
    if (filtros.buscar) params.buscar = filtros.buscar
    if (filtros.idRol) params.idRol = filtros.idRol
    if (filtros.activo) params.activo = filtros.activo
    cliente.get('/usuarios', { params })
      .then(({ data }) => setDatos(data))
      .catch((err) => setErrorCarga(err.mensaje))
      .finally(() => setCargando(false))
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])

  const mostrarAviso = (texto) => {
    setAviso(texto)
    setTimeout(() => setAviso(''), 4000)
  }

  const cambiarFiltro = (campo, valor) => setFiltros((f) => ({ ...f, [campo]: valor, pagina: 1 }))

  return (
    <>
      <div className="encabezado-pantalla">
        <h1 className="titulo-pantalla fila-icono"><Users size={26} strokeWidth={1.75} /> Usuarios</h1>
        <button className="boton boton--principal" onClick={() => setFormulario({ modo: 'crear', valores: FORM_VACIO })}>
          <Plus size={18} /> Registrar usuario
        </button>
      </div>

      {aviso && (
        <div className="aviso aviso--exito aviso--flotante" role="status">
          <CircleCheck size={22} /><div><strong>{aviso}</strong></div>
        </div>
      )}

      <div className="filtros">
        <div className="campo campo--buscar">
          <label htmlFor="buscar">Buscar</label>
          <div className="campo__con-icono">
            <Search size={18} />
            <input id="buscar" placeholder="Nombre, apellidos o correo" value={buscarTexto}
              onChange={(e) => setBuscarTexto(e.target.value)} />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="filtro-rol">Rol</label>
          <select id="filtro-rol" value={filtros.idRol} onChange={(e) => cambiarFiltro('idRol', e.target.value)}>
            <option value="">Todos</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="filtro-estado">Estado</label>
          <select id="filtro-estado" value={filtros.activo} onChange={(e) => cambiarFiltro('activo', e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Desactivados</option>
          </select>
        </div>
      </div>

      {errorCarga && (
        <div className="aviso aviso--error"><CircleAlert size={22} /><div><strong>No se pudo cargar la lista</strong><p>{errorCarga}</p></div></div>
      )}

      {!errorCarga && (
        <div className="tarjeta tarjeta--tabla">
          {cargando ? (
            <p className="fila-icono auxiliar relleno"><LoaderCircle size={20} className="girando" /> Cargando usuarios…</p>
          ) : datos.usuarios.length === 0 ? (
            <div className="estado-vacio">
              <p className="subtitulo">No hay usuarios con esos filtros</p>
              <p className="auxiliar">Cambie la búsqueda o registre un usuario nuevo.</p>
            </div>
          ) : (
            <table className="tabla">
              <thead>
                <tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th className="tabla__acciones">Acciones</th></tr>
              </thead>
              <tbody>
                {datos.usuarios.map((u) => (
                  <tr key={u.id} className={u.activo ? '' : 'tabla__fila--inactiva'}>
                    <td data-etiqueta="Usuario">
                      <strong>{u.nombre} {u.apellidos}</strong>
                      <span className="auxiliar bloque">{u.correo}</span>
                    </td>
                    <td data-etiqueta="Rol">{NOMBRE_CORTO_ROL[u.rol] || u.rol}</td>
                    <td data-etiqueta="Estado">
                      {u.activo ? <EtiquetaEstatus tono="exito">Activo</EtiquetaEstatus> : <EtiquetaEstatus>Desactivado</EtiquetaEstatus>}
                    </td>
                    <td data-etiqueta="Último acceso" className="auxiliar">{fechaCorta(u.ultimoAcceso)}</td>
                    <td className="tabla__acciones">
                      <button className="boton boton--secundario boton--chico boton--accion" title="Editar" aria-label={`Editar a ${u.nombre} ${u.apellidos}`}
                        onClick={() => setFormulario({ modo: 'editar', id: u.id, rolActual: u.rol, valores: { nombre: u.nombre, apellidos: u.apellidos, correo: u.correo, idRol: String(u.idRol), contrasena: '' } })}>
                        <Pencil size={16} /><span className="texto-boton">Editar</span>
                      </button>
                      {u.id !== yo.id && (
                        <button className="boton boton--secundario boton--chico boton--accion"
                          title={u.activo ? 'Desactivar' : 'Activar'}
                          aria-label={`${u.activo ? 'Desactivar' : 'Activar'} a ${u.nombre} ${u.apellidos}`}
                          onClick={() => setConfirmar(u)}>
                          {u.activo ? <UserX size={16} /> : <UserCheck size={16} />}
                          <span className="texto-boton">{u.activo ? 'Desactivar' : 'Activar'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {datos.paginas > 1 && (
        <div className="paginacion">
          <button className="boton boton--secundario boton--chico" disabled={filtros.pagina <= 1}
            onClick={() => setFiltros((f) => ({ ...f, pagina: f.pagina - 1 }))}>Anterior</button>
          <span className="auxiliar">Página {filtros.pagina} de {datos.paginas} · {datos.total} usuarios</span>
          <button className="boton boton--secundario boton--chico" disabled={filtros.pagina >= datos.paginas}
            onClick={() => setFiltros((f) => ({ ...f, pagina: f.pagina + 1 }))}>Siguiente</button>
        </div>
      )}
      {datos.paginas <= 1 && !cargando && datos.total > 0 && <p className="auxiliar paginacion">{datos.total} usuarios</p>}

      {formulario && (
        <FormularioUsuario
          formulario={formulario}
          roles={roles}
          onCerrar={() => setFormulario(null)}
          onGuardado={(mensaje) => { setFormulario(null); mostrarAviso(mensaje); cargar() }}
        />
      )}

      {confirmar && (
        <ConfirmarEstado
          usuario={confirmar}
          onCerrar={() => setConfirmar(null)}
          onHecho={(mensaje) => { setConfirmar(null); mostrarAviso(mensaje); cargar() }}
        />
      )}
    </>
  )
}

// ---------- Ventana de alta / edición ----------
function FormularioUsuario({ formulario, roles, onCerrar, onGuardado }) {
  const esAlta = formulario.modo === 'crear'
  const esParticipante = formulario.rolActual === 'Participante'
  const [valores, setValores] = useState(formulario.valores)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [verContrasena, setVerContrasena] = useState(false)

  const asignables = roles.filter((r) => r.asignableDesdeUsuarios)
  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }))

  // Primera validación en el navegador; el backend vuelve a validar (RNF-09).
  const validar = () => {
    const e = {}
    if (!valores.nombre.trim()) e.nombre = 'Escriba el nombre.'
    if (!valores.apellidos.trim()) e.apellidos = 'Escriba los apellidos.'
    if (!/^\S+@\S+\.\S+$/.test(valores.correo.trim())) e.correo = 'Escriba un correo electrónico válido, por ejemplo nombre@dominio.com.'
    if (!esParticipante && !valores.idRol) e.idRol = 'Seleccione un rol.'
    if (esAlta || valores.contrasena) {
      if (!REGLA_CONTRASENA.test(valores.contrasena)) e.contrasena = 'La contraseña debe tener al menos 8 caracteres e incluir letras y números.'
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    setErrorServidor('')
    if (!validar()) return
    setGuardando(true)
    const cuerpo = {
      nombre: valores.nombre.trim(),
      apellidos: valores.apellidos.trim(),
      correo: valores.correo.trim(),
    }
    if (!esParticipante) cuerpo.idRol = Number(valores.idRol)
    if (valores.contrasena) cuerpo.contrasena = valores.contrasena
    try {
      const { data } = esAlta
        ? await cliente.post('/usuarios', cuerpo)
        : await cliente.put(`/usuarios/${formulario.id}`, cuerpo)
      onGuardado(data.mensaje)
    } catch (err) {
      // Si el backend devolvió errores por campo, se muestran debajo de cada campo.
      const detalles = err.response?.data?.detalles
      if (Array.isArray(detalles)) {
        const porCampo = {}
        detalles.forEach((d) => { if (d.campo) porCampo[d.campo] = d.mensaje })
        setErrores(porCampo)
      }
      setErrorServidor(err.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo={esAlta ? 'Registrar usuario' : 'Editar usuario'}
      onCerrar={onCerrar}
      pie={<>
        <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
        <button type="submit" form="form-usuario" className="boton boton--principal" disabled={guardando}>
          {guardando ? <><LoaderCircle size={18} className="girando" /> Guardando…</> : esAlta ? 'Registrar usuario' : 'Guardar cambios'}
        </button>
      </>}
    >
      <form id="form-usuario" onSubmit={guardar} noValidate>
        {errorServidor && (
          <div className="aviso aviso--error" role="alert"><CircleAlert size={22} /><div><strong>No se pudo guardar</strong><p>{errorServidor}</p></div></div>
        )}
        <div className="dos-columnas">
          <Campo id="nombre" etiqueta="Nombre" error={errores.nombre}>
            <input id="nombre" value={valores.nombre} onChange={cambiar('nombre')} aria-invalid={Boolean(errores.nombre)} autoFocus />
          </Campo>
          <Campo id="apellidos" etiqueta="Apellidos" error={errores.apellidos}>
            <input id="apellidos" value={valores.apellidos} onChange={cambiar('apellidos')} aria-invalid={Boolean(errores.apellidos)} />
          </Campo>
        </div>
        <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo}>
          <input id="correo" type="email" value={valores.correo} onChange={cambiar('correo')} aria-invalid={Boolean(errores.correo)} />
        </Campo>
        <Campo id="idRol" etiqueta="Rol" error={errores.idRol}
          ayuda={esParticipante ? 'El rol de un participante no se puede cambiar.' : 'Los participantes se registran con el autorregistro o desde Participantes.'}>
          {esParticipante ? (
            <input id="idRol" value="Participante" disabled />
          ) : (
            <select id="idRol" value={valores.idRol} onChange={cambiar('idRol')} aria-invalid={Boolean(errores.idRol)}>
              <option value="">Seleccione un rol</option>
              {asignables.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          )}
        </Campo>
        <Campo id="contrasena" etiqueta={esAlta ? 'Contraseña inicial' : 'Nueva contraseña (opcional)'} error={errores.contrasena}
          ayuda={esAlta ? 'Mínimo 8 caracteres, con letras y números. Compártala con la persona de forma segura.' : 'Déjela vacía para no cambiarla.'}>
          <div className="campo__con-boton">
            <input id="contrasena" type={verContrasena ? 'text' : 'password'} autoComplete="new-password"
              value={valores.contrasena} onChange={cambiar('contrasena')} aria-invalid={Boolean(errores.contrasena)} />
            <button type="button" className="boton-icono" onClick={() => setVerContrasena((v) => !v)}
              aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              {verContrasena ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </Campo>
      </form>
    </Modal>
  )
}

function Campo({ id, etiqueta, error, ayuda, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error ? <p className="campo__error">{error}</p> : ayuda && <p className="auxiliar">{ayuda}</p>}
    </div>
  )
}

// ---------- Confirmación de activar / desactivar ----------
function ConfirmarEstado({ usuario, onCerrar, onHecho }) {
  const desactivar = usuario.activo
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const confirmar = async () => {
    setEnviando(true)
    setError('')
    try {
      const { data } = await cliente.patch(`/usuarios/${usuario.id}/estado`, { activo: !desactivar })
      onHecho(data.mensaje)
    } catch (err) {
      setError(err.mensaje)
      setEnviando(false)
    }
  }

  return (
    <Modal
      titulo={desactivar ? 'Desactivar usuario' : 'Activar usuario'}
      onCerrar={onCerrar}
      pie={<>
        <button className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
        <button className={`boton ${desactivar ? 'boton--peligro' : 'boton--principal'}`} onClick={confirmar} disabled={enviando}>
          {enviando ? <><LoaderCircle size={18} className="girando" /> Procesando…</> : desactivar ? 'Desactivar usuario' : 'Activar usuario'}
        </button>
      </>}
    >
      {error && <div className="aviso aviso--error" role="alert"><CircleAlert size={22} /><div><strong>No se pudo completar</strong><p>{error}</p></div></div>}
      <p>
        {desactivar
          ? <>¿Desactivar a <strong>{usuario.nombre} {usuario.apellidos}</strong>? Ya no podrá iniciar sesión, pero toda su información se conserva y puede volver a activarse cuando lo necesite.</>
          : <>¿Activar a <strong>{usuario.nombre} {usuario.apellidos}</strong>? Podrá volver a iniciar sesión con su contraseña.</>}
      </p>
    </Modal>
  )
}
