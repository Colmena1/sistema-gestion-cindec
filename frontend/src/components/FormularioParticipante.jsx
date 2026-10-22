import { useState } from 'react'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import cliente from '../api/cliente.js'
import Modal from './Modal.jsx'
import Campo from './Campo.jsx'
import CampoArchivo from './CampoArchivo.jsx'
import Aviso from './Aviso.jsx'
import { curpValida } from '../utils/curp.js'
import { erroresPorCampo } from '../utils/formato.js'

// Alta de un participante por la coordinación, o edición de sus datos.
// En el alta los documentos son opcionales (se pueden agregar después en el expediente).
const REGLA_CONTRASENA = /^(?=.*[A-Za-zÁÉÍÓÚÑáéíóúñ])(?=.*\d).{8,72}$/

export default function FormularioParticipante({ participante, cursos, onCerrar, onGuardado }) {
  const esAlta = !participante
  const [v, setV] = useState({
    nombre: participante?.nombre || '', apellidos: participante?.apellidos || '', correo: participante?.correo || '',
    contrasena: '', curp: participante?.curp || '', telefono: participante?.telefono || '',
    empresaProcedencia: participante?.empresa || '', idCursoInteres: participante?.idCursoInteres ? String(participante.idCursoInteres) : '',
    tipoIdentificacion: 'ine',
  })
  const [docs, setDocs] = useState({ identificacion: null, fotografia: null })
  const [ver, setVer] = useState(false)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const cambiar = (campo) => (e) => setV((x) => ({ ...x, [campo]: e.target.value }))
  const curp = v.curp.trim().toUpperCase()
  const telefono = v.telefono.replace(/[\s\-().]/g, '')

  const guardar = async (evento) => {
    evento.preventDefault()
    setErrorServidor('')
    const e = {}
    if (!v.nombre.trim()) e.nombre = 'Escriba el nombre.'
    if (!v.apellidos.trim()) e.apellidos = 'Escriba los apellidos.'
    if (!/^\S+@\S+\.\S+$/.test(v.correo.trim())) e.correo = 'Escriba un correo electrónico válido.'
    if (esAlta && !REGLA_CONTRASENA.test(v.contrasena)) e.contrasena = 'Mínimo 8 caracteres, con letras y números.'
    if (!curpValida(curp)) e.curp = 'La CURP no es válida.'
    if (!/^\d{10}$/.test(telefono)) e.telefono = 'Escriba el teléfono a 10 dígitos.'
    if (docs.fotografia && (docs.fotografia.type === 'application/pdf' || docs.fotografia.size > 300 * 1024)) e.fotografia = 'JPG o PNG de 300 KB como máximo.'
    setErrores(e)
    if (Object.keys(e).length) return
    setGuardando(true)
    try {
      let respuesta
      if (esAlta) {
        const datos = new FormData()
        const campos = { ...v, curp, telefono, correo: v.correo.trim() }
        Object.entries(campos).forEach(([k, valor]) => datos.append(k, String(valor).trim()))
        Object.entries(docs).forEach(([k, archivo]) => { if (archivo) datos.append(k, archivo) })
        respuesta = await cliente.post('/participantes', datos)
      } else {
        respuesta = await cliente.put(`/participantes/${participante.id}`, {
          nombre: v.nombre.trim(), apellidos: v.apellidos.trim(), correo: v.correo.trim(), curp, telefono,
          empresaProcedencia: v.empresaProcedencia.trim(), idCursoInteres: v.idCursoInteres ? Number(v.idCursoInteres) : null,
        })
      }
      onGuardado(respuesta.data.mensaje, respuesta.data.id)
    } catch (err) {
      setErrores(erroresPorCampo(err))
      setErrorServidor(err.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={esAlta ? 'Registrar participante' : 'Editar datos del participante'} onCerrar={onCerrar} pie={<>
      <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button type="submit" form="form-participante" className="boton boton--principal" disabled={guardando}>
        {guardando ? <><LoaderCircle size={18} className="girando" /> Guardando…</> : esAlta ? 'Registrar participante' : 'Guardar cambios'}
      </button>
    </>}>
      <form id="form-participante" onSubmit={guardar} noValidate>
        {errorServidor && <Aviso tipo="error" titulo="No se pudo guardar">{errorServidor}</Aviso>}
        <div className="dos-columnas">
          <Campo id="p-nombre" etiqueta="Nombre(s)" error={errores.nombre}>
            <input id="p-nombre" maxLength={100} value={v.nombre} onChange={cambiar('nombre')} aria-invalid={Boolean(errores.nombre)} autoFocus />
          </Campo>
          <Campo id="p-apellidos" etiqueta="Apellidos" error={errores.apellidos}>
            <input id="p-apellidos" maxLength={100} value={v.apellidos} onChange={cambiar('apellidos')} aria-invalid={Boolean(errores.apellidos)} />
          </Campo>
          <Campo id="p-curp" etiqueta="CURP" error={errores.curp}>
            <input id="p-curp" maxLength={18} className="mayusculas" value={v.curp} onChange={(e) => setV((x) => ({ ...x, curp: e.target.value.toUpperCase() }))} aria-invalid={Boolean(errores.curp)} />
          </Campo>
          <Campo id="p-telefono" etiqueta="Teléfono" error={errores.telefono}>
            <input id="p-telefono" type="tel" value={v.telefono} onChange={cambiar('telefono')} aria-invalid={Boolean(errores.telefono)} />
          </Campo>
        </div>
        <Campo id="p-correo" etiqueta="Correo electrónico" error={errores.correo}>
          <input id="p-correo" type="email" value={v.correo} onChange={cambiar('correo')} aria-invalid={Boolean(errores.correo)} />
        </Campo>
        {esAlta && (
          <Campo id="p-contrasena" etiqueta="Contraseña inicial" error={errores.contrasena} ayuda="Compártala con el participante; podrá cambiarla con “¿Olvidó su contraseña?”.">
            <div className="campo__con-boton">
              <input id="p-contrasena" type={ver ? 'text' : 'password'} autoComplete="new-password" value={v.contrasena} onChange={cambiar('contrasena')} aria-invalid={Boolean(errores.contrasena)} />
              <button type="button" className="boton-icono" onClick={() => setVer((x) => !x)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {ver ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </Campo>
        )}
        <div className="dos-columnas">
          <Campo id="p-empresa" etiqueta="Empresa de procedencia (opcional)" error={errores.empresaProcedencia}>
            <input id="p-empresa" maxLength={150} value={v.empresaProcedencia} onChange={cambiar('empresaProcedencia')} />
          </Campo>
          <Campo id="p-curso" etiqueta="Curso de interés (opcional)">
            <select id="p-curso" value={v.idCursoInteres} onChange={cambiar('idCursoInteres')}>
              <option value="">Sin preferencia</option>
              {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.estandar})</option>)}
            </select>
          </Campo>
        </div>
        {esAlta && (
          <>
            <p className="auxiliar registro__nota">Documentos (opcionales aquí; se pueden agregar después en el expediente).</p>
            <div className="dos-columnas">
              <Campo id="p-tipoIdentificacion" etiqueta="Tipo de identificación">
                <select id="p-tipoIdentificacion" value={v.tipoIdentificacion} onChange={cambiar('tipoIdentificacion')}>
                  <option value="ine">INE</option><option value="pasaporte">Pasaporte</option>
                  <option value="cedula_profesional">Cédula profesional</option><option value="cartilla_militar">Cartilla militar</option>
                </select>
              </Campo>
              <CampoArchivo id="p-identificacion" etiqueta="Identificación" opcional error={errores.identificacion}
                archivo={docs.identificacion} onCambio={(a) => setDocs((d) => ({ ...d, identificacion: a }))} />
            </div>
            <CampoArchivo id="p-fotografia" etiqueta="Fotografía" opcional aceptar=".jpg,.jpeg,.png" error={errores.fotografia}
              archivo={docs.fotografia} onCambio={(a) => setDocs((d) => ({ ...d, fotografia: a }))} ayuda="JPG o PNG de 300 KB como máximo (CONOCER)." />
          </>
        )}
      </form>
    </Modal>
  )
}
