const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const ROLES = require('../../config/roles');
const { ejecutar } = require('./recordatorios.service');

// /api/v1/notificaciones — CU-21 (Coordinador y Administrador)
// Lanza a mano la misma revisión que el sistema hace sola cada hora; no repite recordatorios ya enviados.
const notificaciones = express.Router();
notificaciones.post('/recordatorios', autenticar, autorizar(ROLES.ADMIN, ROLES.COORDINADOR), asyncHandler(async (req, res) => {
  const r = await ejecutar(req.usuario.id);
  res.json({ ok: true, resultado: r });
}));

module.exports = notificaciones;
