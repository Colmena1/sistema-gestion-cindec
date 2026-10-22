const bcrypt = require('bcryptjs');

// Reglas de contraseña del sistema: mínimo 8 caracteres, con al menos una letra y un número.
const REGLA = /^(?=.*[A-Za-zÁÉÍÓÚÑáéíóúñ])(?=.*\d).{8,72}$/;
const MENSAJE_REGLA = 'La contraseña debe tener al menos 8 caracteres e incluir letras y números.';

// Cifra la contraseña con bcrypt antes de guardarla (RNF-05). Nunca se guarda en texto plano.
const cifrar = (contrasena) => bcrypt.hash(contrasena, 10);

module.exports = { REGLA, MENSAJE_REGLA, cifrar };
