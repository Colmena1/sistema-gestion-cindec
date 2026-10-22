const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validar = require('../../middlewares/validar');
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const ROLES = require('../../config/roles');
const v = require('./grupos.validators');
const c = require('./grupos.controller');

// CU-05 Gestionar grupos y sesiones: Coordinador de capacitación y Administrador general.
const gestion = [autenticar, autorizar(ROLES.ADMIN, ROLES.COORDINADOR)];

// /api/v1/grupos
const grupos = express.Router();
grupos.use(...gestion);
grupos.get('/', v.listar, validar, asyncHandler(c.listar));
grupos.get('/personal', asyncHandler(c.personal));                      // instructores y evaluadores activos
grupos.get('/:id', v.obtener, validar, asyncHandler(c.obtener));
grupos.post('/', v.crear, validar, asyncHandler(c.crear));
grupos.put('/:id', v.actualizar, validar, asyncHandler(c.actualizar));
grupos.patch('/:id/estatus', v.estatus, validar, asyncHandler(c.estatus));
grupos.post('/:id/sesiones', v.agregarSesion, validar, asyncHandler(c.agregarSesion));

// /api/v1/sesiones
const sesiones = express.Router();
sesiones.use(...gestion);
sesiones.put('/:id', v.actualizarSesion, validar, asyncHandler(c.actualizarSesion));
sesiones.delete('/:id', v.eliminarSesion, validar, asyncHandler(c.eliminarSesion));

module.exports = { grupos, sesiones };
