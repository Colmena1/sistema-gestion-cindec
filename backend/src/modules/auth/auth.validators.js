const { body } = require('express-validator');

// Validación en el servidor (RNF-09). Los mensajes se muestran tal cual al usuario.
const login = [
  body('correo')
    .trim().notEmpty().withMessage('Escriba su correo electrónico.')
    .bail().isEmail().withMessage('Escriba un correo electrónico válido, por ejemplo nombre@dominio.com.')
    .customSanitizer((v) => v.toLowerCase()),  // los correos se guardan en minúsculas
  body('contrasena')
    .notEmpty().withMessage('Escriba su contraseña.'),
];

module.exports = { login };
