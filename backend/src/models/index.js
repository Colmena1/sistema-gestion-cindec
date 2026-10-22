// Registro central de los 20 modelos de cindec_db y de sus 26 relaciones (llaves foráneas).
// Uso en cualquier servicio:  const { Usuario, Rol } = require('../../models');
// Recuerda (ADR-0004): las tablas las crean los scripts SQL; aquí NUNCA se llama a sequelize.sync().
const sequelize = require('../config/db');

const db = {
  // Usuarios
  Rol: require('./rol.model')(sequelize),
  Usuario: require('./usuario.model')(sequelize),
  TokenRecuperacion: require('./token_recuperacion.model')(sequelize),
  Auditoria: require('./auditoria.model')(sequelize),
  // Cursos, grupos y participantes
  EstandarCompetencia: require('./estandar_competencia.model')(sequelize),
  Curso: require('./curso.model')(sequelize),
  Grupo: require('./grupo.model')(sequelize),
  Sesion: require('./sesion.model')(sequelize),
  Participante: require('./participante.model')(sequelize),
  DocumentoParticipante: require('./documento_participante.model')(sequelize),
  Inscripcion: require('./inscripcion.model')(sequelize),
  Asistencia: require('./asistencia.model')(sequelize),
  // Aprendizaje
  Material: require('./material.model')(sequelize),
  ConsultaMaterial: require('./consulta_material.model')(sequelize),
  // Evaluaciones
  Evaluacion: require('./evaluacion.model')(sequelize),
  IntentoEvaluacion: require('./intento_evaluacion.model')(sequelize),
  Evidencia: require('./evidencia.model')(sequelize),
  // Certificaciones
  TramiteCertificacion: require('./tramite_certificacion.model')(sequelize),
  HistorialTramite: require('./historial_tramite.model')(sequelize),
  DocumentoCertificacion: require('./documento_certificacion.model')(sequelize),
};

const {
  Rol, Usuario, TokenRecuperacion, Auditoria,
  EstandarCompetencia, Curso, Grupo, Sesion, Participante, DocumentoParticipante, Inscripcion, Asistencia,
  Material, ConsultaMaterial, Evaluacion, IntentoEvaluacion, Evidencia,
  TramiteCertificacion, HistorialTramite, DocumentoCertificacion,
} = db;

// Ayudante: declara una relación 1:N en ambos sentidos con la misma llave foránea.
// "as" es el nombre con el que se pide la relación en un include, p. ej. include: 'instructor'.
function unoAMuchos(Padre, Hijo, foreignKey, asHijos, asPadre) {
  Padre.hasMany(Hijo, { foreignKey, as: asHijos });
  Hijo.belongsTo(Padre, { foreignKey, as: asPadre });
}
function unoAUno(Padre, Hijo, foreignKey, asHijo, asPadre) {
  Padre.hasOne(Hijo, { foreignKey, as: asHijo });
  Hijo.belongsTo(Padre, { foreignKey, as: asPadre });
}

// ---- Usuarios (3 FK) ----
unoAMuchos(Rol, Usuario, 'id_rol', 'usuarios', 'rol');                                    // 1
unoAMuchos(Usuario, TokenRecuperacion, 'id_usuario', 'tokens', 'usuario');                // 2
unoAMuchos(Usuario, Auditoria, 'id_usuario', 'auditorias', 'usuario');                    // 3

// ---- Cursos, grupos y participantes (12 FK) ----
unoAMuchos(EstandarCompetencia, Curso, 'id_estandar', 'cursos', 'estandar');              // 4
unoAMuchos(Curso, Grupo, 'id_curso', 'grupos', 'curso');                                  // 5
unoAMuchos(Usuario, Grupo, 'id_instructor', 'gruposImpartidos', 'instructor');            // 6
unoAMuchos(Usuario, Grupo, 'id_evaluador', 'gruposEvaluados', 'evaluador');               // 7
unoAMuchos(Grupo, Sesion, 'id_grupo', 'sesiones', 'grupo');                               // 8
unoAUno(Usuario, Participante, 'id_usuario', 'participante', 'usuario');                  // 9
unoAMuchos(Curso, Participante, 'id_curso_interes', 'interesados', 'cursoInteres');       // 10
unoAMuchos(Participante, DocumentoParticipante, 'id_participante', 'documentos', 'participante'); // 11
unoAMuchos(Participante, Inscripcion, 'id_participante', 'inscripciones', 'participante'); // 12
unoAMuchos(Grupo, Inscripcion, 'id_grupo', 'inscripciones', 'grupo');                     // 13
unoAMuchos(Inscripcion, Asistencia, 'id_inscripcion', 'asistencias', 'inscripcion');      // 14
unoAMuchos(Sesion, Asistencia, 'id_sesion', 'asistencias', 'sesion');                     // 15

// ---- Aprendizaje (3 FK) ----
unoAMuchos(Curso, Material, 'id_curso', 'materiales', 'curso');                           // 16
unoAMuchos(Participante, ConsultaMaterial, 'id_participante', 'consultas', 'participante'); // 17
unoAMuchos(Material, ConsultaMaterial, 'id_material', 'consultas', 'material');           // 18

// ---- Evaluaciones (5 FK) ----
unoAMuchos(EstandarCompetencia, Evaluacion, 'id_estandar', 'evaluaciones', 'estandar');   // 19
unoAMuchos(Inscripcion, IntentoEvaluacion, 'id_inscripcion', 'intentos', 'inscripcion');  // 20
unoAMuchos(Evaluacion, IntentoEvaluacion, 'id_evaluacion', 'intentos', 'evaluacion');     // 21
unoAMuchos(Usuario, IntentoEvaluacion, 'id_evaluador', 'intentosEvaluados', 'evaluador'); // 22
unoAMuchos(IntentoEvaluacion, Evidencia, 'id_intento', 'evidencias', 'intento');          // 23

// ---- Certificaciones (3 FK) ----
unoAUno(IntentoEvaluacion, TramiteCertificacion, 'id_intento', 'tramite', 'intento');     // 24
unoAMuchos(TramiteCertificacion, HistorialTramite, 'id_tramite', 'historial', 'tramite'); // 25
unoAUno(TramiteCertificacion, DocumentoCertificacion, 'id_tramite', 'documento', 'tramite'); // 26

db.sequelize = sequelize;
module.exports = db;
