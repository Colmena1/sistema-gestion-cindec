import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Check, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import logo from '../assets/logo-cindec.png'
import cliente from '../api/cliente.js'
import Campo from '../components/Campo.jsx'
import CampoArchivo from '../components/CampoArchivo.jsx'
import Aviso from '../components/Aviso.jsx'
import { useSesion } from '../context/SesionContext.jsx'
import { curpValida, esMenorDeEdad } from '../utils/curp.js'
import { erroresPorCampo } from '../utils/formato.js'

// P-03 Autorregistro en tres pasos (CU-06, RF-CUR-03; mockup M03):
// 1 Cuenta · 2 Datos personales · 3 Documentos. Todo se envía junto al final.
const PASOS = ['Cuenta', 'Datos personales', 'Documentos']
const CAMPOS_POR_PASO = [
  ['nombre', 'apellidos', 'correo', 'contrasena', 'confirmacion'],
  ['curp', 'telefono', 'empresaProcedencia', 'idCursoInteres'],
  ['tipoIdentificacion', 'identificacion', 'fotografia', 'ficha_registro', 'identificacion_tutor'],
]
const REGLA_CONTRASENA = /^(?=.*[A-Za-zÁÉÍÓÚÑáéíóúñ])(?=.*\d).{8,72}$/
const MAX_FOTO = 300 * 1024
const MAX_ARCHIVO = 5 * 1024 * 1024
const TIPOS_OK = ['application/pdf', 'image/jpeg', 'image/png']

export default function Autorregistro() {
  const { usuario } = useSesion()
  const [paso, setPaso] = useState(0)
  const [v, setV] = useState({
    nombre: '', apellidos: '', correo: '', contrasena: '', confirmacion: '',
    curp: '', telefono: '', empresaProcedencia: '', idCursoInteres: '',
    tipoIdentificacion: 'ine',
  })
  const [docs, setDocs] = useState({ identificacion: null, fotografia: null, ficha_registro: null, identificacion_tutor: null })
  const [ver, setVer] = useState(false)
  const [cursos, setCursos] = useState([])
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [terminado, setTerminado] = useState('')

  useEffect(() => {
    cliente.get('/participantes/cursos-disponibles').then(({ data }) => setCursos(data.cursos)).catch(() => {})
  }, [])

  if (usuario) return <Navigate to="/" replace />

  const cambiar = (campo) => (e) => setV((x) => ({ ...x, [campo]: e.target.value }))

  // Revisa un archivo en cuanto se elige, para avisar de inmediato si no cumple.
  const errorDeArchivo = (archivo, soloImagen) => {
    if (!archivo) return undefined
    if (!TIPOS_OK.includes(archivo.type)) return 'El archivo debe ser PDF, JPG o PNG.'
    if (soloImagen && archivo.type === 'application/pdf') return 'La fotografía debe ser JPG o PNG.'
    if (soloImagen && archivo.size > MAX_FOTO) return `La fotografía pesa ${Math.round(archivo.size / 1024)} KB y CONOCER pide 300 KB como máximo. Recórtela o redúzcala e inténtelo de nuevo.`
    if (archivo.size > MAX_ARCHIVO) return 'El archivo pesa más de 5 MB.'
    return undefined
  }
  const elegir = (campo, soloImagen = false) => (archivo) => {
    setDocs((d) => ({ ...d, [campo]: archivo }))
    setErrores((e) => ({ ...e, [campo]: errorDeArchivo(archivo, soloImagen) }))
  }
  const curp = v.curp.trim().toUpperCase()
  const menor = esMenorDeEdad(curp)

  // ---------- Validación de cada paso en el navegador ----------
  const validarPaso = (n) => {
    const e = {}
    if (n === 0) {
      if (!v.nombre.trim()) e.nombre = 'Escriba su nombre.'
      if (!v.apellidos.trim()) e.apellidos = 'Escriba sus apellidos.'
      if (!/^\S+@\S+\.\S+$/.test(v.correo.trim())) e.correo = 'Escriba un correo electrónico válido, por ejemplo nombre@dominio.com.'
      if (!REGLA_CONTRASENA.test(v.contrasena)) e.contrasena = 'La contraseña debe tener al menos 8 caracteres e incluir letras y números.'
      if (v.confirmacion !== v.contrasena) e.confirmacion = 'Las contraseñas no coinciden.'
    }
    if (n === 1) {
      if (!curpValida(curp)) e.curp = 'La CURP no es válida. Revise que tenga 18 caracteres y su fecha de nacimiento.'
      if (!/^\d{10}$/.test(v.telefono.replace(/[\s\-().]/g, ''))) e.telefono = 'Escriba su teléfono a 10 dígitos, por ejemplo 477 123 4567.'
    }
    if (n === 2) {
      const revisar = (campo, archivo, { obligatorio, soloImagen }) => {
        if (!archivo) { if (obligatorio) e[campo] = 'Este documento es obligatorio.'; return }
        if (!TIPOS_OK.includes(archivo.type)) e[campo] = 'El archivo debe ser PDF, JPG o PNG.'
        else if (soloImagen && archivo.type === 'application/pdf') e[campo] = 'La fotografía debe ser JPG o PNG.'
        else if (soloImagen && archivo.size > MAX_FOTO) e[campo] = 'La fotografía pesa más de 300 KB. Reduzca su tamaño (por ejemplo, recórtela o tómela con menor resolución).'
        else if (archivo.size > MAX_ARCHIVO) e[campo] = 'El archivo pesa más de 5 MB.'
      }
      revisar('identificacion', docs.identificacion, { obligatorio: true })
      revisar('fotografia', docs.fotografia, { obligatorio: true, soloImagen: true })
      revisar('ficha_registro', docs.ficha_registro, { obligatorio: false })
      revisar('identificacion_tutor', docs.identificacion_tutor, { obligatorio: menor })
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  // Antes de avanzar, se pregunta si el correo o la CURP ya están registrados.
  const continuar = async () => {
    setError('')
    if (!validarPaso(paso)) return
    if (paso < 2) {
      setTrabajando(true)
      try {
        const cuerpo = paso === 0 ? { correo: v.correo.trim() } : { curp }
        const { data } = await cliente.post('/participantes/autorregistro/verificar', cuerpo)
        if (paso === 0 && !data.correoDisponible) {
          setErrores({ correo: 'Ya existe una cuenta con ese correo. Si es suya, inicie sesión o recupere su contraseña.' })
          return
        }
        if (paso === 1 && !data.curpDisponible) {
          setErrores({ curp: 'Ya hay un participante registrado con esa CURP. Si es usted, inicie sesión.' })
          return
        }
        setPaso(paso + 1)
      } catch (err) {
        setError(err.mensaje)
      } finally {
        setTrabajando(false)
      }
      return
    }
    await enviar()
  }

  const enviar = async () => {
    setTrabajando(true)
    const datos = new FormData()
    const campos = { ...v, curp, correo: v.correo.trim(), telefono: v.telefono.replace(/[\s\-().]/g, '') }
    delete campos.confirmacion
    Object.entries(campos).forEach(([k, valor]) => datos.append(k, typeof valor === 'string' ? valor.trim() : valor))
    Object.entries(docs).forEach(([k, archivo]) => { if (archivo && (k !== 'identificacion_tutor' || menor)) datos.append(k, archivo) })
    try {
      const { data } = await cliente.post('/participantes/autorregistro', datos)
      setTerminado(data.mensaje)
    } catch (err) {
      const porCampo = erroresPorCampo(err)
      setErrores(porCampo)
      setError(err.mensaje)
      // Regresa al primer paso que tenga un error
      const pasoConError = CAMPOS_POR_PASO.findIndex((campos) => campos.some((c) => porCampo[c]))
      if (pasoConError >= 0) setPaso(pasoConError)
    } finally {
      setTrabajando(false)
    }
  }

  if (terminado) {
    return (
      <div className="acceso">
        <div className="tarjeta acceso__tarjeta">
          <img src={logo} alt="CINDEC" className="acceso__logo" />
          <h1 className="acceso__titulo">Registro completado</h1>
          <div className="acceso__aviso" style={{ marginTop: 16 }}><Aviso tipo="exito" titulo={`¡Bienvenido(a), ${v.nombre.trim()}!`}>{terminado}</Aviso></div>
          <p className="auxiliar acceso__subtitulo">Le enviamos un correo de confirmación a {v.correo.trim()}.</p>
          <Link to="/login" className="boton boton--principal boton--ancho">Iniciar sesión</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="acceso">
      <img src={logo} alt="CINDEC — Centro Integral de Desarrollo y Evaluación de Competencia Laboral" className="acceso__logo" />
      <div className="tarjeta registro">
        <h1 className="titulo-pantalla registro__titulo">Registro de participante</h1>
        <p className="auxiliar">Complete los tres pasos para crear su cuenta. Le tomará unos 5 minutos.</p>

        <ol className="pasos">
          {PASOS.map((nombre, i) => (
            <li key={nombre} className={`pasos__paso ${i < paso ? 'pasos__paso--hecho' : ''} ${i === paso ? 'pasos__paso--actual' : ''}`} aria-current={i === paso ? 'step' : undefined}>
              <span className="pasos__numero">{i < paso ? <Check size={16} /> : i + 1}</span>
              <span className="pasos__nombre">{nombre}</span>
            </li>
          ))}
        </ol>

        {error && <div className="acceso__aviso"><Aviso tipo="error" titulo="No se pudo continuar">{error}</Aviso></div>}

        <form onSubmit={(e) => { e.preventDefault(); continuar() }} noValidate>
          {paso === 0 && (
            <>
              <div className="dos-columnas">
                <Campo id="nombre" etiqueta="Nombre(s)" error={errores.nombre}>
                  <input id="nombre" autoComplete="given-name" maxLength={100} value={v.nombre} onChange={cambiar('nombre')} aria-invalid={Boolean(errores.nombre)} autoFocus />
                </Campo>
                <Campo id="apellidos" etiqueta="Apellidos" error={errores.apellidos}>
                  <input id="apellidos" autoComplete="family-name" maxLength={100} value={v.apellidos} onChange={cambiar('apellidos')} aria-invalid={Boolean(errores.apellidos)} />
                </Campo>
              </div>
              <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo} ayuda="Con este correo iniciará sesión.">
                <input id="correo" type="email" autoComplete="email" value={v.correo} onChange={cambiar('correo')} aria-invalid={Boolean(errores.correo)} />
              </Campo>
              <div className="dos-columnas">
                <Campo id="contrasena" etiqueta="Contraseña" error={errores.contrasena} ayuda="Mínimo 8 caracteres, con letras y números.">
                  <div className="campo__con-boton">
                    <input id="contrasena" type={ver ? 'text' : 'password'} autoComplete="new-password" value={v.contrasena} onChange={cambiar('contrasena')} aria-invalid={Boolean(errores.contrasena)} />
                    <button type="button" className="boton-icono" onClick={() => setVer((x) => !x)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      {ver ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </Campo>
                <Campo id="confirmacion" etiqueta="Confirme la contraseña" error={errores.confirmacion}>
                  <input id="confirmacion" type={ver ? 'text' : 'password'} autoComplete="new-password" value={v.confirmacion} onChange={cambiar('confirmacion')} aria-invalid={Boolean(errores.confirmacion)} />
                </Campo>
              </div>
            </>
          )}

          {paso === 1 && (
            <>
              <Campo id="curp" etiqueta="CURP" error={errores.curp} ayuda="18 caracteres. La encuentra en su acta de nacimiento o en gob.mx/curp.">
                <input id="curp" maxLength={18} value={v.curp} onChange={(e) => setV((x) => ({ ...x, curp: e.target.value.toUpperCase() }))}
                  aria-invalid={Boolean(errores.curp)} autoFocus className="mayusculas" />
              </Campo>
              <div className="dos-columnas">
                <Campo id="telefono" etiqueta="Teléfono" error={errores.telefono}>
                  <input id="telefono" type="tel" autoComplete="tel" placeholder="477 123 4567" value={v.telefono} onChange={cambiar('telefono')} aria-invalid={Boolean(errores.telefono)} />
                </Campo>
                <Campo id="empresa" etiqueta={<>Empresa de procedencia <span className="auxiliar">· Opcional</span></>} error={errores.empresaProcedencia}>
                  <input id="empresa" maxLength={150} placeholder="Ej. Calzado del Bajío" value={v.empresaProcedencia} onChange={cambiar('empresaProcedencia')} />
                </Campo>
              </div>
              <Campo id="cursoInteres" etiqueta={<>Curso de interés <span className="auxiliar">· Opcional</span></>} error={errores.idCursoInteres} ayuda="Nos ayuda a avisarle cuando abramos un grupo.">
                <select id="cursoInteres" value={v.idCursoInteres} onChange={cambiar('idCursoInteres')}>
                  <option value="">Sin preferencia</option>
                  {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.estandar})</option>)}
                </select>
              </Campo>
            </>
          )}

          {paso === 2 && (
            <>
              <p className="auxiliar registro__nota">Formatos aceptados: PDF, JPG o PNG, de 5 MB como máximo. Puede tomarles foto con su celular.</p>
              <Campo id="tipoIdentificacion" etiqueta="Identificación oficial" error={errores.tipoIdentificacion}>
                <select id="tipoIdentificacion" value={v.tipoIdentificacion} onChange={cambiar('tipoIdentificacion')}>
                  <option value="ine">INE</option>
                  <option value="pasaporte">Pasaporte</option>
                  <option value="cedula_profesional">Cédula profesional</option>
                  <option value="cartilla_militar">Cartilla militar</option>
                </select>
              </Campo>
              <CampoArchivo id="identificacion" etiqueta="Archivo de la identificación" error={errores.identificacion}
                archivo={docs.identificacion} onCambio={elegir('identificacion')} ayuda="Por ambos lados, legible." />
              <CampoArchivo id="fotografia" etiqueta="Fotografía" aceptar=".jpg,.jpeg,.png" error={errores.fotografia}
                archivo={docs.fotografia} onCambio={elegir('fotografia', true)}
                ayuda="Requisito de CONOCER: a color, fondo claro, de frente, JPG o PNG de 300 KB como máximo." />
              <CampoArchivo id="ficha_registro" etiqueta="Ficha de registro firmada" opcional error={errores.ficha_registro}
                archivo={docs.ficha_registro} onCambio={elegir('ficha_registro')}
                ayuda="Si todavía no la tiene, la puede entregar después a la coordinación." />
              {menor && (
                <>
                  <Aviso tipo="info" titulo="Su CURP indica que es menor de edad">Suba también la identificación oficial de su madre, padre o tutor.</Aviso>
                  <div style={{ height: 12 }} />
                  <CampoArchivo id="identificacion_tutor" etiqueta="Identificación del tutor" error={errores.identificacion_tutor}
                    archivo={docs.identificacion_tutor} onCambio={elegir('identificacion_tutor')} />
                </>
              )}
            </>
          )}

          <hr className="separador" />
          <div className="registro__botones">
            {paso > 0 ? (
              <button type="button" className="enlace-volver enlace-boton-plano" onClick={() => { setErrores({}); setError(''); setPaso(paso - 1) }}>Regresar</button>
            ) : <span />}
            <button type="submit" className="boton boton--principal" disabled={trabajando}>
              {trabajando ? <><LoaderCircle size={18} className="girando" /> {paso === 2 ? 'Enviando…' : 'Verificando…'}</> : paso === 2 ? 'Completar registro' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
      <p className="acceso__registro">¿Ya tiene cuenta? <Link to="/login" className="enlace-volver">Inicie sesión</Link></p>
    </div>
  )
}
