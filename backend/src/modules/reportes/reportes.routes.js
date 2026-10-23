const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validar = require('../../middlewares/validar');
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const ROLES = require('../../config/roles');
const v = require('./reportes.validators');
const c = require('./reportes.controller');

// /api/v1/reportes — CU-22 (Coordinador y Administrador)
const reportes = express.Router();
reportes.use(autenticar, autorizar(ROLES.ADMIN, ROLES.COORDINADOR));
reportes.get('/', asyncHandler(c.catalogo));
reportes.get('/:clave', v.generar, validar, asyncHandler(c.generar));
reportes.get('/:clave/pdf', v.generar, validar, asyncHandler(c.pdf));
reportes.get('/:clave/excel', v.generar, validar, asyncHandler(c.excel));

module.exports = reportes;
