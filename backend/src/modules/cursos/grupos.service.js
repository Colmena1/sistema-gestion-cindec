const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const { registrarAuditoria } = require('../../utils/auditoria');
const ROLES = require('../../config/roles');
const {
  Grupo, Curso, EstandarCompetencia, Usuario, Rol, Sesion, Inscripcion, Participante, Asistencia, sequelize,
} = require('../../models');

// ---------------------------------------------------------------------
// Grupos y sesiones (CU-05, RF-CUR-02, 05, 08 y 09)
// El grupo es la oferta concreta de un curso: fechas, cupo, modalidad, instructor y evaluador.
// Reglas de negocio (diseño lógico, cap. 4):
//  - el curso debe estar activo; la clave del grupo es única (se genera sola si no se escribe);
//  - el instructor y el evaluador deben ser usuarios activos con ese rol;
//  - en línea o mixta: enlace de videoconferencia (RF-CUR-09);
//  - el cupo no puede quedar por debajo de los inscritos activos;
//  - estatus: planeado → en curso → concluido; planeado o en curso → cancelado (RF-CUR-08);
//    para iniciar se requiere instructor y al menos una sesión;
//  - un grupo concluido o cancelado ya no se modifica (RNF-10);
//  - las sesiones caen dentro de las fechas del grupo y no se borran si ya tienen asistencia.
// ---------------------------------------------------------------------

const ESTATUS_EDITABLE = ['planeado', 'en_curso'];
const TRANSICIONES = {
  planeado: ['en_curso', 'cancelado'],
  en_curso: ['concluido', 'cancelado'],
  concluido: [],
  cancelado: [],
};
const NOMBRE_ESTATUS = { planeado: 'Planeado', en_curso: 'En curso', concluido: 'Concluido', cancelado: 'Cancelado' };

const persona = (as) => ({ model: Usuario, as, attributes: ['id_usuario', 'nombre', 'apellidos', 'activo'] });
const incluirCurso = {
  model: Curso, as: 'curso', attributes: ['id_curso', 'nombre', 'activo'],
  include: { model: EstandarCompetencia, as: 'estandar', attributes: ['id_estandar', 'codigo', 'nombre'] },
};

// Inscritos que ocupan lugar: todos menos los dados de baja.
const contarInscritos = [
  sequelize.literal("(SELECT COUNT(*) FROM inscripcion i WHERE i.id_grupo = Grupo.id_grupo AND i.estatus <> 'baja')"),
  'inscritos',
];
const contarSesiones = [
  sequelize.literal('(SELECT COUNT(*) FROM sesion s WHERE s.id_grupo = Grupo.id_grupo)'),
  'totalSesiones', // no se llama "sesiones" para no chocar con la relación Grupo → sesiones
];

const nombreDe = (u) => (u ? { id: u.id_usuario, nombre: `${u.nombre} ${u.apellidos}` } : null);

function aRespuesta(g) {
  const inscritos = g.get('inscritos') !== undefined ? Number(g.get('inscritos')) : undefined;
  return {
    id: g.id_grupo,
    clave: g.clave,
    idCurso: g.id_curso,
    curso: g.curso ? { id: g.curso.id_curso, nombre: g.curso.nombre, estandar: g.curso.estandar?.codigo, nombreEstandar: g.curso.estandar?.nombre } : undefined,
    fechaInicio: g.fecha_inicio,
    fechaFin: g.fecha_fin,
    cupo: g.cupo,
    inscritos,
    lugaresLibres: inscritos !== undefined ? Math.max(0, g.cupo - inscritos) : undefined,
    modalidad: g.modalidad,
    estatus: g.estatus,
    enlaceVideoconferencia: g.enlace_videoconferencia,
    instructor: nombreDe(g.instructor),
    evaluador: nombreDe(g.evaluador),
    totalSesiones: g.get('totalSesiones') !== undefined ? Number(g.get('totalSesiones')) : undefined,
  };
}

// ---------- Consultas ----------
async function listar({ buscar, idCurso, estatus, pagina = 1, limite = 10 }) {
  const where = {};
  if (buscar) where.clave = { [Op.like]: `%${buscar}%` };
  if (idCurso) where.id_curso = idCurso;
  if (estatus) where.estatus = estatus;
  const { rows, count } = await Grupo.findAndCountAll({
    where,
    include: [incluirCurso, persona('instructor'), persona('evaluador')],
    attributes: { include: [contarInscritos, contarSesiones] },
    order: [
      [sequelize.literal("FIELD(Grupo.estatus, 'en_curso', 'planeado', 'concluido', 'cancelado')"), 'ASC'],
      ['fecha_inicio', 'ASC'],
    ],
    limit: limite,
    offset: (pagina - 1) * limite,
    distinct: true,
  });
  return { grupos: rows.map(aRespuesta), total: count, pagina, paginas: Math.max(1, Math.ceil(count / limite)) };
}

async function buscarPorId(id, transaction) {
  const grupo = await Grupo.findByPk(id, {
    include: [incluirCurso, persona('instructor'), persona('evaluador')],
    attributes: { include: [contarInscritos] },
    transaction,
  });
  if (!grupo) throw new AppError(404, 'No se encontró el grupo.');
  return grupo;
}

// Detalle del grupo (P-08): datos, sesiones e inscritos.
async function obtenerDetalle(id) {
  const grupo = await buscarPorId(id);
  const sesiones = await Sesion.findAll({ where: { id_grupo: id }, order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']] });
  const inscripciones = await Inscripcion.findAll({
    where: { id_grupo: id },
    include: { model: Participante, as: 'participante', include: { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellidos', 'correo'] } },
    order: [['fecha_inscripcion', 'ASC']],
  });
  return {
    ...aRespuesta(grupo),
    transicionesPermitidas: TRANSICIONES[grupo.estatus],
    sesiones: sesiones.map((s, i) => ({
      id: s.id_sesion, numero: i + 1, fecha: s.fecha,
      horaInicio: s.hora_inicio?.slice(0, 5), horaFin: s.hora_fin?.slice(0, 5), tema: s.tema,
    })),
    inscritosLista: inscripciones.map((i) => ({
      idInscripcion: i.id_inscripcion,
      idParticipante: i.id_participante,
      nombre: `${i.participante.usuario.nombre} ${i.participante.usuario.apellidos}`,
      curp: i.participante.curp,
      empresa: i.participante.empresa_procedencia,
      fechaInscripcion: i.fecha_inscripcion,
      estatus: i.estatus,
      esRefuerzo: i.es_refuerzo,
    })),
  };
}

// Instructores y evaluadores activos para las listas de selección.
async function personalDisponible() {
  const buscarRol = (nombre) => Usuario.findAll({
    where: { activo: true },
    include: { model: Rol, as: 'rol', where: { nombre }, attributes: [] },
    attributes: ['id_usuario', 'nombre', 'apellidos'],
    order: [['nombre', 'ASC'], ['apellidos', 'ASC']],
  });
  const [instructores, evaluadores] = await Promise.all([buscarRol(ROLES.INSTRUCTOR), buscarRol(ROLES.EVALUADOR)]);
  return { instructores: instructores.map(nombreDe), evaluadores: evaluadores.map(nombreDe) };
}

// ---------- Validaciones de negocio ----------
async function validarPersona(idUsuario, rolEsperado, etiqueta, transaction) {
  if (!idUsuario) return null;
  const usuario = await Usuario.findByPk(idUsuario, { include: { model: Rol, as: 'rol' }, transaction });
  if (!usuario || !usuario.activo || usuario.rol.nombre !== rolEsperado) {
    throw new AppError(400, `El ${etiqueta} seleccionado no es un usuario activo con rol ${rolEsperado}.`);
  }
  return usuario;
}

function validarFechas(inicio, fin) {
  if (fin < inicio) throw new AppError(400, 'La fecha de fin no puede ser anterior a la fecha de inicio.');
}

function validarEnlace(modalidad, enlace) {
  if (modalidad !== 'presencial' && !enlace) {
    throw new AppError(400, 'Para un grupo en línea o mixto escriba el enlace de la videoconferencia.');
  }
}

// Clave automática: código del estándar (sin versión) + año + consecutivo, p. ej. EC0301-2026-03
async function generarClave(curso, fechaInicio, transaction) {
  const base = `${curso.estandar.codigo.split('.')[0]}-${fechaInicio.slice(0, 4)}-`;
  const existentes = await Grupo.findAll({ where: { clave: { [Op.like]: `${base}%` } }, attributes: ['clave'], transaction });
  const mayor = existentes.reduce((max, g) => Math.max(max, Number(g.clave.slice(base.length)) || 0), 0);
  return `${base}${String(mayor + 1).padStart(2, '0')}`;
}

async function verificarClaveLibre(clave, idExcluir, transaction) {
  const where = { clave };
  if (idExcluir) where.id_grupo = { [Op.ne]: idExcluir };
  if (await Grupo.findOne({ where, transaction })) throw new AppError(409, `Ya existe un grupo con la clave ${clave}.`);
}

function verificarEditable(grupo) {
  if (!ESTATUS_EDITABLE.includes(grupo.estatus)) {
    throw new AppError(409, `El grupo está ${NOMBRE_ESTATUS[grupo.estatus].toLowerCase()} y ya no se puede modificar.`);
  }
}

// ---------- Altas y cambios ----------
async function crear(d, idUsuario) {
  return sequelize.transaction(async (t) => {
    const curso = await Curso.findByPk(d.idCurso, { include: { model: EstandarCompetencia, as: 'estandar' }, transaction: t });
    if (!curso) throw new AppError(400, 'El curso seleccionado no existe.');
    if (!curso.activo) throw new AppError(400, `El curso "${curso.nombre}" está desactivado.`);
    validarFechas(d.fechaInicio, d.fechaFin);
    validarEnlace(d.modalidad, d.enlaceVideoconferencia);
    const instructor = await validarPersona(d.idInstructor, ROLES.INSTRUCTOR, 'instructor', t);
    const evaluador = await validarPersona(d.idEvaluador, ROLES.EVALUADOR, 'evaluador', t);

    const clave = d.clave || await generarClave(curso, d.fechaInicio, t);
    await verificarClaveLibre(clave, null, t);

    const grupo = await Grupo.create({
      id_curso: curso.id_curso,
      id_instructor: instructor?.id_usuario || null,
      id_evaluador: evaluador?.id_usuario || null,
      clave,
      fecha_inicio: d.fechaInicio,
      fecha_fin: d.fechaFin,
      cupo: d.cupo,
      modalidad: d.modalidad,
      enlace_videoconferencia: d.modalidad === 'presencial' ? null : d.enlaceVideoconferencia,
    }, { transaction: t });

    await registrarAuditoria({
      idUsuario, accion: 'crear', entidad: 'grupo', idRegistro: grupo.id_grupo,
      detalle: `Alta del grupo ${clave} del curso "${curso.nombre}" (${d.fechaInicio} a ${d.fechaFin}, cupo ${d.cupo}, ${d.modalidad})`,
    }, t);
    return aRespuesta(await buscarPorId(grupo.id_grupo, t));
  });
}

async function actualizar(id, d, idUsuario) {
  return sequelize.transaction(async (t) => {
    const grupo = await buscarPorId(id, t);
    verificarEditable(grupo);
    const cambios = {};
    const detalle = [];
    const anotar = (campo, etiqueta, antes, despues) => {
      cambios[campo] = despues;
      detalle.push(`${etiqueta}: "${antes ?? ''}" → "${despues ?? ''}"`);
    };

    if (d.clave !== undefined && d.clave && d.clave !== grupo.clave) {
      await verificarClaveLibre(d.clave, grupo.id_grupo, t);
      anotar('clave', 'clave', grupo.clave, d.clave);
    }
    const inicio = d.fechaInicio ?? grupo.fecha_inicio;
    const fin = d.fechaFin ?? grupo.fecha_fin;
    validarFechas(inicio, fin);
    if (inicio !== grupo.fecha_inicio || fin !== grupo.fecha_fin) {
      const fuera = await Sesion.count({
        where: { id_grupo: grupo.id_grupo, [Op.or]: [{ fecha: { [Op.lt]: inicio } }, { fecha: { [Op.gt]: fin } }] }, transaction: t,
      });
      if (fuera) throw new AppError(409, `Hay ${fuera} sesión(es) fuera de las fechas nuevas. Ajuste o elimine esas sesiones primero.`);
      if (inicio !== grupo.fecha_inicio) anotar('fecha_inicio', 'inicio', grupo.fecha_inicio, inicio);
      if (fin !== grupo.fecha_fin) anotar('fecha_fin', 'fin', grupo.fecha_fin, fin);
    }
    if (d.cupo !== undefined && d.cupo !== grupo.cupo) {
      const inscritos = Number(grupo.get('inscritos'));
      if (d.cupo < inscritos) throw new AppError(409, `El grupo ya tiene ${inscritos} inscritos; el cupo no puede ser menor.`);
      anotar('cupo', 'cupo', grupo.cupo, d.cupo);
    }
    const modalidad = d.modalidad ?? grupo.modalidad;
    const enlace = modalidad === 'presencial' ? null : (d.enlaceVideoconferencia !== undefined ? d.enlaceVideoconferencia : grupo.enlace_videoconferencia);
    validarEnlace(modalidad, enlace);
    if (modalidad !== grupo.modalidad) anotar('modalidad', 'modalidad', grupo.modalidad, modalidad);
    if ((enlace || null) !== (grupo.enlace_videoconferencia || null)) anotar('enlace_videoconferencia', 'enlace', grupo.enlace_videoconferencia, enlace);

    for (const [campo, clave, rol, etiqueta] of [
      ['id_instructor', 'idInstructor', ROLES.INSTRUCTOR, 'instructor'],
      ['id_evaluador', 'idEvaluador', ROLES.EVALUADOR, 'evaluador'],
    ]) {
      if (d[clave] === undefined) continue;
      const nuevo = d[clave] || null;
      if (nuevo === grupo[campo]) continue;
      if (!nuevo && grupo.estatus === 'en_curso' && campo === 'id_instructor') {
        throw new AppError(409, 'Un grupo en curso debe tener instructor.');
      }
      const persona = await validarPersona(nuevo, rol, etiqueta, t);
      const antes = grupo[campo === 'id_instructor' ? 'instructor' : 'evaluador'];
      anotar(campo, etiqueta, antes ? `${antes.nombre} ${antes.apellidos}` : 'sin asignar', persona ? `${persona.nombre} ${persona.apellidos}` : 'sin asignar');
      cambios[campo] = nuevo;
    }

    if (!Object.keys(cambios).length) throw new AppError(400, 'No hay cambios que guardar.');
    await grupo.update(cambios, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: 'modificar', entidad: 'grupo', idRegistro: grupo.id_grupo, detalle: `${grupo.clave}: ${detalle.join('; ')}`,
    }, t);
    return aRespuesta(await buscarPorId(grupo.id_grupo, t));
  });
}

// Cambio de estatus (RF-CUR-08)
async function cambiarEstatus(id, estatus, idUsuario) {
  return sequelize.transaction(async (t) => {
    const grupo = await buscarPorId(id, t);
    if (!TRANSICIONES[grupo.estatus].includes(estatus)) {
      throw new AppError(409, `Un grupo ${NOMBRE_ESTATUS[grupo.estatus].toLowerCase()} no puede pasar a ${NOMBRE_ESTATUS[estatus].toLowerCase()}.`);
    }
    if (estatus === 'en_curso') {
      if (!grupo.id_instructor) throw new AppError(409, 'Asigne un instructor antes de iniciar el grupo.');
      const sesiones = await Sesion.count({ where: { id_grupo: grupo.id_grupo }, transaction: t });
      if (!sesiones) throw new AppError(409, 'Agregue al menos una sesión antes de iniciar el grupo.');
    }
    const anterior = grupo.estatus;
    await grupo.update({ estatus }, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: 'cambiar_estatus', entidad: 'grupo', idRegistro: grupo.id_grupo,
      detalle: `${grupo.clave}: ${NOMBRE_ESTATUS[anterior]} → ${NOMBRE_ESTATUS[estatus]}`,
    }, t);
    return aRespuesta(await buscarPorId(grupo.id_grupo, t));
  });
}

// ---------- Sesiones ----------
async function validarSesion(grupo, d) {
  if (d.fecha < grupo.fecha_inicio || d.fecha > grupo.fecha_fin) {
    throw new AppError(400, `La fecha de la sesión debe estar entre ${grupo.fecha_inicio} y ${grupo.fecha_fin} (fechas del grupo).`);
  }
  if (d.horaFin <= d.horaInicio) throw new AppError(400, 'La hora de fin debe ser posterior a la hora de inicio.');
}

async function agregarSesion(idGrupo, d, idUsuario) {
  return sequelize.transaction(async (t) => {
    const grupo = await buscarPorId(idGrupo, t);
    verificarEditable(grupo);
    await validarSesion(grupo, d);
    const sesion = await Sesion.create({
      id_grupo: grupo.id_grupo, fecha: d.fecha, hora_inicio: d.horaInicio, hora_fin: d.horaFin, tema: d.tema || null,
    }, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: 'crear', entidad: 'sesion', idRegistro: sesion.id_sesion,
      detalle: `Sesión del grupo ${grupo.clave}: ${d.fecha} ${d.horaInicio}-${d.horaFin}`,
    }, t);
  });
}

async function buscarSesion(idSesion, transaction) {
  const sesion = await Sesion.findByPk(idSesion, { transaction });
  if (!sesion) throw new AppError(404, 'No se encontró la sesión.');
  const grupo = await buscarPorId(sesion.id_grupo, transaction);
  verificarEditable(grupo);
  return { sesion, grupo };
}

async function actualizarSesion(idSesion, d, idUsuario) {
  return sequelize.transaction(async (t) => {
    const { sesion, grupo } = await buscarSesion(idSesion, t);
    await validarSesion(grupo, d);
    await sesion.update({ fecha: d.fecha, hora_inicio: d.horaInicio, hora_fin: d.horaFin, tema: d.tema || null }, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: 'modificar', entidad: 'sesion', idRegistro: sesion.id_sesion,
      detalle: `Sesión del grupo ${grupo.clave}: ${d.fecha} ${d.horaInicio}-${d.horaFin}`,
    }, t);
  });
}

async function eliminarSesion(idSesion, idUsuario) {
  return sequelize.transaction(async (t) => {
    const { sesion, grupo } = await buscarSesion(idSesion, t);
    const asistencias = await Asistencia.count({ where: { id_sesion: sesion.id_sesion }, transaction: t });
    if (asistencias) throw new AppError(409, 'La sesión ya tiene asistencia registrada y no se puede eliminar.');
    await registrarAuditoria({
      idUsuario, accion: 'eliminar', entidad: 'sesion', idRegistro: sesion.id_sesion,
      detalle: `Sesión del grupo ${grupo.clave} del ${sesion.fecha} eliminada`,
    }, t);
    await sesion.destroy({ transaction: t });
  });
}

module.exports = {
  listar, obtenerDetalle, personalDisponible, crear, actualizar, cambiarEstatus,
  agregarSesion, actualizarSesion, eliminarSesion,
};
