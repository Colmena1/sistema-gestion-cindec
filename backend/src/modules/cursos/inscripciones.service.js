const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const { registrarAuditoria } = require('../../utils/auditoria');
const ROLES = require('../../config/roles');
const { plantilla, enviarCorreo } = require('../notificaciones/correo.service');
const {
  Grupo, Curso, EstandarCompetencia, Sesion, Inscripcion, Participante, Usuario, Asistencia, sequelize,
} = require('../../models');

// ---------------------------------------------------------------------
// CU-07 Inscribir participante «include» CU-08 Validar cupo (RF-CUR-04)
// CU-09 Registrar asistencia (RF-CUR-10)
// Reglas (diseño, cap. 4 y diagrama de secuencia de inscripción, figura 14):
//  - solo en grupos planeados o en curso; la cuenta del participante debe estar activa;
//  - el cupo disponible se calcula (cupo − inscritos que no están de baja) y la validación se
//    hace con el renglón del grupo BLOQUEADO (SELECT … FOR UPDATE), para que dos personas
//    inscribiendo al mismo tiempo no puedan rebasar el cupo;
//  - un participante no se inscribe dos veces en el mismo grupo; si estaba de baja, se reactiva;
//  - la asistencia se toma en grupos en curso, por sesión, y no para sesiones futuras;
//    el instructor solo la toma en SUS grupos.
// ---------------------------------------------------------------------

const ocupados = (idGrupo, transaction) => Inscripcion.count({
  where: { id_grupo: idGrupo, estatus: { [Op.ne]: 'baja' } }, transaction,
});

async function grupoBloqueado(idGrupo, transaction) {
  const grupo = await Grupo.findByPk(idGrupo, { transaction, lock: transaction.LOCK.UPDATE });
  if (!grupo) throw new AppError(404, 'No se encontró el grupo.');
  return grupo;
}

// Otros grupos del mismo curso con lugares, para ofrecer una salida cuando no hay cupo (mockup M09b).
async function otrosGruposConLugar(grupo) {
  const grupos = await Grupo.findAll({
    where: { id_curso: grupo.id_curso, id_grupo: { [Op.ne]: grupo.id_grupo }, estatus: ['planeado', 'en_curso'] },
    attributes: {
      include: [[sequelize.literal("(SELECT COUNT(*) FROM inscripcion i WHERE i.id_grupo = Grupo.id_grupo AND i.estatus <> 'baja')"), 'inscritos']],
    },
    order: [['fecha_inicio', 'ASC']],
  });
  return grupos
    .map((g) => ({ id: g.id_grupo, clave: g.clave, fechaInicio: g.fecha_inicio, lugaresLibres: g.cupo - Number(g.get('inscritos')) }))
    .filter((g) => g.lugaresLibres > 0);
}

// Búsqueda de participantes para la ventana "Inscribir participante"
async function candidatos(idGrupo, buscar) {
  const grupo = await Grupo.findByPk(idGrupo);
  if (!grupo) throw new AppError(404, 'No se encontró el grupo.');
  const texto = `%${buscar}%`;
  const participantes = await Participante.findAll({
    where: {
      [Op.or]: [
        { curp: { [Op.like]: texto } },
        { '$usuario.nombre$': { [Op.like]: texto } },
        { '$usuario.apellidos$': { [Op.like]: texto } },
        sequelize.where(sequelize.fn('CONCAT', sequelize.col('usuario.nombre'), ' ', sequelize.col('usuario.apellidos')), { [Op.like]: texto }),
      ],
    },
    include: [
      { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellidos', 'activo'] },
      { model: Inscripcion, as: 'inscripciones', where: { id_grupo: idGrupo }, required: false, attributes: ['id_inscripcion', 'estatus'] },
    ],
    order: [[{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC']],
    limit: 8,
    subQuery: false,
  });
  return participantes.map((p) => {
    const insc = p.inscripciones[0];
    return {
      id: p.id_participante,
      nombre: `${p.usuario.nombre} ${p.usuario.apellidos}`,
      curp: p.curp,
      cuentaActiva: p.usuario.activo,
      situacion: !p.usuario.activo ? 'cuenta_desactivada' : insc && insc.estatus !== 'baja' ? 'inscrito' : insc ? 'baja' : 'disponible',
    };
  });
}

async function inscribir(idGrupo, { idParticipante, esRefuerzo = false }, idUsuario) {
  const resultado = await sequelize.transaction(async (t) => {
    const grupo = await grupoBloqueado(idGrupo, t);
    if (!['planeado', 'en_curso'].includes(grupo.estatus)) {
      throw new AppError(409, 'Solo se puede inscribir en grupos planeados o en curso.');
    }
    const participante = await Participante.findByPk(idParticipante, {
      include: { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellidos', 'correo', 'activo'] }, transaction: t,
    });
    if (!participante) throw new AppError(404, 'No se encontró el participante.');
    if (!participante.usuario.activo) throw new AppError(409, 'La cuenta del participante está desactivada. Actívela antes de inscribirlo.');

    const existente = await Inscripcion.findOne({ where: { id_grupo: idGrupo, id_participante: idParticipante }, transaction: t });
    if (existente && existente.estatus !== 'baja') {
      throw new AppError(409, `${participante.usuario.nombre} ${participante.usuario.apellidos} ya está inscrito(a) en este grupo.`);
    }

    // CU-08 Validar cupo
    const inscritos = await ocupados(idGrupo, t);
    if (inscritos >= grupo.cupo) {
      throw new AppError(409, `El grupo ya no tiene lugares disponibles. Los ${grupo.cupo} lugares están ocupados. Elija otro grupo del mismo curso o solicite que se amplíe el cupo.`,
        { sinCupo: true, otrosGrupos: await otrosGruposConLugar(grupo) });
    }

    let inscripcion;
    if (existente) {
      inscripcion = await existente.update({ estatus: 'inscrito', es_refuerzo: esRefuerzo, fecha_inscripcion: new Date() }, { transaction: t });
    } else {
      inscripcion = await Inscripcion.create({
        id_participante: idParticipante, id_grupo: idGrupo, es_refuerzo: esRefuerzo,
      }, { transaction: t });
    }
    await registrarAuditoria({
      idUsuario, accion: existente ? 'reinscribir' : 'inscribir', entidad: 'inscripcion', idRegistro: inscripcion.id_inscripcion,
      detalle: `${participante.usuario.nombre} ${participante.usuario.apellidos} en el grupo ${grupo.clave}${esRefuerzo ? ' (refuerzo)' : ''}; lugares ocupados: ${inscritos + 1} de ${grupo.cupo}`,
    }, t);
    return { grupo, participante, lugaresLibres: grupo.cupo - inscritos - 1 };
  });

  notificarInscripcion(resultado.grupo.id_grupo, resultado.participante.usuario)
    .catch((err) => console.error('No se pudo enviar el correo de inscripción:', err.message));
  return { lugaresLibres: resultado.lugaresLibres };
}

// Aviso por correo al participante (RF-NOT-01)
async function notificarInscripcion(idGrupo, usuario) {
  const grupo = await Grupo.findByPk(idGrupo, {
    include: [
      { model: Curso, as: 'curso', include: { model: EstandarCompetencia, as: 'estandar' } },
      { model: Sesion, as: 'sesiones' },
    ],
    order: [[{ model: Sesion, as: 'sesiones' }, 'fecha', 'ASC']],
  });
  const f = (iso) => iso.split('-').reverse().join('/');
  const primera = grupo.sesiones[0];
  const modalidad = { presencial: 'Presencial', en_linea: 'En línea', mixta: 'Mixta' }[grupo.modalidad];
  await enviarCorreo({
    para: usuario.correo,
    asunto: `Inscripción confirmada: ${grupo.curso.nombre} — Sistema CINDEC`,
    html: plantilla({
      titulo: 'Su inscripción quedó confirmada',
      parrafos: [
        `Hola, ${usuario.nombre}.`,
        `Quedó inscrito(a) en el curso <strong>${grupo.curso.nombre}</strong> (${grupo.curso.estandar.codigo}), grupo <strong>${grupo.clave}</strong>.`,
        `Fechas: del ${f(grupo.fecha_inicio)} al ${f(grupo.fecha_fin)} · Modalidad: ${modalidad}.`,
        primera ? `Primera sesión: ${f(primera.fecha)} de ${primera.hora_inicio.slice(0, 5)} a ${primera.hora_fin.slice(0, 5)}.` : 'Las fechas de las sesiones se publicarán en el sistema.',
      ],
      boton: { texto: 'Ver mis cursos', url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mis-cursos` },
    }),
    texto: `Hola, ${usuario.nombre}. Quedó inscrito(a) en ${grupo.curso.nombre}, grupo ${grupo.clave}, del ${f(grupo.fecha_inicio)} al ${f(grupo.fecha_fin)}.`,
  });
}

// Baja, reactivación o capacitación concluida (RF-EVA-03: "capacitación concluida" vive en la inscripción)
async function cambiarEstatus(idInscripcion, estatus, idUsuario) {
  return sequelize.transaction(async (t) => {
    const inscripcion = await Inscripcion.findByPk(idInscripcion, {
      include: { model: Participante, as: 'participante', include: { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellidos'] } },
      transaction: t,
    });
    if (!inscripcion) throw new AppError(404, 'No se encontró la inscripción.');
    const grupo = await grupoBloqueado(inscripcion.id_grupo, t);
    if (inscripcion.estatus === estatus) throw new AppError(400, 'La inscripción ya tiene ese estatus.');
    if (['concluido', 'cancelado'].includes(grupo.estatus) && estatus !== 'capacitacion_concluida') {
      throw new AppError(409, 'El grupo ya está cerrado; solo se puede marcar la capacitación como concluida.');
    }
    if (estatus === 'inscrito' && inscripcion.estatus === 'baja') {
      if (await ocupados(grupo.id_grupo, t) >= grupo.cupo) throw new AppError(409, 'No se puede reactivar: el grupo ya no tiene lugares disponibles.');
    }
    if (estatus === 'capacitacion_concluida' && !['en_curso', 'concluido'].includes(grupo.estatus)) {
      throw new AppError(409, 'La capacitación solo se marca como concluida cuando el grupo está en curso o concluido.');
    }
    if (estatus === 'capacitacion_concluida' && inscripcion.estatus === 'baja') {
      throw new AppError(409, 'Un participante dado de baja no puede concluir la capacitación. Reactívelo primero.');
    }
    const anterior = inscripcion.estatus;
    await inscripcion.update({ estatus }, { transaction: t });
    const nombre = `${inscripcion.participante.usuario.nombre} ${inscripcion.participante.usuario.apellidos}`;
    await registrarAuditoria({
      idUsuario, accion: 'cambiar_estatus', entidad: 'inscripcion', idRegistro: inscripcion.id_inscripcion,
      detalle: `${nombre}, grupo ${grupo.clave}: ${anterior} → ${estatus}`,
    }, t);
    return { nombre, estatus };
  });
}

// ---------- Asistencia (CU-09) ----------
// El instructor solo puede tomar asistencia en los grupos que tiene asignados.
async function sesionConPermiso(idSesion, solicitante, transaction) {
  const sesion = await Sesion.findByPk(idSesion, {
    include: { model: Grupo, as: 'grupo', include: { model: Curso, as: 'curso', attributes: ['nombre'] } }, transaction,
  });
  if (!sesion) throw new AppError(404, 'No se encontró la sesión.');
  if (solicitante.rol === ROLES.INSTRUCTOR && sesion.grupo.id_instructor !== solicitante.id) {
    throw new AppError(403, 'Solo puede registrar la asistencia de los grupos que tiene asignados.');
  }
  return sesion;
}

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

async function obtenerAsistencia(idSesion, solicitante) {
  const sesion = await sesionConPermiso(idSesion, solicitante);
  const inscripciones = await Inscripcion.findAll({
    where: { id_grupo: sesion.id_grupo, estatus: { [Op.ne]: 'baja' } },
    include: [
      { model: Participante, as: 'participante', attributes: ['curp'], include: { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellidos'] } },
      { model: Asistencia, as: 'asistencias', where: { id_sesion: idSesion }, required: false },
    ],
    order: [[{ model: Participante, as: 'participante' }, { model: Usuario, as: 'usuario' }, 'nombre', 'ASC']],
  });
  const grupo = sesion.grupo;
  const sesionesGrupo = await Sesion.findAll({ where: { id_grupo: grupo.id_grupo }, order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']] });
  let motivoSoloLectura = null;
  if (grupo.estatus !== 'en_curso') motivoSoloLectura = grupo.estatus === 'planeado' ? 'El grupo todavía no inicia; la asistencia se toma cuando esté en curso.' : 'El grupo ya está cerrado.';
  else if (sesion.fecha > hoyISO()) motivoSoloLectura = 'Esta sesión todavía no ocurre.';
  return {
    sesion: { id: sesion.id_sesion, fecha: sesion.fecha, horaInicio: sesion.hora_inicio.slice(0, 5), horaFin: sesion.hora_fin.slice(0, 5), tema: sesion.tema },
    grupo: { id: grupo.id_grupo, clave: grupo.clave, curso: grupo.curso.nombre, estatus: grupo.estatus },
    sesionesGrupo: sesionesGrupo.map((x, n) => ({
      id: x.id_sesion, numero: n + 1, fecha: x.fecha, horaInicio: x.hora_inicio.slice(0, 5), horaFin: x.hora_fin.slice(0, 5),
    })),
    editable: !motivoSoloLectura,
    motivoSoloLectura,
    registros: inscripciones.map((i) => ({
      idInscripcion: i.id_inscripcion,
      nombre: `${i.participante.usuario.nombre} ${i.participante.usuario.apellidos}`,
      curp: i.participante.curp,
      asistio: i.asistencias[0] ? i.asistencias[0].asistio : null,
      observaciones: i.asistencias[0]?.observaciones || '',
    })),
  };
}

async function guardarAsistencia(idSesion, registros, solicitante) {
  return sequelize.transaction(async (t) => {
    const sesion = await sesionConPermiso(idSesion, solicitante, t);
    if (sesion.grupo.estatus !== 'en_curso') throw new AppError(409, 'La asistencia solo se registra en grupos en curso.');
    if (sesion.fecha > hoyISO()) throw new AppError(409, 'No se puede registrar asistencia de una sesión que todavía no ocurre.');

    const validas = await Inscripcion.findAll({
      where: { id_grupo: sesion.id_grupo, estatus: { [Op.ne]: 'baja' } }, attributes: ['id_inscripcion'], transaction: t,
    });
    const ids = new Set(validas.map((i) => i.id_inscripcion));
    for (const r of registros) {
      if (!ids.has(r.idInscripcion)) throw new AppError(400, 'Uno de los participantes no pertenece a este grupo.');
    }

    let presentes = 0;
    for (const r of registros) {
      const [registro, creado] = await Asistencia.findOrCreate({
        where: { id_inscripcion: r.idInscripcion, id_sesion: sesion.id_sesion },
        defaults: { asistio: r.asistio, observaciones: r.observaciones || null },
        transaction: t,
      });
      if (!creado) await registro.update({ asistio: r.asistio, observaciones: r.observaciones || null }, { transaction: t });
      if (r.asistio) presentes += 1;
    }
    await registrarAuditoria({
      idUsuario: solicitante.id, accion: 'registrar_asistencia', entidad: 'sesion', idRegistro: sesion.id_sesion,
      detalle: `Grupo ${sesion.grupo.clave}, sesión del ${sesion.fecha}: ${presentes} de ${registros.length} asistieron`,
    }, t);
    return { presentes, total: registros.length };
  });
}

module.exports = { candidatos, inscribir, cambiarEstatus, obtenerAsistencia, guardarAsistencia };
