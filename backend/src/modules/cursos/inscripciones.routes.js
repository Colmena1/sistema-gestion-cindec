const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validar = require('../../middlewares/validar');
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const ROLES = require('../../config/roles');
const v = require('./inscripciones.validators');
const c = require('./inscripciones.controller');

const coordinacion = [autenticar, autorizar(ROLES.ADMIN, ROLES.COORDINADOR)];
const asistencia = [autenticar, autorizar(ROLES.ADMIN, ROLES.COORDINADOR, ROLES.INSTRUCTOR)];

// Se montan sobre /api/v1/grupos
const grupos = express.Router();
grupos.get('/:id/candidatos', ...coordinacion, v.candidatos, validar, asyncHandler(c.candidatos));   // CU-07 buscar
grupos.post('/:id/inscripciones', ...coordinacion, v.inscribir, validar, asyncHandler(c.inscribir)); // CU-07 + CU-08

// /api/v1/inscripciones
const inscripciones = express.Router();
inscripciones.patch('/:id/estatus', ...coordinacion, v.estatus, validar, asyncHandler(c.estatus));

// Se montan sobre /api/v1/sesiones (CU-09)
const sesiones = express.Router();
sesiones.get('/:id/asistencia', ...asistencia, v.sesion, validar, asyncHandler(c.obtenerAsistencia));
sesiones.put('/:id/asistencia', ...asistencia, v.guardarAsistencia, validar, asyncHandler(c.guardarAsistencia));

// /api/v1/mis-grupos (Instructor) y /api/v1/mis-cursos (Participante)
const misGrupos = express.Router();
misGrupos.get('/', autenticar, autorizar(ROLES.INSTRUCTOR), asyncHandler(c.misGrupos));
const misCursos = express.Router();
misCursos.get('/', autenticar, autorizar(ROLES.PARTICIPANTE), asyncHandler(c.misCursos));

module.exports = { grupos, inscripciones, sesiones, misGrupos, misCursos };
