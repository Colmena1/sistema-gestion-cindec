const { body, query } = require('express-validator');
const { REGLA, MENSAJE_REGLA } = require('../../utils/contrasena');

// Validación en el servidor (RNF-09). Los mensajes se muestran tal cual al usuario.
const correo = body('correo')
  .trim().notEmpty().withMessage('Escriba su correo electrónico.')
  .bail().isEmail().withMessage('Escriba un correo electrónico válido, por ejemplo nombre@dominio.com.')
  .customSanitizer((v) => v.toLowerCase()); // los correos se guardan en minúsculas

const token = (origen) => origen('token')
  .isString().withMessage('El enlace no es válido.')
  .bail().matches(/^[a-f0-9]{64}$/).withMessage('El enlace no es válido o está incompleto. Cópielo completo desde el correo.');

const login = [
  correo,
  body('contrasena').notEmpty().withMessage('Escriba su contraseña.'),
];

const recuperar = [correo];

const validarToken = [token(query)];

const restablecer = [
  token(body),
  body('contrasena').isString().matches(REGLA).withMessage(MENSAJE_REGLA),
];

module.exports = { login, recuperar, validarToken, restablecer };
