const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validar = require('../../middlewares/validar');
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const ROLES = require('../../config/roles');
const v = require('./cursos.validators');
const c = require('./cursos.controller');

// CU-04 Gestionar estándares y cursos: Coordinador de capacitación y Administrador general.
const gestion = [autenticar, autorizar(ROLES.ADMIN, ROLES.COORDINADOR)];

// /api/v1/estandares
const estandares = express.Router();
estandares.use(...gestion);
estandares.get('/', v.estandares.listar, validar, asyncHandler(c.estandares.listar));
estandares.post('/', v.estandares.crear, validar, asyncHandler(c.estandares.crear));
estandares.put('/:id', v.estandares.actualizar, validar, asyncHandler(c.estandares.actualizar));
estandares.patch('/:id/estado', v.estandares.estado, validar, asyncHandler(c.estandares.estado));

// /api/v1/cursos
const cursos = express.Router();
cursos.use(...gestion);
cursos.get('/', v.cursos.listar, validar, asyncHandler(c.cursos.listar));
cursos.get('/:id', v.cursos.obtener, validar, asyncHandler(c.cursos.obtener));
cursos.post('/', v.cursos.crear, validar, asyncHandler(c.cursos.crear));
cursos.put('/:id', v.cursos.actualizar, validar, asyncHandler(c.cursos.actualizar));
cursos.patch('/:id/estado', v.cursos.estado, validar, asyncHandler(c.cursos.estado));

module.exports = { estandares, cursos };
