const { Op } = require('sequelize');
const { plantilla, enviarCorreo } = require('./correo.service');
const { registrarAuditoria } = require('../../utils/auditoria');
const ROLES = require('../../config/roles');
const {
  Sesion, Grupo, Curso, EstandarCompetencia, Inscripcion, Participante, Usuario, Rol,
  IntentoEvaluacion, Evaluacion, Auditoria, sequelize,
} = require('../../models');

// ---------------------------------------------------------------------
// Notificaciones: recordatorios por correo (RF-NOT-01, CU-21).
//  - Próxima sesión: el día anterior a cada sesión se avisa a los inscritos (sin baja) y al instructor.
//  - Evaluación pendiente: al iniciar un intento se avisa al participante, y una vez al día se envía
//    al evaluador la lista de evaluaciones que tiene pendientes de calificar.
// Para no enviar dos veces el mismo recordatorio (sin modificar la base de datos, ADR-0004), cada envío
// se registra en la tabla auditoria y se consulta ahí antes de volver a enviar.
// Los recordatorios se revisan solos cada hora (desde las 8:00) y la coordinación puede lanzarlos a mano.
// ---------------------------------------------------------------------

const URL = () => process.env.FRONTEND_URL || 'http://localhost:5173';
const zona = { timeZone: 'America/Mexico_City' };
const fechaMx = (d) => new Intl.DateTimeFormat('en-CA', zona).format(d); // YYYY-MM-DD
const hoy = () => fechaMx(new Date());
const manana = () => fechaMx(new Date(Date.now() + 24 * 60 * 60 * 1000));
const dmy = (iso) => iso.split('-').reverse().join('/');
const nombre = (u) => `${u.nombre} ${u.apellidos}`;
const MODALIDAD = { presencial: 'Presencial', en_linea: 'En línea', mixta: 'Mixta' };

// Envía y nunca lanza error: devuelve true/false para contar
async function enviar(datos) {
  try { await enviarCorreo(datos); return true; } catch (err) {
    console.error(`No se pudo enviar el correo a ${datos.para}:`, err.message);
    return false;
  }
}

// Usuario que firma en la auditoría los envíos automáticos: el primer administrador activo
async function usuarioSistema() {
  const admin = await Usuario.findOne({ where: { activo: true }, include: { model: Rol, as: 'rol', where: { nombre: ROLES.ADMIN } }, order: [['id_usuario', 'ASC']] });
  return admin ? admin.id_usuario : null;
}

async function yaEnviado(accion, entidad, idRegistro, desde) {
  const where = { accion, entidad_afectada: entidad, id_registro_afectado: idRegistro };
  if (desde) where.fecha_hora = { [Op.gte]: desde };
  return Boolean(await Auditoria.count({ where }));
}

async function anotar(idUsuario, accion, entidad, idRegistro, detalle) {
  await sequelize.transaction((t) => registrarAuditoria({ idUsuario, accion, entidad, idRegistro, detalle }, t));
}

// ---------- Próxima sesión ----------
async function recordatoriosDeSesiones(idUsuario) {
  const fecha = manana();
  const sesiones = await Sesion.findAll({
    where: { fecha },
    include: {
      model: Grupo, as: 'grupo', where: { estatus: { [Op.in]: ['planeado', 'en_curso'] } },
      include: [
        { model: Curso, as: 'curso', include: { model: EstandarCompetencia, as: 'estandar', attributes: ['codigo'] } },
        { model: Usuario, as: 'instructor', attributes: ['nombre', 'apellidos', 'correo'] },
      ],
    },
    order: [['hora_inicio', 'ASC']],
  });
  const resultado = { sesiones: 0, correos: 0, fallidos: 0, omitidas: 0 };
  for (const s of sesiones) {
    if (await yaEnviado('recordatorio_sesion', 'sesion', s.id_sesion)) { resultado.omitidas += 1; continue; }
    const g = s.grupo;
    const inscritos = await Inscripcion.findAll({
      where: { id_grupo: g.id_grupo, estatus: { [Op.ne]: 'baja' } },
      include: { model: Participante, as: 'participante', include: { model: Usuario, as: 'usuario', where: { activo: true }, attributes: ['nombre', 'apellidos', 'correo'] } },
    });
    const horario = `${s.hora_inicio.slice(0, 5)} a ${s.hora_fin.slice(0, 5)}`;
    const lugar = g.modalidad === 'presencial'
      ? 'Modalidad presencial en las instalaciones de CINDEC.'
      : `Modalidad ${MODALIDAD[g.modalidad].toLowerCase()}${g.enlace_videoconferencia ? `. Enlace: <a href="${g.enlace_videoconferencia}">${g.enlace_videoconferencia}</a>` : '.'}`;
    const destinatarios = inscritos.map((i) => ({ usuario: i.participante.usuario, boton: { texto: 'Ver mis cursos', url: `${URL()}/mis-cursos` } }));
    if (g.instructor) destinatarios.push({ usuario: g.instructor, boton: { texto: 'Ver mis grupos', url: `${URL()}/mis-grupos` }, esInstructor: true });
    let enviados = 0;
    for (const d of destinatarios) {
      const ok = await enviar({
        para: d.usuario.correo,
        asunto: `Recordatorio: sesión de ${g.curso.nombre} mañana ${dmy(fecha)}`,
        html: plantilla({
          titulo: 'Recordatorio de su próxima sesión',
          parrafos: [
            `Hola, ${d.usuario.nombre}.`,
            `${d.esInstructor ? 'Mañana imparte' : 'Mañana tiene'} una sesión del curso <strong>${g.curso.nombre}</strong> (${g.curso.estandar.codigo}), grupo <strong>${g.clave}</strong>.`,
            `Fecha: <strong>${dmy(fecha)}</strong>, de <strong>${horario}</strong>${s.tema ? ` · Tema: ${s.tema}` : ''}.`,
            lugar,
          ],
          boton: d.boton,
        }),
        texto: `Hola, ${d.usuario.nombre}. Recordatorio: sesión de ${g.curso.nombre} (grupo ${g.clave}) el ${dmy(fecha)} de ${horario}.`,
      });
      if (ok) enviados += 1; else resultado.fallidos += 1;
    }
    resultado.sesiones += 1;
    resultado.correos += enviados;
    // Solo se marca como enviado si salió al menos un correo (si todos fallaron, se reintenta en la siguiente revisión)
    if (enviados > 0 && idUsuario) {
      await anotar(idUsuario, 'recordatorio_sesion', 'sesion', s.id_sesion, `Grupo ${g.clave}, sesión del ${dmy(fecha)} ${horario}: ${enviados} de ${destinatarios.length} correo(s) enviados`);
    }
  }
  return resultado;
}

// ---------- Evaluaciones pendientes (resumen diario para cada evaluador) ----------
async function recordatoriosDeEvaluacion(idUsuario) {
  const pendientes = await IntentoEvaluacion.findAll({
    where: { estatus: 'pendiente' },
    include: [
      { model: Evaluacion, as: 'evaluacion', attributes: ['nombre'] },
      {
        model: Inscripcion, as: 'inscripcion',
        include: [
          { model: Participante, as: 'participante', include: { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellidos'] } },
          { model: Grupo, as: 'grupo', attributes: ['clave', 'id_evaluador'], include: { model: Usuario, as: 'evaluador', attributes: ['id_usuario', 'nombre', 'apellidos', 'correo', 'activo'] } },
        ],
      },
    ],
    order: [['fecha_aplicacion', 'ASC']],
  });
  const porEvaluador = new Map();
  pendientes.forEach((p) => {
    const ev = p.inscripcion.grupo.evaluador;
    if (!ev || !ev.activo) return;
    if (!porEvaluador.has(ev.id_usuario)) porEvaluador.set(ev.id_usuario, { evaluador: ev, lista: [] });
    porEvaluador.get(ev.id_usuario).lista.push(p);
  });
  const inicioDelDia = new Date(`${hoy()}T00:00:00-06:00`);
  const resultado = { evaluadores: 0, correos: 0, fallidos: 0, omitidos: 0 };
  for (const { evaluador, lista } of porEvaluador.values()) {
    if (await yaEnviado('recordatorio_evaluacion', 'usuario', evaluador.id_usuario, inicioDelDia)) { resultado.omitidos += 1; continue; }
    const filas = lista.map((p) => `<li>${nombre(p.inscripcion.participante.usuario)} · grupo ${p.inscripcion.grupo.clave} · intento ${p.numero_intento} (iniciado el ${dmy(p.fecha_aplicacion)})</li>`).join('');
    const ok = await enviar({
      para: evaluador.correo,
      asunto: `Tiene ${lista.length} evaluación(es) pendiente(s) de calificar — Sistema CINDEC`,
      html: plantilla({
        titulo: 'Evaluaciones pendientes de calificar',
        parrafos: [`Hola, ${evaluador.nombre}.`, `Tiene ${lista.length} intento(s) de evaluación iniciado(s) que todavía no tienen resultado:`, `<ul style="margin:0;padding-left:20px">${filas}</ul>`],
        boton: { texto: 'Ir a Por evaluar', url: `${URL()}/por-evaluar` },
      }),
      texto: `Hola, ${evaluador.nombre}. Tiene ${lista.length} evaluación(es) pendiente(s) de calificar en el Sistema CINDEC.`,
    });
    resultado.evaluadores += 1;
    if (ok) {
      resultado.correos += 1;
      if (idUsuario) await anotar(idUsuario, 'recordatorio_evaluacion', 'usuario', evaluador.id_usuario, `${lista.length} evaluación(es) pendiente(s) para ${nombre(evaluador)}`);
    } else resultado.fallidos += 1;
  }
  return resultado;
}

// Ejecuta todos los recordatorios. idUsuario: quien los lanza (o el administrador si es automático)
async function ejecutar(idUsuario) {
  const firma = idUsuario || await usuarioSistema();
  const sesiones = await recordatoriosDeSesiones(firma);
  const evaluaciones = await recordatoriosDeEvaluacion(firma);
  return { fecha: hoy(), sesiones, evaluaciones };
}

// ---------- Aviso inmediato al participante cuando se inicia su evaluación ----------
async function avisarEvaluacionPendiente(idIntento) {
  const p = await IntentoEvaluacion.findByPk(idIntento, {
    include: [
      { model: Evaluacion, as: 'evaluacion', attributes: ['nombre'] },
      {
        model: Inscripcion, as: 'inscripcion',
        include: [
          { model: Participante, as: 'participante', include: { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellidos', 'correo'] } },
          { model: Grupo, as: 'grupo', include: [{ model: Curso, as: 'curso', include: { model: EstandarCompetencia, as: 'estandar', attributes: ['codigo', 'nombre'] } }, { model: Usuario, as: 'evaluador', attributes: ['nombre', 'apellidos'] }] },
        ],
      },
    ],
  });
  if (!p) return false;
  const u = p.inscripcion.participante.usuario;
  const g = p.inscripcion.grupo;
  return enviar({
    para: u.correo,
    asunto: `Evaluación pendiente: ${g.curso.estandar.codigo} — Sistema CINDEC`,
    html: plantilla({
      titulo: 'Tiene una evaluación en proceso',
      parrafos: [
        `Hola, ${u.nombre}.`,
        `Se inició su evaluación del estándar <strong>${g.curso.estandar.codigo} ${g.curso.estandar.nombre}</strong> (intento ${p.numero_intento}), grupo ${g.clave}.`,
        g.evaluador ? `Su evaluador(a) es ${nombre(g.evaluador)}. Cuando registre el resultado lo verá en "Mi historial".` : 'Cuando se registre el resultado lo verá en "Mi historial".',
      ],
      boton: { texto: 'Ver mi historial', url: `${URL()}/mi-historial` },
    }),
    texto: `Hola, ${u.nombre}. Se inició su evaluación del estándar ${g.curso.estandar.codigo} (intento ${p.numero_intento}).`,
  });
}

// ---------- Revisión automática ----------
let programado = null;
function iniciarProgramador() {
  if (process.env.RECORDATORIOS_AUTOMATICOS === 'false' || programado) return;
  const revisar = async () => {
    const hora = Number(new Intl.DateTimeFormat('en-US', { ...zona, hour: 'numeric', hour12: false }).format(new Date()));
    if (hora < 8 || hora >= 21) return; // solo en horario de oficina
    try {
      const r = await ejecutar(null);
      if (r.sesiones.correos || r.evaluaciones.correos) console.log(`Recordatorios enviados: ${r.sesiones.correos} de sesiones, ${r.evaluaciones.correos} de evaluaciones.`);
    } catch (err) {
      console.error('Error al revisar recordatorios:', err.message);
    }
  };
  setTimeout(revisar, 60 * 1000); // primera revisión un minuto después de arrancar
  programado = setInterval(revisar, 60 * 60 * 1000); // luego cada hora
  console.log('Recordatorios por correo: revisión automática cada hora (8:00 a 21:00).');
}

module.exports = { ejecutar, avisarEvaluacionPendiente, iniciarProgramador };
