const { body, param, query } = require('express-validator');
const { MODALIDAD, ESTATUS_GRUPO } = require('../../models/enums');

// Validaciones del servidor para grupos y sesiones (RNF-09).
const id = (nombre = 'id') => param(nombre).isInt({ min: 1 }).withMessage('Identificador no válido.').toInt();
const fecha = (campo, etiqueta, opcional) => {
  let r = body(campo);
  if (opcional) r = r.optional();
  return r.isISO8601({ strict: true }).withMessage(`Escriba ${etiqueta} con formato válido.`).bail()
    .customSanitizer((v) => v.slice(0, 10));
};
const persona = (campo) => body(campo).optional({ values: 'null' })
  .custom((v) => v === '' || Number.isInteger(Number(v))).withMessage('Selección no válida.')
  .customSanitizer((v) => (v === '' || v === null ? null : Number(v)));
const hora = (campo, etiqueta) => body(campo)
  .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage(`Escriba ${etiqueta} en formato de 24 horas, por ejemplo 09:00.`);

const datosGrupo = (opcional) => [
  body('clave').optional({ values: 'falsy' }).isString().trim().toUpperCase()
    .isLength({ max: 20 }).withMessage('La clave debe tener como máximo 20 caracteres.')
    .matches(/^[A-Z0-9.\-]+$/).withMessage('La clave solo puede tener letras, números, puntos y guiones.'),
  fecha('fechaInicio', 'la fecha de inicio', opcional),
  fecha('fechaFin', 'la fecha de fin', opcional),
  (opcional ? body('cupo').optional() : body('cupo'))
    .isInt({ min: 1, max: 500 }).withMessage('El cupo debe ser un número entre 1 y 500.').toInt(),
  (opcional ? body('modalidad').optional() : body('modalidad'))
    .isIn(MODALIDAD).withMessage('Seleccione la modalidad: presencial, en línea o mixta.'),
  body('enlaceVideoconferencia').optional({ values: 'falsy' }).trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Escriba el enlace completo, empezando con https://')
    .isLength({ max: 500 }).withMessage('El enlace debe tener como máximo 500 caracteres.'),
  persona('idInstructor'),
  persona('idEvaluador'),
];

const datosSesion = [
  fecha('fecha', 'la fecha de la sesión', false),
  hora('horaInicio', 'la hora de inicio'),
  hora('horaFin', 'la hora de fin'),
  body('tema').optional({ values: 'null' }).isString().trim().isLength({ max: 200 }).withMessage('El tema debe tener como máximo 200 caracteres.'),
];

module.exports = {
  listar: [
    query('buscar').optional().trim().isLength({ max: 20 }),
    query('idCurso').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
    query('estatus').optional({ values: 'falsy' }).isIn(ESTATUS_GRUPO),
    query('pagina').optional().isInt({ min: 1 }).toInt(),
    query('limite').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  obtener: [id()],
  crear: [body('idCurso').isInt({ min: 1 }).withMessage('Seleccione el curso.').toInt(), ...datosGrupo(false)],
  actualizar: [id(), ...datosGrupo(true)],
  estatus: [id(), body('estatus').isIn(ESTATUS_GRUPO).withMessage('Estatus no válido.')],
  agregarSesion: [id(), ...datosSesion],
  actualizarSesion: [id(), ...datosSesion],
  eliminarSesion: [id()],
};
