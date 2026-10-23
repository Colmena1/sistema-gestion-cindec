const AppError = require('../../utils/AppError');
const { sequelize } = require('../../models');

// ---------------------------------------------------------------------
// Reportes: CU-22 Generar y exportar reportes (RF-REP-01 y 02) — Coordinador y Administrador.
// Cada reporte se arma solo con datos que ya capturaron los demás módulos (no pide información nueva).
// Todos devuelven la misma forma: { columnas, filas, resumen }, que usan la pantalla, el PDF y el Excel.
// Las consultas son SQL de solo lectura con parámetros (:desde, :hasta, :idCurso…), nunca texto concatenado.
// ---------------------------------------------------------------------

const ESTATUS_GRUPO = { planeado: 'Planeado', en_curso: 'En curso', concluido: 'Concluido', cancelado: 'Cancelado' };
const ESTATUS_INSCRIPCION = { inscrito: 'Inscrito', capacitacion_concluida: 'Capacitación concluida', baja: 'Baja' };
const ESTATUS_INTENTO = { pendiente: 'Pendiente', aprobada: 'Aprobada', no_aprobada: 'No aprobada' };
const JUICIO = { competente: 'Competente', todavia_no_competente: 'Todavía no competente' };
const ESTATUS_TRAMITE = { solicitado: 'Solicitado', pagado: 'Pagado', en_tramite: 'En trámite', emitido: 'Emitido' };
const MODALIDAD = { presencial: 'Presencial', en_linea: 'En línea', mixta: 'Mixta' };
const ORIGEN = { autorregistro: 'Autorregistro', alta_coordinador: 'Alta por coordinación' };
const TIPO_INSTRUMENTO = { guia_observacion: 'Guía de observación', lista_cotejo: 'Lista de cotejo', cuestionario: 'Cuestionario' };

// Fechas en formato de la guía de estilo (dd/mm/aaaa) sin convertir zona horaria
// (mysql2 entrega DATE/DATETIME como Date en la zona -06:00 configurada; se muestran en hora de México)
const f = (v) => {
  if (!v) return '';
  if (v instanceof Date) return v.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit', year: 'numeric' });
  return String(v).slice(0, 10).split('-').reverse().join('/');
};
const fh = (v) => {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  return d.toLocaleString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');
};
const n = (v) => (v === null || v === undefined ? 0 : Number(v));
const pct = (a, b) => (b ? `${Math.round((n(a) * 100) / n(b))}%` : '—');
const cal = (v) => (v === null || v === undefined ? '' : String(Number(v)));

// Condiciones de periodo: para DATE se compara directo; para DATETIME se incluye todo el día "hasta"
const enPeriodoFecha = (col, p) => [p.desde && `${col} >= :desde`, p.hasta && `${col} <= :hasta`].filter(Boolean);
const enPeriodoInstante = (col, p) => [p.desde && `${col} >= :desde`, p.hasta && `${col} < DATE_ADD(:hasta, INTERVAL 1 DAY)`].filter(Boolean);
// Un grupo cae en el periodo si sus fechas se cruzan con él
const grupoEnPeriodo = (p) => [p.hasta && 'g.fecha_inicio <= :hasta', p.desde && 'g.fecha_fin >= :desde'].filter(Boolean);
const donde = (condiciones) => (condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '');

const consultar = (sql, filtros) => sequelize.query(sql, {
  replacements: { desde: filtros.desde || null, hasta: filtros.hasta || null, idCurso: filtros.idCurso || null, estatus: filtros.estatus || null },
  type: sequelize.QueryTypes.SELECT,
});
const contar = (filas, campo, textos) => Object.entries(textos)
  .map(([clave, texto]) => ({ etiqueta: texto, valor: filas.filter((x) => x[campo] === clave).length }));

// Columna: { clave, titulo, ancho (proporcional para el PDF), alinear? }
const col = (clave, titulo, ancho = 1, alinear = 'left') => ({ clave, titulo, ancho, alinear });

// ---------------------------------------------------------------------
// Catálogo de reportes (RF-REP-01)
// filtros: qué filtros aplica cada uno (periodo siempre; curso y estatus si se indica)
// ---------------------------------------------------------------------
const REPORTES = {
  participantes: {
    titulo: 'Participantes registrados',
    descripcion: 'Participantes dados de alta en el periodo (por autorregistro o por la coordinación).',
    periodo: 'Fecha de registro',
    filtros: [],
    columnas: [col('nombre', 'Participante', 2), col('curp', 'CURP', 1.6), col('correo', 'Correo', 2), col('empresa', 'Empresa', 1.5),
      col('origen', 'Origen', 1.2), col('cursoInteres', 'Curso de interés', 1.6), col('fecha', 'Registro', 0.9)],
    async obtener(p) {
      const filas = await consultar(`
        SELECT CONCAT(u.nombre, ' ', u.apellidos) AS nombre, pa.curp, u.correo, pa.empresa_procedencia AS empresa,
               pa.origen_registro AS origen, c.nombre AS cursoInteres, u.fecha_registro AS fecha
        FROM participante pa JOIN usuario u ON u.id_usuario = pa.id_usuario
        LEFT JOIN curso c ON c.id_curso = pa.id_curso_interes
        ${donde(enPeriodoInstante('u.fecha_registro', p))}
        ORDER BY u.fecha_registro, u.apellidos`, p);
      return {
        filas: filas.map((r) => ({ ...r, empresa: r.empresa || '—', origen: ORIGEN[r.origen], cursoInteres: r.cursoInteres || 'Sin preferencia', fecha: f(r.fecha) })),
        resumen: [{ etiqueta: 'Total', valor: filas.length }, ...contar(filas, 'origen', ORIGEN)],
      };
    },
  },

  cursos: {
    titulo: 'Cursos impartidos',
    descripcion: 'Grupos cuyas fechas caen en el periodo, con su estatus (activos, concluidos…), instructor e inscritos.',
    periodo: 'Fechas del grupo',
    filtros: ['curso'],
    columnas: [col('clave', 'Grupo', 1.2), col('curso', 'Curso', 1.8), col('estandar', 'Estándar', 0.9), col('fechas', 'Fechas', 1.5),
      col('modalidad', 'Modalidad', 0.9), col('estatus', 'Estatus', 0.9), col('instructor', 'Instructor', 1.5), col('inscritos', 'Inscritos', 0.8, 'right'), col('sesiones', 'Sesiones', 0.7, 'right')],
    async obtener(p) {
      const filas = await consultar(`
        SELECT g.clave, c.nombre AS curso, e.codigo AS estandar, g.fecha_inicio, g.fecha_fin, g.modalidad, g.estatus, g.cupo,
               CONCAT(ui.nombre, ' ', ui.apellidos) AS instructor,
               (SELECT COUNT(*) FROM inscripcion i WHERE i.id_grupo = g.id_grupo AND i.estatus <> 'baja') AS inscritos,
               (SELECT COUNT(*) FROM sesion s WHERE s.id_grupo = g.id_grupo) AS sesiones
        FROM grupo g JOIN curso c ON c.id_curso = g.id_curso JOIN estandar_competencia e ON e.id_estandar = c.id_estandar
        LEFT JOIN usuario ui ON ui.id_usuario = g.id_instructor
        ${donde([...grupoEnPeriodo(p), p.idCurso && 'g.id_curso = :idCurso'].filter(Boolean))}
        ORDER BY g.fecha_inicio, g.clave`, p);
      return {
        filas: filas.map((r) => ({
          clave: r.clave, curso: r.curso, estandar: r.estandar, fechas: `${f(r.fecha_inicio)} al ${f(r.fecha_fin)}`,
          modalidad: MODALIDAD[r.modalidad], estatus: ESTATUS_GRUPO[r.estatus], instructor: r.instructor || 'Sin asignar',
          inscritos: `${n(r.inscritos)} / ${r.cupo}`, sesiones: n(r.sesiones), _estatus: r.estatus,
        })),
        resumen: [{ etiqueta: 'Grupos', valor: filas.length }, ...contar(filas, 'estatus', ESTATUS_GRUPO)],
      };
    },
  },

  inscripciones: {
    titulo: 'Inscripciones por curso',
    descripcion: 'Inscripciones registradas en el periodo, agrupadas por curso.',
    periodo: 'Fecha de inscripción',
    filtros: ['curso'],
    columnas: [col('curso', 'Curso', 2.2), col('estandar', 'Estándar', 1), col('grupos', 'Grupos', 0.8, 'right'), col('total', 'Inscripciones', 1, 'right'),
      col('inscritos', 'Inscritos', 0.9, 'right'), col('concluidas', 'Capacitación concluida', 1.3, 'right'), col('bajas', 'Bajas', 0.8, 'right'), col('refuerzos', 'Refuerzos', 0.9, 'right')],
    async obtener(p) {
      const filas = await consultar(`
        SELECT c.nombre AS curso, e.codigo AS estandar, COUNT(DISTINCT g.id_grupo) AS grupos, COUNT(*) AS total,
               SUM(i.estatus = 'inscrito') AS inscritos, SUM(i.estatus = 'capacitacion_concluida') AS concluidas,
               SUM(i.estatus = 'baja') AS bajas, SUM(i.es_refuerzo) AS refuerzos
        FROM inscripcion i JOIN grupo g ON g.id_grupo = i.id_grupo JOIN curso c ON c.id_curso = g.id_curso
        JOIN estandar_competencia e ON e.id_estandar = c.id_estandar
        ${donde([...enPeriodoInstante('i.fecha_inscripcion', p), p.idCurso && 'g.id_curso = :idCurso'].filter(Boolean))}
        GROUP BY c.id_curso, c.nombre, e.codigo ORDER BY total DESC, c.nombre`, p);
      const lista = filas.map((r) => ({ ...r, grupos: n(r.grupos), total: n(r.total), inscritos: n(r.inscritos), concluidas: n(r.concluidas), bajas: n(r.bajas), refuerzos: n(r.refuerzos) }));
      const suma = (k) => lista.reduce((a, r) => a + r[k], 0);
      return {
        filas: lista,
        resumen: [{ etiqueta: 'Cursos', valor: lista.length }, { etiqueta: 'Inscripciones', valor: suma('total') }, { etiqueta: 'Capacitación concluida', valor: suma('concluidas') }, { etiqueta: 'Bajas', valor: suma('bajas') }],
      };
    },
  },

  avance: {
    titulo: 'Avance de participantes',
    descripcion: 'Por participante inscrito (sin baja) en grupos del periodo: asistencia, materiales consultados, capacitación y último resultado de evaluación.',
    periodo: 'Fechas del grupo',
    filtros: ['curso'],
    columnas: [col('participante', 'Participante', 1.8), col('grupo', 'Grupo', 1.1), col('curso', 'Curso', 1.6), col('asistencia', 'Asistencia', 1.1),
      col('materiales', 'Materiales', 0.9), col('capacitacion', 'Capacitación', 1.3), col('evaluacion', 'Último resultado', 1.9)],
    async obtener(p) {
      const filas = await consultar(`
        SELECT CONCAT(u.nombre, ' ', u.apellidos) AS participante, g.clave AS grupo, c.nombre AS curso, i.estatus,
               (SELECT COUNT(*) FROM asistencia a WHERE a.id_inscripcion = i.id_inscripcion AND a.asistio = TRUE) AS presentes,
               (SELECT COUNT(*) FROM asistencia a WHERE a.id_inscripcion = i.id_inscripcion) AS registradas,
               (SELECT COUNT(*) FROM material m WHERE m.id_curso = g.id_curso) AS materiales,
               (SELECT COUNT(*) FROM consulta_material cm JOIN material m ON m.id_material = cm.id_material
                 WHERE cm.id_participante = i.id_participante AND m.id_curso = g.id_curso) AS consultados,
               (SELECT ie.estatus FROM intento_evaluacion ie WHERE ie.id_inscripcion = i.id_inscripcion ORDER BY ie.numero_intento DESC LIMIT 1) AS ultEstatus,
               (SELECT ie.dictamen FROM intento_evaluacion ie WHERE ie.id_inscripcion = i.id_inscripcion ORDER BY ie.numero_intento DESC LIMIT 1) AS ultJuicio,
               (SELECT ie.calificacion FROM intento_evaluacion ie WHERE ie.id_inscripcion = i.id_inscripcion ORDER BY ie.numero_intento DESC LIMIT 1) AS ultCalificacion
        FROM inscripcion i JOIN grupo g ON g.id_grupo = i.id_grupo JOIN curso c ON c.id_curso = g.id_curso
        JOIN participante pa ON pa.id_participante = i.id_participante JOIN usuario u ON u.id_usuario = pa.id_usuario
        ${donde(["i.estatus <> 'baja'", ...grupoEnPeriodo(p), p.idCurso && 'g.id_curso = :idCurso'].filter(Boolean))}
        ORDER BY g.fecha_inicio, g.clave, u.apellidos`, p);
      return {
        filas: filas.map((r) => ({
          participante: r.participante, grupo: r.grupo, curso: r.curso,
          asistencia: n(r.registradas) ? `${n(r.presentes)} de ${n(r.registradas)} (${pct(r.presentes, r.registradas)})` : 'Sin registro',
          materiales: n(r.materiales) ? `${n(r.consultados)} de ${n(r.materiales)}` : 'Sin materiales',
          capacitacion: ESTATUS_INSCRIPCION[r.estatus],
          evaluacion: r.ultEstatus ? [ESTATUS_INTENTO[r.ultEstatus], r.ultCalificacion !== null && `(${cal(r.ultCalificacion)})`, r.ultJuicio && `· ${JUICIO[r.ultJuicio]}`].filter(Boolean).join(' ') : 'Sin evaluar',
        })),
        resumen: [
          { etiqueta: 'Participantes', valor: filas.length },
          { etiqueta: 'Capacitación concluida', valor: filas.filter((r) => r.estatus === 'capacitacion_concluida').length },
          { etiqueta: 'Evaluados', valor: filas.filter((r) => r.ultEstatus && r.ultEstatus !== 'pendiente').length },
          { etiqueta: 'Competentes', valor: filas.filter((r) => r.ultJuicio === 'competente').length },
        ],
      };
    },
  },

  asistencia: {
    titulo: 'Asistencia por sesión',
    descripcion: 'Sesiones del periodo con presentes, ausentes y porcentaje de asistencia.',
    periodo: 'Fecha de la sesión',
    filtros: ['curso'],
    columnas: [col('grupo', 'Grupo', 1.2), col('curso', 'Curso', 1.8), col('fecha', 'Fecha', 0.9), col('horario', 'Horario', 1), col('tema', 'Tema', 1.8),
      col('presentes', 'Presentes', 0.8, 'right'), col('ausentes', 'Ausentes', 0.8, 'right'), col('sinRegistro', 'Sin registro', 0.9, 'right'), col('porcentaje', 'Asistencia', 0.8, 'right')],
    async obtener(p) {
      const filas = await consultar(`
        SELECT g.clave AS grupo, c.nombre AS curso, s.fecha, s.hora_inicio, s.hora_fin, s.tema,
               (SELECT COUNT(*) FROM asistencia a WHERE a.id_sesion = s.id_sesion AND a.asistio = TRUE) AS presentes,
               (SELECT COUNT(*) FROM asistencia a WHERE a.id_sesion = s.id_sesion AND a.asistio = FALSE) AS ausentes,
               (SELECT COUNT(*) FROM inscripcion i WHERE i.id_grupo = g.id_grupo AND i.estatus <> 'baja') AS inscritos
        FROM sesion s JOIN grupo g ON g.id_grupo = s.id_grupo JOIN curso c ON c.id_curso = g.id_curso
        ${donde(["g.estatus <> 'cancelado'", ...enPeriodoFecha('s.fecha', p), p.idCurso && 'g.id_curso = :idCurso'].filter(Boolean))}
        ORDER BY s.fecha, s.hora_inicio, g.clave`, p);
      const lista = filas.map((r) => {
        const tomadas = n(r.presentes) + n(r.ausentes);
        return {
          grupo: r.grupo, curso: r.curso, fecha: f(r.fecha), horario: `${String(r.hora_inicio).slice(0, 5)} a ${String(r.hora_fin).slice(0, 5)}`, tema: r.tema || '—',
          presentes: n(r.presentes), ausentes: n(r.ausentes), sinRegistro: Math.max(0, n(r.inscritos) - tomadas), porcentaje: pct(r.presentes, tomadas),
        };
      });
      const presentes = lista.reduce((a, r) => a + r.presentes, 0);
      const ausentes = lista.reduce((a, r) => a + r.ausentes, 0);
      return {
        filas: lista,
        resumen: [{ etiqueta: 'Sesiones', valor: lista.length }, { etiqueta: 'Presentes', valor: presentes }, { etiqueta: 'Ausentes', valor: ausentes }, { etiqueta: 'Asistencia general', valor: pct(presentes, presentes + ausentes) }],
      };
    },
  },

  evaluaciones: {
    titulo: 'Evaluaciones realizadas',
    descripcion: 'Intentos de evaluación calificados en el periodo: aprobadas y no aprobadas.',
    periodo: 'Fecha de aplicación',
    filtros: ['curso'],
    columnas: [col('fecha', 'Fecha', 0.9), col('participante', 'Participante', 1.8), col('estandar', 'Estándar', 0.9), col('grupo', 'Grupo', 1.1),
      col('instrumento', 'Instrumento', 1.4), col('intento', 'Intento', 0.6, 'right'), col('calificacion', 'Calificación', 0.9, 'right'), col('minima', 'Mínima', 0.7, 'right'), col('resultado', 'Evaluación', 1), col('evaluador', 'Evaluador', 1.5)],
    async obtener(p) {
      const filas = await consultar(`
        SELECT ie.fecha_aplicacion, CONCAT(u.nombre, ' ', u.apellidos) AS participante, e.codigo AS estandar, g.clave AS grupo,
               ev.tipo_instrumento, ie.numero_intento, ie.calificacion, ev.calificacion_minima, ie.estatus,
               CONCAT(uv.nombre, ' ', uv.apellidos) AS evaluador
        FROM intento_evaluacion ie JOIN evaluacion ev ON ev.id_evaluacion = ie.id_evaluacion
        JOIN inscripcion i ON i.id_inscripcion = ie.id_inscripcion JOIN grupo g ON g.id_grupo = i.id_grupo
        JOIN curso c ON c.id_curso = g.id_curso JOIN estandar_competencia e ON e.id_estandar = c.id_estandar
        JOIN participante pa ON pa.id_participante = i.id_participante JOIN usuario u ON u.id_usuario = pa.id_usuario
        LEFT JOIN usuario uv ON uv.id_usuario = ie.id_evaluador
        ${donde(["ie.estatus <> 'pendiente'", ...enPeriodoFecha('ie.fecha_aplicacion', p), p.idCurso && 'g.id_curso = :idCurso'].filter(Boolean))}
        ORDER BY ie.fecha_aplicacion, u.apellidos, ie.numero_intento`, p);
      return {
        filas: filas.map((r) => ({
          fecha: f(r.fecha_aplicacion), participante: r.participante, estandar: r.estandar, grupo: r.grupo, instrumento: TIPO_INSTRUMENTO[r.tipo_instrumento],
          intento: n(r.numero_intento), calificacion: cal(r.calificacion), minima: cal(r.calificacion_minima), resultado: ESTATUS_INTENTO[r.estatus], evaluador: r.evaluador || '—', _estatus: r.estatus,
        })),
        resumen: [{ etiqueta: 'Evaluaciones', valor: filas.length }, { etiqueta: 'Aprobadas', valor: filas.filter((r) => r.estatus === 'aprobada').length }, { etiqueta: 'No aprobadas', valor: filas.filter((r) => r.estatus === 'no_aprobada').length }],
      };
    },
  },

  competentes: {
    titulo: 'Personas competentes y no competentes',
    descripcion: 'Último juicio de competencia de cada participante evaluado en el periodo.',
    periodo: 'Fecha del último juicio',
    filtros: ['curso'],
    columnas: [col('participante', 'Participante', 1.9), col('curp', 'CURP', 1.5), col('estandar', 'Estándar', 0.9), col('grupo', 'Grupo', 1.1),
      col('intentos', 'Intentos', 0.7, 'right'), col('calificacion', 'Calificación', 0.9, 'right'), col('juicio', 'Juicio de competencia', 1.5), col('fecha', 'Fecha', 0.9)],
    async obtener(p) {
      const filas = await consultar(`
        SELECT CONCAT(u.nombre, ' ', u.apellidos) AS participante, pa.curp, e.codigo AS estandar, g.clave AS grupo,
               ie.numero_intento AS intentos, ie.calificacion, ie.dictamen, ie.fecha_aplicacion
        FROM intento_evaluacion ie
        JOIN inscripcion i ON i.id_inscripcion = ie.id_inscripcion JOIN grupo g ON g.id_grupo = i.id_grupo
        JOIN curso c ON c.id_curso = g.id_curso JOIN estandar_competencia e ON e.id_estandar = c.id_estandar
        JOIN participante pa ON pa.id_participante = i.id_participante JOIN usuario u ON u.id_usuario = pa.id_usuario
        ${donde([
          "ie.estatus <> 'pendiente'",
          // solo el último intento calificado de cada inscripción
          "ie.numero_intento = (SELECT MAX(x.numero_intento) FROM intento_evaluacion x WHERE x.id_inscripcion = ie.id_inscripcion AND x.estatus <> 'pendiente')",
          ...enPeriodoFecha('ie.fecha_aplicacion', p), p.idCurso && 'g.id_curso = :idCurso',
        ].filter(Boolean))}
        ORDER BY ie.dictamen, u.apellidos`, p);
      return {
        filas: filas.map((r) => ({
          participante: r.participante, curp: r.curp, estandar: r.estandar, grupo: r.grupo, intentos: n(r.intentos), calificacion: cal(r.calificacion),
          juicio: r.dictamen ? JUICIO[r.dictamen] : 'Sin juicio', fecha: f(r.fecha_aplicacion), _estatus: r.dictamen,
        })),
        resumen: [{ etiqueta: 'Evaluados', valor: filas.length }, ...contar(filas, 'dictamen', JUICIO)],
      };
    },
  },

  certificaciones: {
    titulo: 'Certificaciones por estatus',
    descripcion: 'Trámites de certificación solicitados en el periodo: solicitados, pagados, en trámite y emitidos.',
    periodo: 'Fecha de solicitud',
    filtros: ['curso', 'estatus'],
    columnas: [col('folio', 'Folio interno', 1.2), col('participante', 'Participante', 1.8), col('estandar', 'Estándar', 0.9), col('grupo', 'Grupo', 1.1),
      col('solicitud', 'Solicitud', 0.9), col('estatus', 'Estatus', 0.9), col('folioConocer', 'Folio CONOCER', 1.2), col('emision', 'Emisión', 0.9), col('vigencia', 'Vigencia', 1)],
    async obtener(p) {
      const filas = await consultar(`
        SELECT t.folio_interno, CONCAT(u.nombre, ' ', u.apellidos) AS participante, e.codigo AS estandar, g.clave AS grupo,
               t.fecha_solicitud, t.estatus, d.folio_conocer, d.fecha_emision, d.vigencia
        FROM tramite_certificacion t JOIN intento_evaluacion ie ON ie.id_intento = t.id_intento
        JOIN inscripcion i ON i.id_inscripcion = ie.id_inscripcion JOIN grupo g ON g.id_grupo = i.id_grupo
        JOIN curso c ON c.id_curso = g.id_curso JOIN estandar_competencia e ON e.id_estandar = c.id_estandar
        JOIN participante pa ON pa.id_participante = i.id_participante JOIN usuario u ON u.id_usuario = pa.id_usuario
        LEFT JOIN documento_certificacion d ON d.id_tramite = t.id_tramite
        ${donde([...enPeriodoFecha('t.fecha_solicitud', p), p.idCurso && 'g.id_curso = :idCurso', p.estatus && 't.estatus = :estatus'].filter(Boolean))}
        ORDER BY FIELD(t.estatus, 'solicitado', 'pagado', 'en_tramite', 'emitido'), t.fecha_solicitud`, p);
      return {
        filas: filas.map((r) => ({
          folio: r.folio_interno, participante: r.participante, estandar: r.estandar, grupo: r.grupo, solicitud: f(r.fecha_solicitud), estatus: ESTATUS_TRAMITE[r.estatus],
          folioConocer: r.folio_conocer || '—', emision: r.fecha_emision ? f(r.fecha_emision) : '—', vigencia: r.folio_conocer ? (r.vigencia ? f(r.vigencia) : 'Sin vencimiento') : '—', _estatus: r.estatus,
        })),
        resumen: [{ etiqueta: 'Trámites', valor: filas.length }, ...contar(filas, 'estatus', ESTATUS_TRAMITE)],
      };
    },
  },

  historialCertificaciones: {
    titulo: 'Historial de certificaciones',
    descripcion: 'Cada cambio de estatus de los trámites de certificación en el periodo, con sus observaciones.',
    periodo: 'Fecha del cambio',
    filtros: ['curso'],
    columnas: [col('fecha', 'Fecha y hora', 1.1), col('folio', 'Folio interno', 1.2), col('participante', 'Participante', 1.8), col('estandar', 'Estándar', 0.9),
      col('estatus', 'Estatus', 0.9), col('observaciones', 'Observaciones', 2.6)],
    async obtener(p) {
      const filas = await consultar(`
        SELECT h.fecha_cambio, t.folio_interno, CONCAT(u.nombre, ' ', u.apellidos) AS participante, e.codigo AS estandar, h.estatus, h.observaciones
        FROM historial_tramite h JOIN tramite_certificacion t ON t.id_tramite = h.id_tramite
        JOIN intento_evaluacion ie ON ie.id_intento = t.id_intento
        JOIN inscripcion i ON i.id_inscripcion = ie.id_inscripcion JOIN grupo g ON g.id_grupo = i.id_grupo
        JOIN curso c ON c.id_curso = g.id_curso JOIN estandar_competencia e ON e.id_estandar = c.id_estandar
        JOIN participante pa ON pa.id_participante = i.id_participante JOIN usuario u ON u.id_usuario = pa.id_usuario
        ${donde([...enPeriodoInstante('h.fecha_cambio', p), p.idCurso && 'g.id_curso = :idCurso'].filter(Boolean))}
        ORDER BY h.fecha_cambio, h.id_historial`, p);
      return {
        filas: filas.map((r) => ({ fecha: fh(r.fecha_cambio), folio: r.folio_interno, participante: r.participante, estandar: r.estandar, estatus: ESTATUS_TRAMITE[r.estatus], observaciones: r.observaciones || '—', _estatus: r.estatus })),
        resumen: [{ etiqueta: 'Movimientos', valor: filas.length }, { etiqueta: 'Trámites', valor: new Set(filas.map((r) => r.folio_interno)).size }, { etiqueta: 'Emitidos', valor: filas.filter((r) => r.estatus === 'emitido').length }],
      };
    },
  },

  instructores: {
    titulo: 'Reporte por instructor',
    descripcion: 'Grupos impartidos por cada instructor en el periodo, participantes atendidos y asistencia promedio.',
    periodo: 'Fechas del grupo',
    filtros: ['curso'],
    columnas: [col('instructor', 'Instructor', 2), col('correo', 'Correo', 2), col('grupos', 'Grupos', 0.8, 'right'), col('concluidos', 'Concluidos', 0.9, 'right'),
      col('participantes', 'Participantes', 1, 'right'), col('sesiones', 'Sesiones', 0.8, 'right'), col('asistencia', 'Asistencia promedio', 1.2, 'right')],
    async obtener(p) {
      const filas = await consultar(`
        SELECT CONCAT(u.nombre, ' ', u.apellidos) AS instructor, u.correo,
               COUNT(DISTINCT g.id_grupo) AS grupos, COUNT(DISTINCT CASE WHEN g.estatus = 'concluido' THEN g.id_grupo END) AS concluidos,
               (SELECT COUNT(*) FROM inscripcion i JOIN grupo g2 ON g2.id_grupo = i.id_grupo
                 WHERE g2.id_instructor = u.id_usuario AND i.estatus <> 'baja' AND g2.estatus <> 'cancelado'
                 ${grupoEnPeriodo(p).map((x) => `AND ${x.replace(/g\./g, 'g2.')}`).join(' ')}
                 ${p.idCurso ? 'AND g2.id_curso = :idCurso' : ''}) AS participantes,
               (SELECT COUNT(*) FROM sesion s JOIN grupo g2 ON g2.id_grupo = s.id_grupo
                 WHERE g2.id_instructor = u.id_usuario AND g2.estatus <> 'cancelado'
                 ${grupoEnPeriodo(p).map((x) => `AND ${x.replace(/g\./g, 'g2.')}`).join(' ')}
                 ${p.idCurso ? 'AND g2.id_curso = :idCurso' : ''}) AS sesiones,
               (SELECT SUM(a.asistio = TRUE) FROM asistencia a JOIN sesion s ON s.id_sesion = a.id_sesion JOIN grupo g2 ON g2.id_grupo = s.id_grupo
                 WHERE g2.id_instructor = u.id_usuario ${grupoEnPeriodo(p).map((x) => `AND ${x.replace(/g\./g, 'g2.')}`).join(' ')}
                 ${p.idCurso ? 'AND g2.id_curso = :idCurso' : ''}) AS presentes,
               (SELECT COUNT(*) FROM asistencia a JOIN sesion s ON s.id_sesion = a.id_sesion JOIN grupo g2 ON g2.id_grupo = s.id_grupo
                 WHERE g2.id_instructor = u.id_usuario ${grupoEnPeriodo(p).map((x) => `AND ${x.replace(/g\./g, 'g2.')}`).join(' ')}
                 ${p.idCurso ? 'AND g2.id_curso = :idCurso' : ''}) AS registradas
        FROM grupo g JOIN usuario u ON u.id_usuario = g.id_instructor
        ${donde(["g.estatus <> 'cancelado'", ...grupoEnPeriodo(p), p.idCurso && 'g.id_curso = :idCurso'].filter(Boolean))}
        GROUP BY u.id_usuario, u.nombre, u.apellidos, u.correo ORDER BY u.apellidos`, p);
      return {
        filas: filas.map((r) => ({ instructor: r.instructor, correo: r.correo, grupos: n(r.grupos), concluidos: n(r.concluidos), participantes: n(r.participantes), sesiones: n(r.sesiones), asistencia: pct(r.presentes, r.registradas) })),
        resumen: [{ etiqueta: 'Instructores', valor: filas.length }, { etiqueta: 'Grupos', valor: filas.reduce((a, r) => a + n(r.grupos), 0) }, { etiqueta: 'Participantes', valor: filas.reduce((a, r) => a + n(r.participantes), 0) }],
      };
    },
  },

  evaluadores: {
    titulo: 'Reporte por evaluador',
    descripcion: 'Evaluaciones calificadas por cada evaluador en el periodo, con su resultado y juicio de competencia.',
    periodo: 'Fecha de aplicación',
    filtros: ['curso'],
    columnas: [col('evaluador', 'Evaluador', 2), col('correo', 'Correo', 2), col('evaluaciones', 'Evaluaciones', 1, 'right'), col('aprobadas', 'Aprobadas', 0.9, 'right'),
      col('noAprobadas', 'No aprobadas', 1, 'right'), col('competentes', 'Competentes', 1, 'right'), col('noCompetentes', 'Todavía no competentes', 1.4, 'right')],
    async obtener(p) {
      const filas = await consultar(`
        SELECT CONCAT(u.nombre, ' ', u.apellidos) AS evaluador, u.correo, COUNT(*) AS evaluaciones,
               SUM(ie.estatus = 'aprobada') AS aprobadas, SUM(ie.estatus = 'no_aprobada') AS noAprobadas,
               SUM(ie.dictamen = 'competente') AS competentes, SUM(ie.dictamen = 'todavia_no_competente') AS noCompetentes
        FROM intento_evaluacion ie JOIN usuario u ON u.id_usuario = ie.id_evaluador
        JOIN inscripcion i ON i.id_inscripcion = ie.id_inscripcion JOIN grupo g ON g.id_grupo = i.id_grupo
        ${donde(["ie.estatus <> 'pendiente'", ...enPeriodoFecha('ie.fecha_aplicacion', p), p.idCurso && 'g.id_curso = :idCurso'].filter(Boolean))}
        GROUP BY u.id_usuario, u.nombre, u.apellidos, u.correo ORDER BY u.apellidos`, p);
      const lista = filas.map((r) => ({ evaluador: r.evaluador, correo: r.correo, evaluaciones: n(r.evaluaciones), aprobadas: n(r.aprobadas), noAprobadas: n(r.noAprobadas), competentes: n(r.competentes), noCompetentes: n(r.noCompetentes) }));
      return {
        filas: lista,
        resumen: [{ etiqueta: 'Evaluadores', valor: lista.length }, { etiqueta: 'Evaluaciones', valor: lista.reduce((a, r) => a + r.evaluaciones, 0) }, { etiqueta: 'Competentes', valor: lista.reduce((a, r) => a + r.competentes, 0) }],
      };
    },
  },
};

// Lista para la pantalla (sin las consultas)
function catalogo() {
  return Object.entries(REPORTES).map(([clave, r]) => ({ clave, titulo: r.titulo, descripcion: r.descripcion, periodo: r.periodo, filtros: r.filtros }));
}

async function generar(clave, filtros) {
  const reporte = REPORTES[clave];
  if (!reporte) throw new AppError(404, 'No existe ese reporte.');
  if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
    throw new AppError(400, 'La fecha "desde" no puede ser posterior a la fecha "hasta".', [{ campo: 'desde', mensaje: 'Debe ser anterior o igual a "hasta".' }]);
  }
  const { filas, resumen } = await reporte.obtener(filtros);
  let curso = null;
  if (filtros.idCurso && reporte.filtros.includes('curso')) {
    const [c] = await sequelize.query('SELECT nombre FROM curso WHERE id_curso = :idCurso', { replacements: { idCurso: filtros.idCurso }, type: sequelize.QueryTypes.SELECT });
    curso = c ? c.nombre : null;
  }
  return {
    clave,
    titulo: reporte.titulo,
    descripcion: reporte.descripcion,
    columnas: reporte.columnas,
    filas,
    resumen,
    filtrosTexto: [
      `Periodo (${reporte.periodo.toLowerCase()}): ${filtros.desde ? f(filtros.desde) : 'desde el inicio'} al ${filtros.hasta ? f(filtros.hasta) : 'hoy'}`,
      curso && `Curso: ${curso}`,
      filtros.estatus && reporte.filtros.includes('estatus') && `Estatus: ${ESTATUS_TRAMITE[filtros.estatus]}`,
    ].filter(Boolean),
  };
}

module.exports = { catalogo, generar, REPORTES };
