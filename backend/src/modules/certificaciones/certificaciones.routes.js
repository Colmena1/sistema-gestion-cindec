const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validar = require('../../middlewares/validar');
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const { subirCertificado, manejarErrorMulter } = require('../../utils/archivos');
const ROLES = require('../../config/roles');
const v = require('./certificaciones.validators');
const c = require('./certificaciones.controller');

const personal = [autenticar, autorizar(ROLES.ADMIN, ROLES.COORDINADOR)];
const participante = [autenticar, autorizar(ROLES.PARTICIPANTE)];

// /api/v1/tramites — CU-17 y CU-18 (Coordinador y Administrador)
const tramites = express.Router();
tramites.get('/', ...personal, v.listar, validar, asyncHandler(c.listar));
tramites.get('/candidatos', ...personal, asyncHandler(c.candidatos));
tramites.post('/', ...personal, v.crear, validar, asyncHandler(c.crear));
tramites.get('/:id', ...personal, v.tramite, validar, asyncHandler(c.obtener));
tramites.post('/:id/estatus', ...personal, v.avanzar, validar, asyncHandler(c.avanzar));
tramites.post('/:id/documento', ...personal, subirCertificado.single('archivo'), manejarErrorMulter, v.documento, validar, asyncHandler(c.documento));
// Descarga: personal o el propio participante (lo valida el servicio)
tramites.get('/:id/documento/archivo', autenticar, v.tramite, validar, asyncHandler(c.descargar));

// /api/v1/mis-certificados (CU-19) y /api/v1/mi-historial (CU-11) — Participante
const misCertificados = express.Router();
misCertificados.get('/', ...participante, asyncHandler(c.misCertificados));
const miHistorial = express.Router();
miHistorial.get('/', ...participante, asyncHandler(c.miHistorial));

// /api/v1/verificar-folio — CU-20, cualquier usuario con sesión
const verificarFolio = express.Router();
verificarFolio.get('/', autenticar, v.verificar, validar, asyncHandler(c.verificar));

module.exports = { tramites, misCertificados, miHistorial, verificarFolio };
