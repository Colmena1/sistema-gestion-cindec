const { body, param, query } = require('express-validator');

// Validaciones del servidor para inscripción y asistencia (RNF-09).
const id = param('id').isInt({ min: 1 }).withMessage('Identificador no válido.').toInt();

module.exports = {
  candidatos: [id, query('buscar').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Escriba al menos 2 letras para buscar.')],
  inscribir: [
    id,
    body('idParticipante').isInt({ min: 1 }).withMessage('Seleccione al participante.').toInt(),
    body('esRefuerzo').optional().isBoolean({ strict: true }),
  ],
  estatus: [id, body('estatus').isIn(['inscrito', 'capacitacion_concluida', 'baja']).withMessage('Estatus no válido.')],
  sesion: [id],
  guardarAsistencia: [
    id,
    body('registros').isArray({ min: 1 }).withMessage('No hay registros de asistencia.'),
    body('registros.*.idInscripcion').isInt({ min: 1 }).toInt(),
    body('registros.*.asistio').isBoolean({ strict: true }).withMessage('Marque si asistió o no asistió.'),
    body('registros.*.observaciones').optional({ values: 'null' }).isString().trim().isLength({ max: 500 }),
  ],
};
