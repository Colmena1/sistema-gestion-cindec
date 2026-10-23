const { body, param, query } = require('express-validator');
const { TIPO_INSTRUMENTO, DICTAMEN } = require('../../models/enums');

// Validaciones del servidor para el módulo Evaluaciones (RNF-09).
const id = param('id').isInt({ min: 1 }).withMessage('Identificador no válido.').toInt();

const nombre = (opcional) => (opcional ? body('nombre').optional() : body('nombre'))
  .isString().withMessage('Escriba el nombre del instrumento.').bail().trim()
  .notEmpty().withMessage('Escriba el nombre del instrumento.')
  .isLength({ max: 150 }).withMessage('El nombre debe tener como máximo 150 caracteres.');
const descripcion = body('descripcion').optional({ values: 'null' }).isString().trim()
  .isLength({ max: 2000 }).withMessage('La descripción debe tener como máximo 2000 caracteres.');
const idEstandar = (opcional) => (opcional ? body('idEstandar').optional() : body('idEstandar'))
  .isInt({ min: 1 }).withMessage('Seleccione el estándar de competencia.').toInt();
const tipo = (opcional) => (opcional ? body('tipo').optional() : body('tipo'))
  .isIn(TIPO_INSTRUMENTO).withMessage('Seleccione el tipo de instrumento.');
// Calificación de 0 a 100 con hasta dos decimales (DECIMAL(5,2) y CHECK en la BD)
const calificacion = (campo, mensaje, opcional) => (opcional ? body(campo).optional() : body(campo))
  .isFloat({ min: 0, max: 100 }).withMessage(mensaje).bail()
  .custom((v) => /^\d{1,3}(\.\d{1,2})?$/.test(String(v).trim())).withMessage('Use como máximo dos decimales.')
  .toFloat();

module.exports = {
  instrumentos: {
    listar: [query('idEstandar').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt()],
    crear: [idEstandar(false), nombre(false), descripcion, tipo(false),
      calificacion('calificacionMinima', 'Escriba la calificación mínima, de 0 a 100.', false)],
    actualizar: [id, idEstandar(true), nombre(true), descripcion, tipo(true),
      calificacion('calificacionMinima', 'Escriba la calificación mínima, de 0 a 100.', true)],
    estado: [id, body('activa').isBoolean({ strict: true }).withMessage('Indique si queda activo o desactivado.')],
  },
  intentos: {
    crear: [
      body('idInscripcion').isInt({ min: 1 }).withMessage('Inscripción no válida.').toInt(),
      body('idEvaluacion').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Seleccione el instrumento.').toInt(),
    ],
    intento: [id],
    resultado: [
      id,
      body('fechaAplicacion').isISO8601({ strict: true }).withMessage('Escriba la fecha de aplicación.').bail()
        .customSanitizer((v) => String(v).slice(0, 10)),
      calificacion('calificacion', 'Escriba la calificación, de 0 a 100.', false),
      body('dictamen').isIn(DICTAMEN).withMessage('Seleccione el juicio de competencia.'),
      body('observaciones').optional({ values: 'null' }).isString().trim()
        .isLength({ max: 2000 }).withMessage('Las observaciones deben tener como máximo 2000 caracteres.'),
    ],
    evidencia: [
      id,
      body('descripcion').optional({ values: 'falsy' }).isString().trim()
        .isLength({ max: 500 }).withMessage('La descripción debe tener como máximo 500 caracteres.'),
    ],
  },
  evidencia: [id],
};
