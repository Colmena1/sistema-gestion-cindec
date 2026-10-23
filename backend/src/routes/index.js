const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Prueba de salud: confirma que la API y la base de datos responden.
router.get('/health', asyncHandler(async (req, res) => {
  await sequelize.query('SELECT 1');
  res.json({ ok: true, proyecto: 'Sistema CINDEC', baseDeDatos: 'conectada', fecha: new Date().toISOString() });
}));

// Rutas por módulo (se activan conforme avanzan los sprints):
router.use('/auth', require('../modules/auth/auth.routes'));              // Sprint 1
router.use('/usuarios', require('../modules/usuarios/usuarios.routes'));     // Sprint 1
const rutasCursos = require('../modules/cursos/cursos.routes');               // Sprint 2
router.use('/estandares', rutasCursos.estandares);
router.use('/cursos', rutasCursos.cursos);
const rutasGrupos = require('../modules/cursos/grupos.routes');                // Sprint 2
const rutasInscripciones = require('../modules/cursos/inscripciones.routes');  // Sprint 2
router.use('/grupos', rutasInscripciones.grupos);   // primero: rutas con roles propios (inscribir)
router.use('/sesiones', rutasInscripciones.sesiones); // asistencia: también para el instructor
router.use('/grupos', rutasGrupos.grupos);
router.use('/sesiones', rutasGrupos.sesiones);
router.use('/inscripciones', rutasInscripciones.inscripciones);
router.use('/mis-grupos', rutasInscripciones.misGrupos);
router.use('/mis-cursos', rutasInscripciones.misCursos);
const rutasParticipantes = require('../modules/participantes/participantes.routes'); // Sprint 2
router.use('/participantes', rutasParticipantes.participantes);
router.use('/documentos-participante', rutasParticipantes.documentos);
const rutasMateriales = require('../modules/aprendizaje/materiales.routes');     // Sprint 3
router.use('/materiales', rutasMateriales.materiales);
router.use('/mis-materiales', rutasMateriales.misMateriales);
const rutasEvaluaciones = require('../modules/evaluaciones/evaluaciones.routes'); // Sprint 3
router.use('/evaluaciones', rutasEvaluaciones.instrumentos);
router.use('/por-evaluar', rutasEvaluaciones.porEvaluar);
router.use('/intentos', rutasEvaluaciones.intentos);
router.use('/evidencias', rutasEvaluaciones.evidencias);
const rutasCertificaciones = require('../modules/certificaciones/certificaciones.routes'); // Sprint 3
router.use('/tramites', rutasCertificaciones.tramites);
router.use('/mis-certificados', rutasCertificaciones.misCertificados);
router.use('/mi-historial', rutasCertificaciones.miHistorial);
router.use('/verificar-folio', rutasCertificaciones.verificarFolio);

module.exports = router;
