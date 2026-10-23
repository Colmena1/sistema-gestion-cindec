const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validar = require('../../middlewares/validar');
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const { subirEvidencia, manejarErrorMulter } = require('../../utils/archivos');
const ROLES = require('../../config/roles');
const v = require('./evaluaciones.validators');
const c = require('./evaluaciones.controller');

const personal = [ROLES.ADMIN, ROLES.COORDINADOR];
const soloEvaluador = [autenticar, autorizar(ROLES.EVALUADOR)];
// Consulta: evaluador (solo de sus grupos; lo valida el servicio), coordinación y administración
const consulta = [autenticar, autorizar(...personal, ROLES.EVALUADOR)];

// /api/v1/evaluaciones — CU-14 instrumentos de evaluación (Coordinador y Administrador)
const instrumentos = express.Router();
instrumentos.use(autenticar, autorizar(...personal));
instrumentos.get('/', v.instrumentos.listar, validar, asyncHandler(c.instrumentos.listar));
instrumentos.post('/', v.instrumentos.crear, validar, asyncHandler(c.instrumentos.crear));
instrumentos.put('/:id', v.instrumentos.actualizar, validar, asyncHandler(c.instrumentos.actualizar));
instrumentos.patch('/:id/estado', v.instrumentos.estado, validar, asyncHandler(c.instrumentos.estado));

// /api/v1/por-evaluar — P-19 (Evaluador)
const porEvaluar = express.Router();
porEvaluar.get('/', ...soloEvaluador, asyncHandler(c.porEvaluar));

// /api/v1/intentos — CU-15 resultado y dictamen, CU-16 evidencias
const intentos = express.Router();
intentos.post('/', ...soloEvaluador, v.intentos.crear, validar, asyncHandler(c.intentos.crear));
intentos.get('/:id', ...consulta, v.intentos.intento, validar, asyncHandler(c.intentos.obtener));
intentos.put('/:id/resultado', ...soloEvaluador, v.intentos.resultado, validar, asyncHandler(c.intentos.resultado));
intentos.delete('/:id', ...soloEvaluador, v.intentos.intento, validar, asyncHandler(c.intentos.eliminar));
intentos.post('/:id/evidencias', ...soloEvaluador, subirEvidencia.single('archivo'), manejarErrorMulter,
  v.intentos.evidencia, validar, asyncHandler(c.intentos.agregarEvidencia));

// /api/v1/evidencias
const evidencias = express.Router();
evidencias.delete('/:id', ...soloEvaluador, v.evidencia, validar, asyncHandler(c.evidencias.quitar));
evidencias.get('/:id/archivo', ...consulta, v.evidencia, validar, asyncHandler(c.evidencias.descargar));

module.exports = { instrumentos, porEvaluar, intentos, evidencias };
