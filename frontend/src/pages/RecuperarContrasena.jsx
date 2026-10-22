import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CircleAlert, LoaderCircle, MailCheck } from 'lucide-react'
import logo from '../assets/logo-cindec.png'
import cliente from '../api/cliente.js'

// P-02 Recuperar contraseña, paso 1: pedir el enlace por correo (CU-02, RF-USR-06).
export default function RecuperarContrasena() {
  const [correo, setCorreo] = useState('')
  const [errorCampo, setErrorCampo] = useState('')
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (evento) => {
    evento.preventDefault()
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(correo.trim())) {
      setErrorCampo('Escriba un correo electrónico válido, por ejemplo nombre@dominio.com.')
      return
    }
    setErrorCampo('')
    setEnviando(true)
    try {
      const { data } = await cliente.post('/auth/recuperar', { correo: correo.trim() })
      setEnviado(data.mensaje)
    } catch (err) {
      setError(err.mensaje)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="acceso">
      <div className="tarjeta acceso__tarjeta">
        <img src={logo} alt="CINDEC" className="acceso__logo" />
        <h1 className="acceso__titulo">Recuperar contraseña</h1>

        {enviado ? (
          <>
            <div className="aviso aviso--exito acceso__aviso" role="status">
              <MailCheck size={22} />
              <div><strong>Revise su correo</strong><p>{enviado}</p></div>
            </div>
            <p className="auxiliar acceso__subtitulo">El enlace vence en 30 minutos y solo funciona una vez.</p>
          </>
        ) : (
          <form onSubmit={enviar} noValidate>
            <p className="auxiliar acceso__subtitulo">
              Escriba el correo con el que inicia sesión y le enviaremos un enlace para definir una contraseña nueva.
            </p>
            {error && (
              <div className="aviso aviso--error acceso__aviso" role="alert">
                <CircleAlert size={22} /><div><strong>No se pudo enviar</strong><p>{error}</p></div>
              </div>
            )}
            <div className="campo">
              <label htmlFor="correo">Correo electrónico</label>
              <input id="correo" type="email" autoComplete="username" value={correo} autoFocus
                onChange={(e) => setCorreo(e.target.value)} aria-invalid={Boolean(errorCampo)} />
              {errorCampo && <p className="campo__error">{errorCampo}</p>}
            </div>
            <button type="submit" className="boton boton--principal boton--ancho" disabled={enviando}>
              {enviando ? <><LoaderCircle size={18} className="girando" /> Enviando…</> : 'Enviar enlace'}
            </button>
          </form>
        )}

        <hr className="separador" />
        <Link to="/login" className="enlace-volver"><ArrowLeft size={18} /> Volver a iniciar sesión</Link>
      </div>
    </div>
  )
}
