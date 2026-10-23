const fs = require('fs/promises');
const path = require('path');
const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const { registrarAuditoria } = require('../../utils/auditoria');
const archivos = require('../../utils/archivos');
const ROLES = require('../../config/roles');
const { TIPO_TEXTO } = require('./instrumentos.service');
const {
  IntentoEvaluacion, Evidencia, Evaluacion, Inscripcion, Grupo, Curso, EstandarCompetencia,
  Participante, Usuario, sequelize,
} = require('../../models');

// ---------------------------------------------------------------------
// Evaluaciones: CU-15 Registrar resultado y dictamen, CU-16 Registrar evidencias (Evaluador)
// RF-EVA-02, 03, 04 y 05.
// Reglas:
//  - solo evalúa el EVALUADOR ASIGNADO al grupo; coordinación y administración solo consultan (RNF-06);
//  - se evalúa a quien ya tiene "capacitación concluida" (RF-EVA-03: son estados distintos y en orden);
//  - el instrumento debe ser del mismo estándar que el curso del grupo y estar activo;
//  - cada intento es una fila nueva con su número (1, 2, 3…); nunca se sobrescribe uno anterior;
//  - solo hay un intento pendiente a la vez, y no hay intentos nuevos después de "competente";
//  - aprobada / no aprobada lo calcula el sistema con la calificación mínima del instrumento;
//  - con calificación reprobatoria el dictamen solo puede ser "todavía no competente";
//  - para guardar el resultado se necesita al menos una evidencia;
//  - un intento calificado ya no se modifica, ni sus evidencias (RNF-06, RNF-10).
// ---------------------------------------------------------------------

const esPersonal = (u) => [ROLES.ADMIN, ROLES.COORDINADOR].includes(u.rol);
const nombreCompleto = (u) => (u ? `${u.nombre} ${u.apellidos}` : null);

// Fecha de hoy en la Ciudad de México (YYYY-MM-DD), sin depender de la zona del servidor
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());

// Nombre legible del archivo: se guarda como "<id>-<nombre-original>.<ext>"
const nombreVisible = (ruta) => path.basename(ruta).replace(/^\d+-/, '');
const limpiarNombre = (original) => path.parse(original).name
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  .slice(0, 80) || 'evidencia';

async function tamanoArchivo(ruta) {
  try { return (await fs.stat(archivos.rutaAbsoluta(ruta))).size; } catch { return null; }
}

const incluirGrupo = {
  model: Grupo, as: 'grupo',
  include: [{ model: Curso, as: 'curso', attributes: ['id_curso', 'nombre', 'id_estandar'], include: { model: EstandarCompetencia, as: 'estandar', attributes: ['id_estandar', 'codigo', 'nombre'] } }],
};
const incluirParticipante = { model: Participante, as: 'participante', include: { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellidos'] } };

// ¿Puede esta persona registrar (escribir) en una evaluación del grupo?
function verificarEvaluador(grupo, solicitante) {
  if (solicitante.rol !== ROLES.EVALUADOR || grupo.id_evaluador !== solicitante.id) {
    throw new AppError(403, 'Solo el evaluador asignado al grupo puede registrar evaluaciones.');
  }
}
// ¿Puede consultarla? El evaluador del grupo, la coordinación y la administración.
function verificarConsulta(grupo, solicitante) {
  if (esPersonal(solicitante)) return;
  verificarEvaluador(grupo, solicitante);
}

function resumenIntento(i) {
  return {
    id: i.id_intento,
    numero: i.numero_intento,
    fechaAplicacion: i.fecha_aplicacion,
    calificacion: i.calificacion === null ? null : Number(i.calificacion),
    estatus: i.estatus,
    dictamen: i.dictamen,
  };
}

// ---------- P-19 Por evaluar ----------
async function porEvaluar(idEvaluador) {
  const grupos = await Grupo.findAll({
    where: { id_evaluador: idEvaluador, estatus: { [Op.ne]: 'cancelado' } },
    include: incluirGrupo.include,
    order: [[sequelize.literal("FIELD(Grupo.estatus, 'en_curso', 'concluido', 'planeado')"), 'ASC'], ['fecha_fin', 'ASC']],
  });
  if (!grupos.length) return [];

  const idsEstandar = [...new Set(grupos.map((g) => g.curso.id_estandar))];
  const [instrumentos, inscripciones] = await Promise.all([
    Evaluacion.findAll({ where: { id_estandar: idsEstandar, activa: true }, order: [['nombre', 'ASC']] }),
    Inscripcion.findAll({
      where: { id_grupo: grupos.map((g) => g.id_grupo), estatus: { [Op.ne]: 'baja' } },
      include: [incluirParticipante, { model: IntentoEvaluacion, as: 'intentos' }],
      order: [[{ model: Participante, as: 'participante' }, { model: Usuario, as: 'usuario' }, 'apellidos', 'ASC']],
    }),
  ]);

  return grupos.map((g) => {
    const propias = inscripciones.filter((i) => i.id_grupo === g.id_grupo);
    return {
      id: g.id_grupo,
      clave: g.clave,
      curso: g.curso.nombre,
      estandar: g.curso.estandar.codigo,
      fechaInicio: g.fecha_inicio,
      fechaFin: g.fecha_fin,
      estatus: g.estatus,
      instrumentos: instrumentos.filter((e) => e.id_estandar === g.curso.id_estandar)
        .map((e) => ({ id: e.id_evaluacion, nombre: e.nombre, tipoTexto: TIPO_TEXTO[e.tipo_instrumento], calificacionMinima: Number(e.calificacion_minima) })),
      participantes: propias.map((i) => {
        const intentos = [...i.intentos].sort((a, b) => a.numero_intento - b.numero_intento);
        const ultimo = intentos[intentos.length - 1];
        const competente = intentos.some((x) => x.dictamen === 'competente');
        const pendiente = intentos.find((x) => x.estatus === 'pendiente');
        return {
          idInscripcion: i.id_inscripcion,
          nombre: nombreCompleto(i.participante.usuario),
          estatusInscripcion: i.estatus,
          intentos: intentos.length,
          ultimo: ultimo ? resumenIntento(ultimo) : null,
          idPendiente: pendiente ? pendiente.id_intento : null,
          competente,
          puedeIniciar: i.estatus === 'capacitacion_concluida' && !competente && !pendiente,
        };
      }),
    };
  });
}

// ---------- Iniciar un intento (queda "pendiente" hasta guardar el resultado) ----------
async function crear({ idInscripcion, idEvaluacion }, solicitante) {
  return sequelize.transaction(async (t) => {
    // Bloquea la inscripción: dos clics simultáneos no crean dos intentos con el mismo número
    const inscripcion = await Inscripcion.findByPk(idInscripcion, { include: [incluirGrupo, incluirParticipante], transaction: t, lock: t.LOCK.UPDATE });
    if (!inscripcion) throw new AppError(404, 'No se encontró la inscripción.');
    const { grupo } = inscripcion;
    verificarEvaluador(grupo, solicitante);
    const nombre = nombreCompleto(inscripcion.participante.usuario);

    if (inscripcion.estatus !== 'capacitacion_concluida') {
      throw new AppError(409, `${nombre} todavía no tiene la capacitación concluida. La coordinación la marca en el detalle del grupo; después se puede evaluar.`);
    }
    const anteriores = await IntentoEvaluacion.findAll({ where: { id_inscripcion: idInscripcion }, transaction: t });
    if (anteriores.some((x) => x.dictamen === 'competente')) throw new AppError(409, `${nombre} ya fue dictaminado(a) competente en este grupo.`);
    const pendiente = anteriores.find((x) => x.estatus === 'pendiente');
    if (pendiente) throw new AppError(409, `${nombre} ya tiene el intento ${pendiente.numero_intento} pendiente de calificar.`);

    // Instrumento: del mismo estándar y activo. Si solo hay uno, se usa ese.
    const disponibles = await Evaluacion.findAll({ where: { id_estandar: grupo.curso.id_estandar, activa: true }, transaction: t });
    if (!disponibles.length) {
      throw new AppError(409, `La coordinación todavía no registra un instrumento de evaluación activo para el estándar ${grupo.curso.estandar.codigo}.`);
    }
    let instrumento;
    if (idEvaluacion) {
      instrumento = disponibles.find((e) => e.id_evaluacion === idEvaluacion);
      if (!instrumento) throw new AppError(400, `El instrumento elegido no está activo o no es del estándar ${grupo.curso.estandar.codigo}.`);
    } else if (disponibles.length === 1) {
      [instrumento] = disponibles;
    } else {
      throw new AppError(400, 'Seleccione el instrumento de evaluación.', [{ campo: 'idEvaluacion', mensaje: 'Seleccione el instrumento.' }]);
    }

    const numero = anteriores.reduce((max, x) => Math.max(max, x.numero_intento), 0) + 1;
    const intento = await IntentoEvaluacion.create({
      id_inscripcion: idInscripcion,
      id_evaluacion: instrumento.id_evaluacion,
      numero_intento: numero,
      fecha_aplicacion: hoy(),
    }, { transaction: t });
    await registrarAuditoria({
      idUsuario: solicitante.id, accion: 'crear', entidad: 'intento_evaluacion', idRegistro: intento.id_intento,
      detalle: `Intento ${numero} de ${nombre}, grupo ${grupo.clave}, instrumento "${instrumento.nombre}"`,
    }, t);
    return { id: intento.id_intento, numero };
  });
}

async function buscarIntento(id, transaction, lock) {
  const intento = await IntentoEvaluacion.findByPk(id, {
    include: [
      { model: Inscripcion, as: 'inscripcion', include: [incluirGrupo, incluirParticipante] },
      { model: Evaluacion, as: 'evaluacion' },
      { model: Usuario, as: 'evaluador', attributes: ['nombre', 'apellidos'] },
    ],
    transaction,
    lock: lock ? transaction.LOCK.UPDATE : undefined,
  });
  if (!intento) throw new AppError(404, 'No se encontró el intento de evaluación.');
  return intento;
}

// ---------- P-20 Resultado y dictamen (detalle) ----------
async function obtener(id, solicitante) {
  const intento = await buscarIntento(id);
  const { grupo } = intento.inscripcion;
  verificarConsulta(grupo, solicitante);
  const [evidencias, otros] = await Promise.all([
    Evidencia.findAll({ where: { id_intento: id }, order: [['fecha_carga', 'ASC']] }),
    IntentoEvaluacion.findAll({ where: { id_inscripcion: intento.id_inscripcion, id_intento: { [Op.ne]: id } }, order: [['numero_intento', 'ASC']] }),
  ]);
  const ev = intento.evaluacion;
  return {
    id: intento.id_intento,
    numero: intento.numero_intento,
    ...resumenIntento(intento),
    observaciones: intento.observaciones,
    evaluador: nombreCompleto(intento.evaluador),
    participante: { id: intento.inscripcion.participante.id_participante, nombre: nombreCompleto(intento.inscripcion.participante.usuario) },
    estatusInscripcion: intento.inscripcion.estatus,
    grupo: { id: grupo.id_grupo, clave: grupo.clave, fechaInicio: grupo.fecha_inicio, fechaFin: grupo.fecha_fin },
    curso: grupo.curso.nombre,
    estandar: { codigo: grupo.curso.estandar.codigo, nombre: grupo.curso.estandar.nombre },
    instrumento: { id: ev.id_evaluacion, nombre: ev.nombre, tipoTexto: TIPO_TEXTO[ev.tipo_instrumento], calificacionMinima: Number(ev.calificacion_minima) },
    evidencias: await Promise.all(evidencias.map(async (e) => ({
      id: e.id_evidencia,
      descripcion: e.descripcion,
      nombreArchivo: e.ruta_archivo ? nombreVisible(e.ruta_archivo) : null,
      tamano: e.ruta_archivo ? await tamanoArchivo(e.ruta_archivo) : null,
      fechaCarga: e.fecha_carga,
    }))),
    otrosIntentos: otros.map(resumenIntento),
    puedeEditar: intento.estatus === 'pendiente' && solicitante.rol === ROLES.EVALUADOR && grupo.id_evaluador === solicitante.id,
    hoy: hoy(),
  };
}

// Intento pendiente con permiso de escritura (bloqueado durante la transacción)
async function pendienteEditable(id, solicitante, t) {
  const intento = await buscarIntento(id, t, true);
  verificarEvaluador(intento.inscripcion.grupo, solicitante);
  if (intento.estatus !== 'pendiente') throw new AppError(409, 'Este intento ya fue calificado y no se puede modificar.');
  return intento;
}

async function guardarResultado(id, d, solicitante) {
  return sequelize.transaction(async (t) => {
    const intento = await pendienteEditable(id, solicitante, t);
    const { grupo } = intento.inscripcion;
    const minima = Number(intento.evaluacion.calificacion_minima);
    const errores = [];
    if (d.fechaAplicacion > hoy()) errores.push({ campo: 'fechaAplicacion', mensaje: 'La fecha de aplicación no puede ser futura.' });
    if (d.fechaAplicacion < grupo.fecha_inicio) errores.push({ campo: 'fechaAplicacion', mensaje: `No puede ser anterior al inicio del grupo (${grupo.fecha_inicio.split('-').reverse().join('/')}).` });
    const aprobada = d.calificacion >= minima;
    if (!aprobada && d.dictamen === 'competente') {
      errores.push({ campo: 'dictamen', mensaje: `Con una calificación menor que ${minima} el dictamen solo puede ser "Todavía no competente".` });
    }
    if (errores.length) throw new AppError(400, 'Revise los datos del resultado.', errores);
    const evidencias = await Evidencia.count({ where: { id_intento: id }, transaction: t });
    if (!evidencias) throw new AppError(409, 'Suba al menos una evidencia antes de guardar el resultado.');

    const estatus = aprobada ? 'aprobada' : 'no_aprobada';
    await intento.update({
      fecha_aplicacion: d.fechaAplicacion,
      calificacion: d.calificacion,
      estatus,
      dictamen: d.dictamen,
      observaciones: d.observaciones || null,
      id_evaluador: solicitante.id,
    }, { transaction: t });
    const nombre = nombreCompleto(intento.inscripcion.participante.usuario);
    await registrarAuditoria({
      idUsuario: solicitante.id, accion: 'registrar_resultado', entidad: 'intento_evaluacion', idRegistro: intento.id_intento,
      detalle: `${nombre}, grupo ${grupo.clave}, intento ${intento.numero_intento}: ${d.calificacion} (${estatus}), dictamen ${d.dictamen}`,
    }, t);
    return { nombre, estatus, dictamen: d.dictamen };
  });
}

// Cancelar un intento que todavía no se califica (p. ej. se inició por error)
async function eliminar(id, solicitante) {
  const rutas = [];
  await sequelize.transaction(async (t) => {
    const intento = await pendienteEditable(id, solicitante, t);
    const evidencias = await Evidencia.findAll({ where: { id_intento: id }, transaction: t });
    evidencias.forEach((e) => e.ruta_archivo && rutas.push(e.ruta_archivo));
    await Evidencia.destroy({ where: { id_intento: id }, transaction: t });
    await registrarAuditoria({
      idUsuario: solicitante.id, accion: 'eliminar', entidad: 'intento_evaluacion', idRegistro: intento.id_intento,
      detalle: `Intento ${intento.numero_intento} pendiente de ${nombreCompleto(intento.inscripcion.participante.usuario)}, grupo ${intento.inscripcion.grupo.clave}, cancelado (${evidencias.length} evidencia(s))`,
    }, t);
    await intento.destroy({ transaction: t });
  });
  await Promise.all(rutas.map(archivos.eliminar));
}

// ---------- CU-16 Evidencias ----------
async function agregarEvidencia(id, { descripcion }, archivo, solicitante) {
  const escritas = [];
  try {
    return await sequelize.transaction(async (t) => {
      await pendienteEditable(id, solicitante, t);
      if (!archivo && !descripcion) {
        throw new AppError(400, 'Suba un archivo o escriba la descripción de la evidencia.', [{ campo: 'archivo', mensaje: 'Suba un archivo o escriba una descripción.' }]);
      }
      const total = await Evidencia.count({ where: { id_intento: id }, transaction: t });
      if (total >= 20) throw new AppError(409, 'Un intento puede tener como máximo 20 evidencias.');
      const evidencia = await Evidencia.create({
        id_intento: id,
        descripcion: descripcion || null,
        ruta_archivo: archivo ? 'pendiente' : null, // se sustituye en cuanto se guarda el archivo (CHECK: descripción o archivo)
      }, { transaction: t });
      if (archivo) {
        const ruta = await archivos.guardar(`evidencias/intento-${id}`, `${evidencia.id_evidencia}-${limpiarNombre(archivo.originalname)}`, archivo);
        escritas.push(ruta);
        await evidencia.update({ ruta_archivo: ruta }, { transaction: t });
      }
      await registrarAuditoria({
        idUsuario: solicitante.id, accion: 'crear', entidad: 'evidencia', idRegistro: evidencia.id_evidencia,
        detalle: `Evidencia del intento ${id}: ${archivo ? archivo.originalname : 'sin archivo'}${descripcion ? ` · ${descripcion.slice(0, 120)}` : ''}`,
      }, t);
      return { id: evidencia.id_evidencia };
    });
  } catch (err) {
    await Promise.all(escritas.map(archivos.eliminar));
    throw err;
  }
}

async function buscarEvidencia(idEvidencia, transaction) {
  const evidencia = await Evidencia.findByPk(idEvidencia, { transaction });
  if (!evidencia) throw new AppError(404, 'No se encontró la evidencia.');
  return evidencia;
}

async function quitarEvidencia(idEvidencia, solicitante) {
  let ruta = null;
  await sequelize.transaction(async (t) => {
    const evidencia = await buscarEvidencia(idEvidencia, t);
    await pendienteEditable(evidencia.id_intento, solicitante, t);
    ruta = evidencia.ruta_archivo;
    await registrarAuditoria({
      idUsuario: solicitante.id, accion: 'eliminar', entidad: 'evidencia', idRegistro: evidencia.id_evidencia,
      detalle: `Evidencia del intento ${evidencia.id_intento} quitada${ruta ? `: ${nombreVisible(ruta)}` : ''}`,
    }, t);
    await evidencia.destroy({ transaction: t });
  });
  if (ruta) await archivos.eliminar(ruta);
}

async function archivoEvidencia(idEvidencia, solicitante) {
  const evidencia = await buscarEvidencia(idEvidencia);
  const intento = await buscarIntento(evidencia.id_intento);
  verificarConsulta(intento.inscripcion.grupo, solicitante);
  if (!evidencia.ruta_archivo) throw new AppError(400, 'Esta evidencia es solo una descripción; no tiene archivo.');
  const ruta = archivos.rutaAbsoluta(evidencia.ruta_archivo);
  try { await fs.access(ruta); } catch { throw new AppError(404, 'El archivo de esta evidencia no se encuentra en el servidor.'); }
  return { ruta, nombre: nombreVisible(evidencia.ruta_archivo) };
}

// ---------- Historial de evaluaciones de un participante (expediente, RF-EVA-05) ----------
async function historialDeParticipante(idParticipante) {
  const intentos = await IntentoEvaluacion.findAll({
    include: [
      { model: Inscripcion, as: 'inscripcion', where: { id_participante: idParticipante }, attributes: ['id_inscripcion'], include: incluirGrupo },
      { model: Evaluacion, as: 'evaluacion', attributes: ['nombre', 'tipo_instrumento', 'calificacion_minima'] },
      { model: Usuario, as: 'evaluador', attributes: ['nombre', 'apellidos'] },
    ],
    order: [['fecha_aplicacion', 'DESC'], ['numero_intento', 'DESC']],
  });
  return intentos.map((i) => ({
    ...resumenIntento(i),
    grupo: i.inscripcion.grupo.clave,
    curso: i.inscripcion.grupo.curso.nombre,
    estandar: i.inscripcion.grupo.curso.estandar.codigo,
    instrumento: i.evaluacion.nombre,
    calificacionMinima: Number(i.evaluacion.calificacion_minima),
    evaluador: nombreCompleto(i.evaluador),
  }));
}

module.exports = {
  porEvaluar, crear, obtener, guardarResultado, eliminar,
  agregarEvidencia, quitarEvidencia, archivoEvidencia, historialDeParticipante,
};
