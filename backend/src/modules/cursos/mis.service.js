const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const {
  Grupo, Curso, EstandarCompetencia, Sesion, Inscripcion, Participante, Usuario, Asistencia, sequelize,
} = require('../../models');

// ---------------------------------------------------------------------
// Consultas de cada rol sobre lo suyo (RNF-13):
//  - Instructor: "Mis grupos" (CU-09) y su historial de cursos impartidos (RF-CUR-07).
//  - Participante: "Mis cursos" (CU-13 parcial, CU-11 parcial; RF-CUR-06).
// ---------------------------------------------------------------------

const incluirCurso = { model: Curso, as: 'curso', attributes: ['nombre'], include: { model: EstandarCompetencia, as: 'estandar', attributes: ['codigo', 'nombre'] } };
const nombre = (u) => (u ? `${u.nombre} ${u.apellidos}` : null);

async function misGrupos(idInstructor) {
  const grupos = await Grupo.findAll({
    where: { id_instructor: idInstructor },
    include: [incluirCurso, { model: Sesion, as: 'sesiones', attributes: ['id_sesion', 'fecha', 'hora_inicio', 'hora_fin', 'tema'] }],
    attributes: {
      include: [[sequelize.literal("(SELECT COUNT(*) FROM inscripcion i WHERE i.id_grupo = Grupo.id_grupo AND i.estatus <> 'baja')"), 'inscritos']],
    },
    order: [
      [sequelize.literal("FIELD(Grupo.estatus, 'en_curso', 'planeado', 'concluido', 'cancelado')"), 'ASC'],
      ['fecha_inicio', 'ASC'],
      [{ model: Sesion, as: 'sesiones' }, 'fecha', 'ASC'],
    ],
  });
  return grupos.map((g) => ({
    id: g.id_grupo,
    clave: g.clave,
    curso: g.curso.nombre,
    estandar: g.curso.estandar.codigo,
    fechaInicio: g.fecha_inicio,
    fechaFin: g.fecha_fin,
    modalidad: g.modalidad,
    estatus: g.estatus,
    enlaceVideoconferencia: g.enlace_videoconferencia,
    inscritos: Number(g.get('inscritos')),
    sesiones: g.sesiones.map((s, i) => ({
      id: s.id_sesion, numero: i + 1, fecha: s.fecha, horaInicio: s.hora_inicio.slice(0, 5), horaFin: s.hora_fin.slice(0, 5), tema: s.tema,
    })),
  }));
}

async function misCursos(idUsuario) {
  const participante = await Participante.findOne({ where: { id_usuario: idUsuario } });
  if (!participante) throw new AppError(404, 'No se encontró su registro de participante.');
  const inscripciones = await Inscripcion.findAll({
    where: { id_participante: participante.id_participante },
    include: [
      {
        model: Grupo, as: 'grupo',
        include: [
          incluirCurso,
          { model: Usuario, as: 'instructor', attributes: ['nombre', 'apellidos'] },
          { model: Sesion, as: 'sesiones', attributes: ['id_sesion', 'fecha', 'hora_inicio', 'hora_fin', 'tema'] },
        ],
      },
      { model: Asistencia, as: 'asistencias', attributes: ['id_sesion', 'asistio'] },
    ],
    order: [['fecha_inscripcion', 'DESC'], [{ model: Grupo, as: 'grupo' }, { model: Sesion, as: 'sesiones' }, 'fecha', 'ASC']],
  });
  return inscripciones.map((i) => {
    const g = i.grupo;
    const asistencia = Object.fromEntries(i.asistencias.map((a) => [a.id_sesion, a.asistio]));
    const tomadas = i.asistencias.length;
    return {
      idInscripcion: i.id_inscripcion,
      estatus: i.estatus,
      esRefuerzo: i.es_refuerzo,
      clave: g.clave,
      idCurso: g.id_curso,
      curso: g.curso.nombre,
      estandar: g.curso.estandar.codigo,
      nombreEstandar: g.curso.estandar.nombre,
      fechaInicio: g.fecha_inicio,
      fechaFin: g.fecha_fin,
      modalidad: g.modalidad,
      estatusGrupo: g.estatus,
      // El enlace solo se muestra mientras la inscripción y el grupo siguen vigentes
      enlaceVideoconferencia: i.estatus !== 'baja' && ['planeado', 'en_curso'].includes(g.estatus) ? g.enlace_videoconferencia : null,
      instructor: nombre(g.instructor),
      asistencias: { presentes: i.asistencias.filter((a) => a.asistio).length, registradas: tomadas },
      sesiones: g.sesiones.map((s, n) => ({
        id: s.id_sesion, numero: n + 1, fecha: s.fecha, horaInicio: s.hora_inicio.slice(0, 5), horaFin: s.hora_fin.slice(0, 5), tema: s.tema,
        asistio: asistencia[s.id_sesion] ?? null,
      })),
    };
  });
}

module.exports = { misGrupos, misCursos, Op };
