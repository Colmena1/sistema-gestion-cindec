const { body, param, query } = require('express-validator');
const { REGLA, MENSAJE_REGLA } = require('../../utils/contrasena');
const { TIPO_DOCUMENTO_PARTICIPANTE } = require('../../models/enums');

// Validaciones del servidor para participantes (RNF-09).
// Con formularios que llevan archivos (multipart), los datos llegan como texto.
const texto = (campo, etiqueta, max, opcional) => {
  let r = body(campo);
  if (opcional) r = r.optional();
  return r.isString().withMessage(`Escriba ${etiqueta}.`).bail().trim()
    .notEmpty().withMessage(`Escriba ${etiqueta}.`)
    .isLength({ max }).withMessage(`Debe tener como máximo ${max} caracteres.`);
};
const correo = (opcional) => (opcional ? body('correo').optional() : body('correo'))
  .isString().withMessage('Escriba su correo electrónico.').bail().trim()
  .isEmail().withMessage('Escriba un correo electrónico válido, por ejemplo nombre@dominio.com.')
  .isLength({ max: 254 })
  .customSanitizer((v) => v.toLowerCase());
const curp = (opcional) => (opcional ? body('curp').optional() : body('curp'))
  .isString().withMessage('Escriba la CURP.').bail()
  .customSanitizer((v) => v.trim().toUpperCase())
  .isLength({ min: 18, max: 18 }).withMessage('La CURP tiene exactamente 18 caracteres.');
// Teléfono: se aceptan espacios y guiones al escribirlo, pero se guardan solo los 10 dígitos.
const telefono = (opcional) => (opcional ? body('telefono').optional() : body('telefono'))
  .isString().withMessage('Escriba el teléfono.').bail()
  .customSanitizer((v) => v.replace(/[\s\-().]/g, ''))
  .matches(/^\d{10}$/).withMessage('Escriba el teléfono a 10 dígitos, por ejemplo 477 123 4567.');
const opcionalTexto = (campo, max) => body(campo).optional({ values: 'null' }).isString().trim()
  .isLength({ max }).withMessage(`Debe tener como máximo ${max} caracteres.`);
const cursoInteres = body('idCursoInteres').optional({ values: 'null' })
  .custom((v) => v === '' || Number.isInteger(Number(v))).withMessage('Curso no válido.')
  .customSanitizer((v) => (v === '' || v === null ? null : Number(v)));
const contrasena = body('contrasena').isString().matches(REGLA).withMessage(MENSAJE_REGLA);

const datosRegistro = [
  texto('nombre', 'el nombre', 100), texto('apellidos', 'los apellidos', 100), correo(false), contrasena,
  curp(false), telefono(false), opcionalTexto('empresaProcedencia', 150), cursoInteres,
  body('tipoIdentificacion').optional({ values: 'falsy' }).isString(),
];

module.exports = {
  verificar: [
    body('correo').optional({ values: 'falsy' }).isEmail().customSanitizer((v) => v.toLowerCase()),
    body('curp').optional({ values: 'falsy' }).customSanitizer((v) => String(v).trim().toUpperCase()),
  ],
  registro: datosRegistro,
  listar: [
    query('buscar').optional().trim().isLength({ max: 100 }),
    query('pagina').optional().isInt({ min: 1 }).toInt(),
    query('limite').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  id: [param('id').isInt({ min: 1 }).withMessage('Identificador no válido.').toInt()],
  actualizar: [
    param('id').isInt({ min: 1 }).toInt(),
    texto('nombre', 'el nombre', 100, true), texto('apellidos', 'los apellidos', 100, true), correo(true),
    curp(true), telefono(true), opcionalTexto('empresaProcedencia', 150), cursoInteres,
  ],
  documento: [
    param('id').isInt({ min: 1 }).toInt(),
    body('tipoDocumento').isIn(TIPO_DOCUMENTO_PARTICIPANTE).withMessage('Seleccione el tipo de documento.'),
  ],
};
