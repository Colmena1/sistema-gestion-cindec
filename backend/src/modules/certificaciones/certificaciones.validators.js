const { body, param, query } = require('express-validator');
const { ESTATUS_TRAMITE } = require('../../models/enums');

// Validaciones del servidor para el módulo Certificaciones (RNF-09).
const id = param('id').isInt({ min: 1 }).withMessage('Identificador no válido.').toInt();
const fecha = (campo, mensaje) => body(campo).isISO8601({ strict: true }).withMessage(mensaje).bail().customSanitizer((v) => String(v).slice(0, 10));
const observaciones = body('observaciones').optional({ values: 'falsy' }).isString().trim()
  .isLength({ max: 1000 }).withMessage('Las observaciones deben tener como máximo 1000 caracteres.');

module.exports = {
  listar: [
    query('estatus').optional({ values: 'falsy' }).isIn(ESTATUS_TRAMITE),
    query('buscar').optional({ values: 'falsy' }).trim().isLength({ max: 100 }),
    query('idCurso').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
    query('desde').optional({ values: 'falsy' }).isISO8601({ strict: true }).withMessage('Fecha "desde" no válida.'),
    query('hasta').optional({ values: 'falsy' }).isISO8601({ strict: true }).withMessage('Fecha "hasta" no válida.'),
  ],
  crear: [body('idIntento').isInt({ min: 1 }).withMessage('Seleccione al participante competente.').toInt(), observaciones],
  tramite: [id],
  avanzar: [id, body('estatus').isIn(ESTATUS_TRAMITE).withMessage('Estatus no válido.'), observaciones],
  documento: [
    id,
    body('folioConocer').isString().withMessage('Escriba el folio CONOCER.').bail().trim()
      .notEmpty().withMessage('Escriba el folio CONOCER.')
      .isLength({ max: 50 }).withMessage('El folio debe tener como máximo 50 caracteres.')
      .customSanitizer((v) => v.toUpperCase()),
    body('tipoDocumento').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }).withMessage('Máximo 100 caracteres.'),
    fecha('fechaEmision', 'Escriba la fecha de emisión.'),
    body('vigencia').optional({ values: 'falsy' }).isISO8601({ strict: true }).withMessage('Fecha de vigencia no válida.').bail()
      .customSanitizer((v) => String(v).slice(0, 10)),
  ],
  verificar: [
    query('folio').isString().withMessage('Escriba el folio.').bail().trim()
      .notEmpty().withMessage('Escriba el folio que aparece en el certificado.')
      .isLength({ max: 50 }).withMessage('El folio debe tener como máximo 50 caracteres.'),
  ],
};
