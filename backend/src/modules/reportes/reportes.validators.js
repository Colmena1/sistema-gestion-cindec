const { param, query } = require('express-validator');
const { ESTATUS_TRAMITE } = require('../../models/enums');

// Validaciones de los filtros de reportes (RNF-09).
const fecha = (campo, texto) => query(campo).optional({ values: 'falsy' })
  .isISO8601({ strict: true }).withMessage(`La fecha "${texto}" no es válida.`).bail()
  .customSanitizer((v) => String(v).slice(0, 10));

module.exports = {
  generar: [
    param('clave').isString().isLength({ max: 40 }).matches(/^[a-zA-Z]+$/).withMessage('Reporte no válido.'),
    fecha('desde', 'desde'),
    fecha('hasta', 'hasta'),
    query('idCurso').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Curso no válido.').toInt(),
    query('estatus').optional({ values: 'falsy' }).isIn(ESTATUS_TRAMITE).withMessage('Estatus no válido.'),
  ],
};
