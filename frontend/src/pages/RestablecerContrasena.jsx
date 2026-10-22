import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CircleAlert, CircleCheck, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import logo from '../assets/logo-cindec.png'
import cliente from '../api/cliente.js'

const REGLA_CONTRASENA = /^(?=.*[A-Za-zÁÉÍÓÚÑáéíóúñ])(?=.*\d).{8,72}$/

// P-02 Recuperar contraseña, paso 2: definir la contraseña nueva desde el enlace del correo.
export default function RestablecerContrasena() {
  const [parametros] = useSearchParams()
  const token = parametros.get('token') || ''
  const [estado, setEstado] = useState(token ? 'validando' : 'invalido') // validando | listo | invalido | hecho
  const [nombre, setNombre] = useState('')
  const [mensaje, setMensaje] = useState(token ? '' : 'El enlace está incompleto. Ábralo de nuevo desde el correo o solicite uno nuevo.')
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [ver, setVer] = useState(false)
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Al abrir la pantalla, se pregunta al servidor si el enlace sigue vigente.
  useEffect(() => {
    if (!token) return
    cliente.get('/auth/restablecer/validar', { params: { token } })
      .then(({ data }) => { setNombre(data.nombre); setEstado('listo') })
      .catch((err) => { setMensaje(err.mensaje); setEstado('invalido') })
  }, [token])

  const guardar = async (evento) => {
    evento.preventDefault()
    setError('')
    const e = {}
    if (!REGLA_CONTRASENA.test(contrasena)) e.contrasena = 'La contraseña debe tener al menos 8 caracteres e incluir letras y números.'
    if (confirmacion !== contrasena) e.confirmacion = 'Las contraseñas no coinciden. Escríbala igual en los dos campos.'
    setErrores(e)
    if (Object.keys(e).length) return
    setGuardando(true)
    try {
      const { data } = await cliente.post('/auth/restablecer', { token, contrasena })
      setMensaje(data.mensaje)
      setEstado('hecho')
    } catch (err) {
      setError(err.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="acceso">
      <div className="tarjeta acceso__tarjeta">
        <img src={logo} alt="CINDEC" className="acceso__logo" />
        <h1 className="acceso__titulo">Definir contraseña nueva</h1>

        {estado === 'validando' && (
          <p className="fila-icono auxiliar acceso__subtitulo centrado"><LoaderCircle size={20} className="girando" /> Verificando el enlace…</p>
        )}

        {estado === 'invalido' && (
          <>
            <div className="aviso aviso--error acceso__aviso" role="alert">
              <CircleAlert size={22} /><div><strong>No se puede usar este enlace</strong><p>{mensaje}</p></div>
            </div>
            <Link to="/recuperar" className="boton boton--principal boton--ancho">Solicitar un enlace nuevo</Link>
          </>
        )}

        {estado === 'hecho' && (
          <>
            <div className="aviso aviso--exito acceso__aviso" role="status">
              <CircleCheck size={22} /><div><strong>Contraseña actualizada</strong><p>{mensaje}</p></div>
            </div>
            <Link to="/login" className="boton boton--principal boton--ancho">Iniciar sesión</Link>
          </>
        )}

        {estado === 'listo' && (
          <form onSubmit={guardar} noValidate>
            <p className="auxiliar acceso__subtitulo">Hola, {nombre}. Escriba su contraseña nueva: mínimo 8 caracteres, con letras y números.</p>
            {error && (
              <div className="aviso aviso--error acceso__aviso" role="alert">
                <CircleAlert size={22} /><div><strong>No se pudo cambiar la contraseña</strong><p>{error}</p></div>
              </div>
            )}
            <div className="campo">
              <label htmlFor="contrasena">Contraseña nueva</label>
              <div className="campo__con-boton">
                <input id="contrasena" type={ver ? 'text' : 'password'} autoComplete="new-password" autoFocus
                  value={contrasena} onChange={(e) => setContrasena(e.target.value)} aria-invalid={Boolean(errores.contrasena)} />
                <button type="button" className="boton-icono" onClick={() => setVer((v) => !v)}
                  aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {ver ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errores.contrasena && <p className="campo__error">{errores.contrasena}</p>}
            </div>
            <div className="campo">
              <label htmlFor="confirmacion">Confirme la contraseña</label>
              <input id="confirmacion" type={ver ? 'text' : 'password'} autoComplete="new-password"
                value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} aria-invalid={Boolean(errores.confirmacion)} />
              {errores.confirmacion && <p className="campo__error">{errores.confirmacion}</p>}
            </div>
            <button type="submit" className="boton boton--principal boton--ancho" disabled={guardando}>
              {guardando ? <><LoaderCircle size={18} className="girando" /> Guardando…</> : 'Guardar contraseña'}
            </button>
          </form>
        )}

        <hr className="separador" />
        <Link to="/login" className="enlace-volver"><ArrowLeft size={18} /> Volver a iniciar sesión</Link>
      </div>
    </div>
  )
}
