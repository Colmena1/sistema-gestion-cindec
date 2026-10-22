const { body, param, query } = require('express-validator');

// Validaciones del servidor para estándares y cursos (RNF-09).
const id = param('id').isInt({ min: 1 }).withMessage('Identificador no válido.').toInt();

const texto = (campo, etiqueta, max, opcional) => {
  let r = body(campo);
  if (opcional) r = r.optional();
  return r.isString().withMessage(`Escriba ${etiqueta}.`).bail().trim()
    .notEmpty().withMessage(`Escriba ${etiqueta}.`)
    .isLength({ max }).withMessage(`Debe tener como máximo ${max} caracteres.`);
};
const descripcion = body('descripcion').optional({ values: 'null' }).isString().trim()
  .isLength({ max: 2000 }).withMessage('La descripción debe tener como máximo 2000 caracteres.');

const filtroActivo = query('activo').optional({ values: 'falsy' }).isIn(['true', 'false'])
  .customSanitizer((v) => v === 'true');

const estado = [id, body('activo').isBoolean({ strict: true }).withMessage('Indique si queda activo o desactivado.')];

// Código CONOCER: "EC" + 4 dígitos, y opcionalmente punto + 2 dígitos de versión (EC0301, EC0110.02)
const codigo = (opcional) => {
  let r = body('codigo');
  if (opcional) r = r.optional();
  return r.isString().withMessage('Escriba el código del estándar.').bail().trim()
    .customSanitizer((v) => v.toUpperCase())
    .matches(/^EC\d{4}(\.\d{2})?$/).withMessage('Escriba el código como lo publica CONOCER, por ejemplo EC0301 o EC0110.02.');
};

module.exports = {
  estandares: {
    listar: [query('buscar').optional().trim().isLength({ max: 100 }), filtroActivo],
    crear: [codigo(false), texto('nombre', 'el nombre del estándar', 255, false), descripcion],
    actualizar: [id, codigo(true), texto('nombre', 'el nombre del estándar', 255, true), descripcion],
    estado,
  },
  cursos: {
    listar: [
      query('buscar').optional().trim().isLength({ max: 100 }),
      query('idEstandar').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
      filtroActivo,
    ],
    obtener: [id],
    crear: [
      body('idEstandar').isInt({ min: 1 }).withMessage('Seleccione el estándar de competencia.').toInt(),
      texto('nombre', 'el nombre del curso', 150, false),
      descripcion,
    ],
    actualizar: [
      id,
      body('idEstandar').optional().isInt({ min: 1 }).withMessage('Seleccione el estándar de competencia.').toInt(),
      texto('nombre', 'el nombre del curso', 150, true),
      descripcion,
    ],
    estado,
  },
};
