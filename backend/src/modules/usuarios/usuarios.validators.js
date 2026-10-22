const { body, param, query } = require('express-validator');
const { REGLA, MENSAJE_REGLA } = require('../../utils/contrasena');

// Validaciones del servidor para el módulo Usuarios (RNF-09).
const id = param('id').isInt({ min: 1 }).withMessage('Identificador de usuario no válido.').toInt();

const texto = (campo, etiqueta, max, opcional = false) => {
  let regla = body(campo);
  if (opcional) regla = regla.optional();
  return regla
    .isString().withMessage(`Escriba ${etiqueta}.`)
    .bail().trim()
    .notEmpty().withMessage(`Escriba ${etiqueta}.`)
    .isLength({ max }).withMessage(`${etiqueta[0].toUpperCase() + etiqueta.slice(1)} debe tener como máximo ${max} caracteres.`);
};

const correo = (opcional = false) => {
  let regla = body('correo');
  if (opcional) regla = regla.optional();
  return regla
    .isString().withMessage('Escriba el correo electrónico.')
    .bail().trim()
    .isEmail().withMessage('Escriba un correo electrónico válido, por ejemplo nombre@dominio.com.')
    .isLength({ max: 254 }).withMessage('El correo debe tener como máximo 254 caracteres.')
    .customSanitizer((v) => v.toLowerCase());
};

const listar = [
  query('buscar').optional().trim().isLength({ max: 100 }),
  query('idRol').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
  query('activo').optional({ values: 'falsy' }).isIn(['true', 'false']).withMessage('Filtro de estado no válido.')
    .customSanitizer((v) => v === 'true'),
  query('pagina').optional().isInt({ min: 1 }).toInt(),
  query('limite').optional().isInt({ min: 1, max: 50 }).toInt(),
];

const crear = [
  texto('nombre', 'el nombre', 100),
  texto('apellidos', 'los apellidos', 100),
  correo(),
  body('idRol').isInt({ min: 1 }).withMessage('Seleccione un rol.').toInt(),
  body('contrasena').isString().matches(REGLA).withMessage(MENSAJE_REGLA),
];

const actualizar = [
  id,
  texto('nombre', 'el nombre', 100, true),
  texto('apellidos', 'los apellidos', 100, true),
  correo(true),
  body('idRol').optional().isInt({ min: 1 }).withMessage('Seleccione un rol.').toInt(),
  body('contrasena').optional({ values: 'falsy' }).isString().matches(REGLA).withMessage(MENSAJE_REGLA),
];

const cambiarEstado = [
  id,
  body('activo').isBoolean({ strict: true }).withMessage('Indique si el usuario queda activo o desactivado.'),
];

module.exports = { id, listar, crear, actualizar, cambiarEstado };
