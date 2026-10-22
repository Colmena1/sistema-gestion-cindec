const express = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../utils/asyncHandler');
const validar = require('../../middlewares/validar');
const autenticar = require('../../middlewares/autenticar');
const validadores = require('./auth.validators');
const controlador = require('./auth.controller');

const router = express.Router();

// Protección contra adivinar contraseñas: máximo 10 intentos de login
// por dirección IP cada 15 minutos.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, mensaje: 'Demasiados intentos de inicio de sesión. Espere 15 minutos e inténtelo de nuevo.' },
});

// POST /api/v1/auth/login  -> { correo, contrasena }  -> { token, usuario }
router.post('/login', limiteLogin, validadores.login, validar, asyncHandler(controlador.login));

// GET /api/v1/auth/yo  -> datos del usuario con sesión
router.get('/yo', autenticar, asyncHandler(controlador.yo));

module.exports = router;
