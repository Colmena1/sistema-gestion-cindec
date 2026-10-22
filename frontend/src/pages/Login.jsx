import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CircleAlert, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import logo from '../assets/logo-cindec.png'
import logoConocer from '../assets/logo-red-conocer.png'
import { useSesion } from '../context/SesionContext.jsx'

// P-01 Inicio de sesión (CU-01, RF-USR-05). Basado en el mockup M01.
export default function Login() {
  const { usuario, iniciarSesion } = useSesion()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [verContrasena, setVerContrasena] = useState(false)
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Si ya hay sesión, no tiene caso mostrar el login.
  if (usuario) return <Navigate to="/" replace />

  // Primera validación en el navegador (la segunda la hace el backend, RNF-09).
  const validar = () => {
    const e = {}
    if (!correo.trim()) e.correo = 'Escriba su correo electrónico.'
    else if (!/^\S+@\S+\.\S+$/.test(correo.trim())) e.correo = 'Escriba un correo electrónico válido, por ejemplo nombre@dominio.com.'
    if (!contrasena) e.contrasena = 'Escriba su contraseña.'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setError('')
    if (!validar()) return
    setEnviando(true)
    try {
      await iniciarSesion(correo.trim(), contrasena)
      navegar(ubicacion.state?.desde || '/', { replace: true })
    } catch (err) {
      setError(err.mensaje)
      setContrasena('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="acceso">
      <form className="tarjeta acceso__tarjeta" onSubmit={enviar} noValidate>
        <img src={logo} alt="CINDEC — Centro Integral de Desarrollo y Evaluación de Competencia Laboral" className="acceso__logo" />
        <h1 className="acceso__titulo">Iniciar sesión</h1>
        <p className="auxiliar acceso__subtitulo">Sistema de Gestión de Capacitación y Certificación</p>

        {error && (
          <div className="aviso aviso--error" role="alert">
            <CircleAlert size={22} />
            <div><strong>No se pudo iniciar sesión</strong><p>{error}</p></div>
          </div>
        )}

        <div className="campo">
          <label htmlFor="correo">Correo electrónico</label>
          <input id="correo" type="email" autoComplete="username" value={correo}
            onChange={(e) => setCorreo(e.target.value)} aria-invalid={Boolean(errores.correo)} autoFocus />
          {errores.correo && <p className="campo__error">{errores.correo}</p>}
        </div>

        <div className="campo">
          <label htmlFor="contrasena">Contraseña</label>
          <div className="campo__con-boton">
            <input id="contrasena" type={verContrasena ? 'text' : 'password'} autoComplete="current-password"
              value={contrasena} onChange={(e) => setContrasena(e.target.value)} aria-invalid={Boolean(errores.contrasena)} />
            <button type="button" className="boton-icono" onClick={() => setVerContrasena((v) => !v)}
              aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              {verContrasena ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errores.contrasena && <p className="campo__error">{errores.contrasena}</p>}
          <Link to="/recuperar" className="acceso__olvido">¿Olvidó su contraseña?</Link>
        </div>

        <button type="submit" className="boton boton--principal boton--ancho" disabled={enviando}>
          {enviando ? <><LoaderCircle size={18} className="girando" /> Verificando…</> : 'Iniciar sesión'}
        </button>

        <hr className="separador" />
        <p className="acceso__registro">
          ¿Aún no tiene cuenta? <Link to="/registro" className="acceso__olvido">Regístrese como participante</Link>
        </p>
      </form>

      <footer className="acceso__pie">
        <img src={logoConocer} alt="Red CONOCER" />
        <span>Entidad de Certificación y Evaluación ECE516-22</span>
      </footer>
    </div>
  )
}
