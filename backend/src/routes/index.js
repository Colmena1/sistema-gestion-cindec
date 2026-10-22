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
// router.use('/auth', require('../modules/auth/auth.routes'));
// router.use('/usuarios', require('../modules/usuarios/usuarios.routes'));
// router.use('/cursos', require('../modules/cursos/cursos.routes'));

module.exports = router;
