const fs = require('fs/promises');
const { Op, UniqueConstraintError } = require('sequelize');
const AppError = require('../../utils/AppError');
const { registrarAuditoria } = require('../../utils/auditoria');
const archivos = require('../../utils/archivos');
const ROLES = require('../../config/roles');
const { plantilla, enviarCorreo } = require('../notificaciones/correo.service');
const { historialDeParticipante } = require('../evaluaciones/intentos.service');
const {
  TramiteCertificacion, HistorialTramite, DocumentoCertificacion, IntentoEvaluacion, Evaluacion,
  Inscripcion, Grupo, Curso, EstandarCompetencia, Participante, Usuario, sequelize,
} = require('../../models');

// ---------------------------------------------------------------------
// Certificaciones: CU-17 Gestionar trámite, CU-18 Resguardar documento de CONOCER,
// CU-19 Mis certificados, CU-20 Verificar por folio (RF-CERT-01 a 07). Figura 15.
// Reglas:
//  - el trámite solo nace de un intento con dictamen COMPETENTE (422) y uno por intento (409);
//  - folio interno consecutivo por año: CINDEC-2026-0001, CINDEC-2026-0002…;
//  - el estatus avanza en orden solicitado → pagado → en_tramite → emitido, sin saltos ni regresos,
//    y cada cambio queda en el historial dentro de la misma transacción;
//  - "emitido" solo se alcanza al resguardar el PDF oficial de CONOCER (folio CONOCER único);
//  - el correo al participante se envía DESPUÉS del commit: si falla, el certificado ya quedó resguardado;
//  - el participante solo descarga sus propios documentos (RF-CERT-06).
// ---------------------------------------------------------------------

const ORDEN = ['solicitado', 'pagado', 'en_tramite', 'emitido'];
const TEXTO = { solicitado: 'Solicitado', pagado: 'Pagado', en_tramite: 'En trámite', emitido: 'Emitido' };
const esPersonal = (u) => [ROLES.ADMIN, ROLES.COORDINADOR].includes(u.rol);
const nombreCompleto = (u) => (u ? `${u.nombre} ${u.apellidos}` : null);
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
const fechaMx = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

// Intento → inscripción → participante y grupo → curso → estándar
const incluirIntento = {
  model: IntentoEvaluacion, as: 'intento',
  include: [
    { model: Evaluacion, as: 'evaluacion', attributes: ['nombre'] },
    {
      model: Inscripcion, as: 'inscripcion', attributes: ['id_inscripcion', 'id_participante'],
      include: [
        { model: Participante, as: 'participante', attributes: ['id_participante', 'id_usuario', 'curp'], include: { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellidos', 'correo'] } },
        { model: Grupo, as: 'grupo', attributes: ['id_grupo', 'clave'], include: { model: Curso, as: 'curso', attributes: ['id_curso', 'nombre'], include: { model: EstandarCompetencia, as: 'estandar', attributes: ['codigo', 'nombre'] } } },
      ],
    },
  ],
};
const incluirDocumento = { model: DocumentoCertificacion, as: 'documento' };

function aDocumento(d) {
  if (!d) return null;
  return {
    folioConocer: d.folio_conocer,
    tipoDocumento: d.tipo_documento,
    fechaEmision: d.fecha_emision,
    vigencia: d.vigencia,
    vigente: !d.vigencia || d.vigencia >= hoy(),
    entidad: d.entidad_certificacion,
  };
}

function aResumen(t) {
  const { inscripcion } = t.intento;
  const { curso } = inscripcion.grupo;
  return {
    id: t.id_tramite,
    folioInterno: t.folio_interno,
    fechaSolicitud: t.fecha_solicitud,
    estatus: t.estatus,
    participante: { id: inscripcion.participante.id_participante, nombre: nombreCompleto(inscripcion.participante.usuario) },
    curso: curso.nombre,
    idCurso: curso.id_curso,
    estandar: { codigo: curso.estandar.codigo, nombre: curso.estandar.nombre },
    grupo: inscripcion.grupo.clave,
    documento: aDocumento(t.documento),
  };
}

// ---------- Listado con filtros (P-13; RF-CERT-05) ----------
async function listar({ estatus, buscar, idCurso, desde, hasta }) {
  const where = {};
  if (estatus) where.estatus = estatus;
  if (desde || hasta) where.fecha_solicitud = { ...(desde && { [Op.gte]: desde }), ...(hasta && { [Op.lte]: hasta }) };
  if (buscar) {
    const like = { [Op.like]: `%${buscar}%` };
    where[Op.or] = [
      { folio_interno: like },
      { '$documento.folio_conocer$': like },
      sequelize.where(sequelize.fn('CONCAT', sequelize.col('intento->inscripcion->participante->usuario.nombre'), ' ',
        sequelize.col('intento->inscripcion->participante->usuario.apellidos')), like),
      { '$intento.inscripcion.participante.curp$': like },
    ];
  }
  if (idCurso) where['$intento.inscripcion.grupo.id_curso$'] = idCurso;
  const tramites = await TramiteCertificacion.findAll({
    where, include: [incluirDocumento, incluirIntento],
    order: [[sequelize.literal("FIELD(TramiteCertificacion.estatus, 'solicitado', 'pagado', 'en_tramite', 'emitido')"), 'ASC'], ['fecha_solicitud', 'DESC']],
  });
  const conteo = await TramiteCertificacion.findAll({ attributes: ['estatus', [sequelize.fn('COUNT', '*'), 'total']], group: ['estatus'], raw: true });
  return {
    tramites: tramites.map(aResumen),
    porEstatus: Object.fromEntries(ORDEN.map((e) => [e, Number(conteo.find((c) => c.estatus === e)?.total || 0)])),
  };
}

// Participantes competentes que todavía no tienen trámite (para "Iniciar trámite")
async function candidatos() {
  const intentos = await IntentoEvaluacion.findAll({
    where: {
      dictamen: 'competente',
      [Op.and]: sequelize.literal('NOT EXISTS (SELECT 1 FROM tramite_certificacion t WHERE t.id_intento = IntentoEvaluacion.id_intento)'),
    },
    include: incluirIntento.include,
    order: [['fecha_aplicacion', 'DESC']],
  });
  return intentos.map((i) => ({
    idIntento: i.id_intento,
    participante: nombreCompleto(i.inscripcion.participante.usuario),
    estandar: i.inscripcion.grupo.curso.estandar.codigo,
    curso: i.inscripcion.grupo.curso.nombre,
    grupo: i.inscripcion.grupo.clave,
    fechaDictamen: i.fecha_aplicacion,
    calificacion: Number(i.calificacion),
  }));
}

// Siguiente folio interno del año (dentro de la transacción)
async function siguienteFolio(transaction) {
  const anio = hoy().slice(0, 4);
  const ultimo = await TramiteCertificacion.findOne({
    where: { folio_interno: { [Op.like]: `CINDEC-${anio}-%` } },
    order: [['folio_interno', 'DESC']],
    transaction, lock: transaction.LOCK.UPDATE,
  });
  const numero = ultimo ? Number(ultimo.folio_interno.split('-')[2]) + 1 : 1;
  return `CINDEC-${anio}-${String(numero).padStart(4, '0')}`;
}

// ---------- CU-17 Crear el trámite ----------
async function crear({ idIntento, observaciones }, idUsuario) {
  for (let intentoGuardar = 1; ; intentoGuardar += 1) {
    try {
      return await sequelize.transaction(async (t) => {
        const intento = await IntentoEvaluacion.findByPk(idIntento, { include: incluirIntento.include, transaction: t });
        if (!intento) throw new AppError(404, 'No se encontró el intento de evaluación.');
        const nombre = nombreCompleto(intento.inscripcion.participante.usuario);
        if (intento.dictamen !== 'competente') {
          throw new AppError(422, `El intento ${intento.numero_intento} de ${nombre} no tiene juicio de competencia "competente"; no se puede iniciar el trámite de certificación.`);
        }
        const existente = await TramiteCertificacion.findOne({ where: { id_intento: idIntento }, transaction: t });
        if (existente) throw new AppError(409, `Este resultado ya tiene el trámite ${existente.folio_interno}.`);

        const folio = await siguienteFolio(t);
        const tramite = await TramiteCertificacion.create({ id_intento: idIntento, folio_interno: folio, fecha_solicitud: hoy(), estatus: 'solicitado' }, { transaction: t });
        await HistorialTramite.create({ id_tramite: tramite.id_tramite, estatus: 'solicitado', observaciones: observaciones || null }, { transaction: t });
        await registrarAuditoria({
          idUsuario, accion: 'crear', entidad: 'tramite_certificacion', idRegistro: tramite.id_tramite,
          detalle: `Trámite ${folio} de ${nombre}, estándar ${intento.inscripcion.grupo.curso.estandar.codigo}`,
        }, t);
        return { id: tramite.id_tramite, folio };
      });
    } catch (err) {
      // Dos personas creando trámites al mismo tiempo pueden calcular el mismo folio: se reintenta
      // (si el choque fue por el mismo intento, el reintento lo detecta y responde 409)
      if (err instanceof UniqueConstraintError && intentoGuardar < 3) continue;
      if (err instanceof UniqueConstraintError) throw new AppError(409, 'No se pudo asignar el folio interno; intente de nuevo.');
      throw err;
    }
  }
}

async function buscar(id, transaction, lock) {
  const tramite = await TramiteCertificacion.findByPk(id, {
    include: [incluirDocumento, incluirIntento], transaction,
    ...(lock && { lock: transaction.LOCK.UPDATE }),
  });
  if (!tramite) throw new AppError(404, 'No se encontró el trámite.');
  return tramite;
}

// ---------- P-14 Detalle del trámite ----------
async function obtener(id) {
  const t = await buscar(id);
  const historial = await HistorialTramite.findAll({ where: { id_tramite: id }, order: [['fecha_cambio', 'DESC'], ['id_historial', 'DESC']] });
  return {
    ...aResumen(t),
    dictamen: { fecha: t.intento.fecha_aplicacion, calificacion: Number(t.intento.calificacion), numeroIntento: t.intento.numero_intento, idIntento: t.id_intento, instrumento: t.intento.evaluacion.nombre },
    curp: t.intento.inscripcion.participante.curp,
    siguiente: t.estatus === 'en_tramite' || t.estatus === 'emitido' ? null : ORDEN[ORDEN.indexOf(t.estatus) + 1],
    historial: historial.map((h) => ({ id: h.id_historial, estatus: h.estatus, fecha: h.fecha_cambio, observaciones: h.observaciones })),
    hoy: hoy(),
  };
}

// ---------- CU-17 Seguimiento: solicitado → pagado → en_tramite ----------
async function avanzar(id, { estatus, observaciones }, idUsuario) {
  return sequelize.transaction(async (t) => {
    const tramite = await buscar(id, t, true);
    const siguiente = ORDEN[ORDEN.indexOf(tramite.estatus) + 1];
    if (tramite.estatus === 'emitido') throw new AppError(409, 'El trámite ya está emitido.');
    if (estatus !== siguiente) {
      throw new AppError(409, `El trámite está "${TEXTO[tramite.estatus]}"; el siguiente paso es "${TEXTO[siguiente]}". No se puede saltar ni regresar.`);
    }
    if (estatus === 'emitido') throw new AppError(409, 'Para marcarlo como emitido, resguarde el PDF oficial de CONOCER.');
    await tramite.update({ estatus }, { transaction: t });
    await HistorialTramite.create({ id_tramite: tramite.id_tramite, estatus, observaciones: observaciones || null }, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: 'cambiar_estatus', entidad: 'tramite_certificacion', idRegistro: tramite.id_tramite,
      detalle: `Trámite ${tramite.folio_interno}: ${TEXTO[ORDEN[ORDEN.indexOf(estatus) - 1]]} → ${TEXTO[estatus]}`,
    }, t);
    return { folio: tramite.folio_interno, estatus: TEXTO[estatus] };
  });
}

// ---------- CU-18 Resguardar el documento oficial y marcar como emitido ----------
async function resguardarDocumento(id, d, archivo, idUsuario) {
  let ruta = null;
  let aviso = null;
  try {
    const resultado = await sequelize.transaction(async (t) => {
      const tramite = await buscar(id, t, true);
      if (tramite.estatus === 'emitido') throw new AppError(409, 'Este trámite ya tiene su documento resguardado.');
      if (tramite.estatus !== 'en_tramite') throw new AppError(409, 'El documento se resguarda cuando el trámite está "En trámite" ante CONOCER.');
      if (!archivo) throw new AppError(400, 'Seleccione el PDF del certificado.', [{ campo: 'archivo', mensaje: 'Seleccione el PDF del certificado.' }]);
      const errores = [];
      if (d.fechaEmision > hoy()) errores.push({ campo: 'fechaEmision', mensaje: 'La fecha de emisión no puede ser futura.' });
      if (d.fechaEmision < tramite.fecha_solicitud) errores.push({ campo: 'fechaEmision', mensaje: `No puede ser anterior a la solicitud (${fechaMx(tramite.fecha_solicitud)}).` });
      if (d.vigencia && d.vigencia < d.fechaEmision) errores.push({ campo: 'vigencia', mensaje: 'La vigencia no puede ser anterior a la fecha de emisión.' });
      if (errores.length) throw new AppError(400, 'Revise los datos del documento.', errores);
      if (await DocumentoCertificacion.findOne({ where: { folio_conocer: d.folioConocer }, transaction: t })) {
        throw new AppError(409, 'Ese folio CONOCER ya está registrado en otro certificado.', [{ campo: 'folioConocer', mensaje: 'Ese folio ya está registrado.' }]);
      }

      ruta = await archivos.guardar(`certificados/tramite-${tramite.id_tramite}`, `certificado-${Date.now()}`, archivo);
      await DocumentoCertificacion.create({
        id_tramite: tramite.id_tramite,
        folio_conocer: d.folioConocer,
        tipo_documento: d.tipoDocumento || 'Certificado de competencia laboral',
        fecha_emision: d.fechaEmision,
        vigencia: d.vigencia || null,
        ruta_archivo: ruta,
      }, { transaction: t });
      await tramite.update({ estatus: 'emitido' }, { transaction: t });
      await HistorialTramite.create({ id_tramite: tramite.id_tramite, estatus: 'emitido', observaciones: `Certificado resguardado · folio CONOCER ${d.folioConocer}` }, { transaction: t });
      await registrarAuditoria({
        idUsuario, accion: 'resguardar_documento', entidad: 'documento_certificacion', idRegistro: tramite.id_tramite,
        detalle: `Trámite ${tramite.folio_interno}: certificado folio CONOCER ${d.folioConocer}, emitido el ${d.fechaEmision}`,
      }, t);
      const { participante, grupo } = tramite.intento.inscripcion;
      aviso = { usuario: participante.usuario, estandar: grupo.curso.estandar, folio: d.folioConocer };
      return { folio: tramite.folio_interno };
    });
    // Después del commit (figura 15) y SIN esperar la respuesta del servidor de correo:
    // si el correo tarda o falla, el certificado ya quedó resguardado y la pantalla responde de inmediato.
    notificarEmision(aviso);
    return resultado;
  } catch (err) {
    if (ruta) await archivos.eliminar(ruta);
    if (err instanceof UniqueConstraintError) throw new AppError(409, 'Ese folio CONOCER ya está registrado en otro certificado.', [{ campo: 'folioConocer', mensaje: 'Ese folio ya está registrado.' }]);
    throw err;
  }
}

async function notificarEmision({ usuario, estandar, folio }) {
  try {
    await enviarCorreo({
      para: usuario.correo,
      asunto: 'Su certificado de competencia laboral ya está disponible',
      html: plantilla({
        titulo: 'Su certificado ya fue emitido',
        parrafos: [
          `Hola, ${usuario.nombre}.`,
          `CONOCER emitió su certificado del estándar <strong>${estandar.codigo} ${estandar.nombre}</strong> con folio <strong>${folio}</strong>.`,
          'Ya puede descargarlo desde la sección "Mis certificados" del sistema de CINDEC.',
        ],
        boton: { texto: 'Ver mis certificados', url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mis-certificados` },
      }),
      texto: `Hola, ${usuario.nombre}. Su certificado del estándar ${estandar.codigo} (folio ${folio}) ya está disponible en "Mis certificados".`,
    });
    return true;
  } catch (err) {
    console.error('No se pudo enviar el aviso de certificado emitido:', err.message);
    return false;
  }
}

// ---------- Descarga del PDF (personal o el propio participante) ----------
async function archivoDocumento(idTramite, solicitante) {
  const tramite = await buscar(idTramite);
  const esDueno = solicitante.rol === ROLES.PARTICIPANTE && tramite.intento.inscripcion.participante.id_usuario === solicitante.id;
  if (!esPersonal(solicitante) && !esDueno) throw new AppError(403, 'Solo puede descargar sus propios certificados.');
  if (!tramite.documento) throw new AppError(404, 'Este trámite todavía no tiene certificado emitido.');
  const ruta = archivos.rutaAbsoluta(tramite.documento.ruta_archivo);
  try { await fs.access(ruta); } catch { throw new AppError(404, 'El archivo del certificado no se encuentra en el servidor.'); }
  const nombre = `Certificado ${tramite.intento.inscripcion.grupo.curso.estandar.codigo} ${tramite.documento.folio_conocer}.pdf`.replace(/[\\/:*?"<>|]/g, '');
  return { ruta, nombre };
}

// ---------- Trámites de un participante (expediente, Mis certificados, Mi historial) ----------
async function deParticipante(idParticipante) {
  const tramites = await TramiteCertificacion.findAll({
    include: [incluirDocumento, {
      ...incluirIntento, required: true,
      include: [incluirIntento.include[0], { ...incluirIntento.include[1], required: true, where: { id_participante: idParticipante } }],
    }],
    order: [['fecha_solicitud', 'DESC']],
  });
  return tramites.map(aResumen);
}

async function participanteDeUsuario(idUsuario) {
  const participante = await Participante.findOne({ where: { id_usuario: idUsuario } });
  if (!participante) throw new AppError(404, 'No se encontró su registro de participante.');
  return participante;
}

// CU-19 Mis certificados
async function misCertificados(idUsuario) {
  const p = await participanteDeUsuario(idUsuario);
  return deParticipante(p.id_participante);
}

// P-23 Mi historial: evaluaciones y certificaciones (los cursos vienen de /mis-cursos)
async function miHistorial(idUsuario) {
  const p = await participanteDeUsuario(idUsuario);
  const [evaluaciones, certificaciones] = await Promise.all([historialDeParticipante(p.id_participante), deParticipante(p.id_participante)]);
  return { evaluaciones, certificaciones };
}

// ---------- CU-20 Verificar por folio (interna, con sesión; RF-CERT-07) ----------
async function verificar(folio) {
  const documento = await DocumentoCertificacion.findOne({ where: { folio_conocer: folio } });
  if (documento) {
    const t = await buscar(documento.id_tramite);
    const r = aResumen(t);
    return { encontrado: true, tipo: 'certificado', nombre: r.participante.nombre, estandar: r.estandar, ...r.documento };
  }
  // También se acepta el folio interno del trámite (aún sin certificado)
  const tramite = await TramiteCertificacion.findOne({ where: { folio_interno: folio } });
  if (tramite) {
    const r = aResumen(await buscar(tramite.id_tramite));
    return { encontrado: true, tipo: 'tramite', nombre: r.participante.nombre, estandar: r.estandar, folioInterno: r.folioInterno, estatus: r.estatus, fechaSolicitud: r.fechaSolicitud, documento: r.documento };
  }
  return { encontrado: false };
}

module.exports = {
  listar, candidatos, crear, obtener, avanzar, resguardarDocumento, archivoDocumento,
  deParticipante, misCertificados, miHistorial, verificar,
};
