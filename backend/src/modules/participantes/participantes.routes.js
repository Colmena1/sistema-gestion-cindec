const express = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../utils/asyncHandler');
const validar = require('../../middlewares/validar');
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const { subir, manejarErrorMulter } = require('../../utils/archivos');
const ROLES = require('../../config/roles');
const v = require('./participantes.validators');
const c = require('./participantes.controller');

// Documentos que se pueden enviar al registrar un participante (uno de cada uno)
const documentosRegistro = subir.fields([
  { name: 'identificacion', maxCount: 1 },
  { name: 'fotografia', maxCount: 1 },
  { name: 'ficha_registro', maxCount: 1 },
  { name: 'identificacion_tutor', maxCount: 1 },
]);

const limitePublico = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { ok: false, mensaje: 'Demasiadas solicitudes. Espere unos minutos e inténtelo de nuevo.' },
});

const coordinacion = [autenticar, autorizar(ROLES.ADMIN, ROLES.COORDINADOR)];

// /api/v1/participantes
const participantes = express.Router();

// --- Públicas (sin sesión): CU-06 Autorregistrarse ---
participantes.get('/cursos-disponibles', asyncHandler(c.cursosDisponibles));
participantes.post('/autorregistro/verificar', limitePublico, v.verificar, validar, asyncHandler(c.verificar));
participantes.post('/autorregistro', limitePublico, documentosRegistro, manejarErrorMulter, v.registro, validar, asyncHandler(c.autorregistro));

// --- Coordinación: CU-10 y alta de participantes ---
participantes.get('/', ...coordinacion, v.listar, validar, asyncHandler(c.listar));
participantes.post('/', ...coordinacion, documentosRegistro, manejarErrorMulter, v.registro, validar, asyncHandler(c.registrarPorCoordinacion));
participantes.get('/:id', ...coordinacion, v.id, validar, asyncHandler(c.expediente));
participantes.put('/:id', ...coordinacion, v.actualizar, validar, asyncHandler(c.actualizar));
participantes.post('/:id/documentos', ...coordinacion, subir.single('archivo'), manejarErrorMulter, v.documento, validar, asyncHandler(c.agregarDocumento));

// /api/v1/documentos-participante/:id/archivo  (coordinación o el propio participante)
const documentos = express.Router();
documentos.get('/:id/archivo', autenticar, v.id, validar, asyncHandler(c.archivoDocumento));

module.exports = { participantes, documentos };
