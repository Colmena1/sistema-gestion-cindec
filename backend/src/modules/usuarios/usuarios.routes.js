const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validar = require('../../middlewares/validar');
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const ROLES = require('../../config/roles');
const v = require('./usuarios.validators');
const c = require('./usuarios.controller');

const router = express.Router();

// Todo el módulo es exclusivo del Administrador general (CU-03).
router.use(autenticar, autorizar(ROLES.ADMIN));

router.get('/roles', asyncHandler(c.roles));                                    // GET    /api/v1/usuarios/roles
router.get('/', v.listar, validar, asyncHandler(c.listar));                     // GET    /api/v1/usuarios?buscar=&idRol=&activo=&pagina=
router.get('/:id', v.id, validar, asyncHandler(c.obtener));                     // GET    /api/v1/usuarios/5
router.post('/', v.crear, validar, asyncHandler(c.crear));                      // POST   /api/v1/usuarios
router.put('/:id', v.actualizar, validar, asyncHandler(c.actualizar));          // PUT    /api/v1/usuarios/5
router.patch('/:id/estado', v.cambiarEstado, validar, asyncHandler(c.cambiarEstado)); // PATCH /api/v1/usuarios/5/estado

module.exports = router;
