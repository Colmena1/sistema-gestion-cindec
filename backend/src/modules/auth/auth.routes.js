const express = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../utils/asyncHandler');
const validar = require('../../middlewares/validar');
const autenticar = require('../../middlewares/autenticar');
const validadores = require('./auth.validators');
const controlador = require('./auth.controller');

const router = express.Router();

// Límites contra abuso: adivinar contraseñas o saturar el envío de correos.
const limite = (max, mensaje) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, mensaje },
});
const limiteLogin = limite(10, 'Demasiados intentos de inicio de sesión. Espere 15 minutos e inténtelo de nuevo.');
const limiteRecuperar = limite(5, 'Demasiadas solicitudes de recuperación. Espere 15 minutos e inténtelo de nuevo.');

// POST /api/v1/auth/login  -> { correo, contrasena }  -> { token, usuario }
router.post('/login', limiteLogin, validadores.login, validar, asyncHandler(controlador.login));

// GET /api/v1/auth/yo  -> datos del usuario con sesión
router.get('/yo', autenticar, asyncHandler(controlador.yo));

// Recuperación de contraseña (CU-02, RF-USR-06)
// POST /api/v1/auth/recuperar                -> { correo }  (envía el enlace por correo)
// GET  /api/v1/auth/restablecer/validar?token=   (¿el enlace sigue vigente?)
// POST /api/v1/auth/restablecer              -> { token, contrasena }
router.post('/recuperar', limiteRecuperar, validadores.recuperar, validar, asyncHandler(controlador.recuperar));
router.get('/restablecer/validar', validadores.validarToken, validar, asyncHandler(controlador.validarToken));
router.post('/restablecer', limiteLogin, validadores.restablecer, validar, asyncHandler(controlador.restablecer));

module.exports = router;
