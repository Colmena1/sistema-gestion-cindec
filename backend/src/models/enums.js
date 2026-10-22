// Valores permitidos de cada columna ENUM de cindec_db.
// Son los mismos de los scripts SQL y de las 10 enumeraciones del diagrama de clases (figura 13).
// Se definen una sola vez aquí para usarlos en los modelos y en las validaciones.
module.exports = {
  MODALIDAD: ['presencial', 'en_linea', 'mixta'],
  ESTATUS_GRUPO: ['planeado', 'en_curso', 'concluido', 'cancelado'],
  ORIGEN_REGISTRO: ['autorregistro', 'alta_coordinador'],
  TIPO_DOCUMENTO_PARTICIPANTE: [
    'ine', 'cartilla_militar', 'cedula_profesional', 'pasaporte',
    'fotografia', 'ficha_registro', 'identificacion_tutor',
  ],
  ESTATUS_INSCRIPCION: ['inscrito', 'capacitacion_concluida', 'baja'],
  TIPO_MATERIAL: ['manual', 'presentacion', 'pdf', 'ejercicio', 'video'],
  TIPO_INSTRUMENTO: ['guia_observacion', 'lista_cotejo', 'cuestionario'],
  ESTATUS_INTENTO: ['pendiente', 'aprobada', 'no_aprobada'],
  DICTAMEN: ['competente', 'todavia_no_competente'],
  ESTATUS_TRAMITE: ['solicitado', 'pagado', 'en_tramite', 'emitido'],
};
