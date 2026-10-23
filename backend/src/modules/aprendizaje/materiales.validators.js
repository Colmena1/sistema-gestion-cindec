const { body, param } = require('express-validator');
const { TIPO_MATERIAL } = require('../../models/enums');

// Validaciones del servidor para materiales (RNF-09).
const id = param('id').isInt({ min: 1 }).withMessage('Identificador no válido.').toInt();
const titulo = (opcional) => (opcional ? body('titulo').optional() : body('titulo'))
  .isString().withMessage('Escriba el título del material.').bail().trim()
  .notEmpty().withMessage('Escriba el título del material.')
  .isLength({ max: 200 }).withMessage('El título debe tener como máximo 200 caracteres.');
const urlVideo = body('urlVideo').optional({ values: 'falsy' }).trim()
  .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Escriba el enlace completo del video, empezando con https://')
  .isLength({ max: 500 });
const orden = body('orden').optional({ values: 'falsy' }).isInt({ min: 1, max: 999 }).withMessage('El orden debe ser un número entre 1 y 999.').toInt();

module.exports = {
  curso: [id],
  crear: [id, titulo(false), body('tipo').isIn(TIPO_MATERIAL).withMessage('Seleccione el tipo de material.'), urlVideo, orden],
  actualizar: [id, titulo(true), urlVideo, orden],
  material: [id],
};
