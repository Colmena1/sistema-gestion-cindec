const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validar = require('../../middlewares/validar');
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const { subirMaterial, manejarErrorMulter } = require('../../utils/archivos');
const ROLES = require('../../config/roles');
const v = require('./materiales.validators');
const c = require('./materiales.controller');

// Gestión: coordinación, administración e instructor (este último, solo de sus cursos; lo valida el servicio)
const gestion = [autenticar, autorizar(ROLES.ADMIN, ROLES.COORDINADOR, ROLES.INSTRUCTOR)];

// /api/v1/materiales
const materiales = express.Router();
materiales.get('/cursos', ...gestion, asyncHandler(c.cursosGestionables));
materiales.get('/curso/:id', ...gestion, v.curso, validar, asyncHandler(c.listarDeCurso));
materiales.post('/curso/:id', ...gestion, subirMaterial.single('archivo'), manejarErrorMulter, v.crear, validar, asyncHandler(c.crear));
materiales.put('/:id', ...gestion, v.actualizar, validar, asyncHandler(c.actualizar));
materiales.delete('/:id', ...gestion, v.material, validar, asyncHandler(c.eliminar));
// Consulta (cualquier rol con permiso; el participante deja registro de su consulta)
materiales.get('/:id/archivo', autenticar, v.material, validar, asyncHandler(c.descargar));
materiales.post('/:id/video', autenticar, v.material, validar, asyncHandler(c.video));

// /api/v1/mis-materiales (Participante)
const misMateriales = express.Router();
misMateriales.get('/', autenticar, autorizar(ROLES.PARTICIPANTE), asyncHandler(c.misMateriales));

module.exports = { materiales, misMateriales };
