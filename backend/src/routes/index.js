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
router.use('/grupos', rutasGrupos.grupos);
router.use('/sesiones', rutasGrupos.sesiones);
const rutasParticipantes = require('../modules/participantes/participantes.routes'); // Sprint 2
router.use('/participantes', rutasParticipantes.participantes);
router.use('/documentos-participante', rutasParticipantes.documentos);

module.exports = router;
