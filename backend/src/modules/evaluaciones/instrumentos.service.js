const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const { registrarAuditoria } = require('../../utils/auditoria');
const { Evaluacion, EstandarCompetencia, IntentoEvaluacion, sequelize } = require('../../models');

// ---------------------------------------------------------------------
// Evaluaciones: CU-14 Gestionar instrumentos de evaluación (Coordinador)
// RF-EVA-01 y RF-EVA-04.
// Reglas:
//  - el instrumento pertenece a un ESTÁNDAR (lo usan todos los cursos y grupos de ese estándar);
//  - la calificación mínima se registra por instrumento, no como constante del sistema (RF-EVA-04);
//  - si ya hay intentos calificados con el instrumento, no se cambian su estándar, tipo ni
//    calificación mínima, para no alterar resultados ya dictaminados (RNF-06, RNF-10);
//  - no se borran: se desactivan; uno desactivado ya no se usa en intentos nuevos;
//  - no se desactiva mientras tenga intentos pendientes de calificar.
// ---------------------------------------------------------------------

const TIPO_TEXTO = { guia_observacion: 'Guía de observación', lista_cotejo: 'Lista de cotejo', cuestionario: 'Cuestionario' };

const contar = (condicion, alias) => [
  sequelize.literal(`(SELECT COUNT(*) FROM intento_evaluacion i WHERE i.id_evaluacion = Evaluacion.id_evaluacion AND ${condicion})`),
  alias,
];

function aRespuesta(e) {
  return {
    id: e.id_evaluacion,
    idEstandar: e.id_estandar,
    estandar: e.estandar ? { codigo: e.estandar.codigo, nombre: e.estandar.nombre } : undefined,
    nombre: e.nombre,
    descripcion: e.descripcion,
    tipo: e.tipo_instrumento,
    tipoTexto: TIPO_TEXTO[e.tipo_instrumento],
    calificacionMinima: Number(e.calificacion_minima),
    activa: e.activa,
    calificados: e.get('calificados') !== undefined ? Number(e.get('calificados')) : undefined,
    pendientes: e.get('pendientes') !== undefined ? Number(e.get('pendientes')) : undefined,
  };
}

async function listar({ idEstandar }) {
  const where = {};
  if (idEstandar) where.id_estandar = idEstandar;
  const lista = await Evaluacion.findAll({
    where,
    include: { model: EstandarCompetencia, as: 'estandar', attributes: ['codigo', 'nombre'] },
    attributes: { include: [contar("i.estatus <> 'pendiente'", 'calificados'), contar("i.estatus = 'pendiente'", 'pendientes')] },
    order: [['activa', 'DESC'], [{ model: EstandarCompetencia, as: 'estandar' }, 'codigo', 'ASC'], ['nombre', 'ASC']],
  });
  return lista.map(aRespuesta);
}

async function buscar(id, transaction) {
  const evaluacion = await Evaluacion.findByPk(id, { include: { model: EstandarCompetencia, as: 'estandar' }, transaction });
  if (!evaluacion) throw new AppError(404, 'No se encontró el instrumento de evaluación.');
  return evaluacion;
}

async function estandarActivo(idEstandar, transaction) {
  const estandar = await EstandarCompetencia.findByPk(idEstandar, { transaction });
  if (!estandar) throw new AppError(404, 'No se encontró el estándar de competencia.', [{ campo: 'idEstandar', mensaje: 'Seleccione un estándar.' }]);
  if (!estandar.activo) throw new AppError(409, `El estándar ${estandar.codigo} está desactivado.`, [{ campo: 'idEstandar', mensaje: 'El estándar está desactivado.' }]);
  return estandar;
}

async function verificarNombreLibre(idEstandar, nombre, idExcluir, transaction) {
  const where = { id_estandar: idEstandar, nombre };
  if (idExcluir) where.id_evaluacion = { [Op.ne]: idExcluir };
  if (await Evaluacion.findOne({ where, transaction })) {
    throw new AppError(409, 'Ese estándar ya tiene un instrumento con ese nombre.', [{ campo: 'nombre', mensaje: 'Ya existe un instrumento con ese nombre en el estándar.' }]);
  }
}

async function crear(d, idUsuario) {
  return sequelize.transaction(async (t) => {
    const estandar = await estandarActivo(d.idEstandar, t);
    await verificarNombreLibre(d.idEstandar, d.nombre, null, t);
    const evaluacion = await Evaluacion.create({
      id_estandar: d.idEstandar,
      nombre: d.nombre,
      descripcion: d.descripcion || null,
      tipo_instrumento: d.tipo,
      calificacion_minima: d.calificacionMinima,
    }, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: 'crear', entidad: 'evaluacion', idRegistro: evaluacion.id_evaluacion,
      detalle: `Instrumento "${d.nombre}" (${TIPO_TEXTO[d.tipo]}, mínima ${d.calificacionMinima}) del estándar ${estandar.codigo}`,
    }, t);
    return aRespuesta(await buscar(evaluacion.id_evaluacion, t));
  });
}

async function actualizar(id, d, idUsuario) {
  return sequelize.transaction(async (t) => {
    const e = await buscar(id, t);
    const cambios = {};
    const detalle = [];
    const comparar = (campoBD, nuevo, etiqueta, actual) => {
      if (nuevo === undefined || nuevo === actual) return;
      cambios[campoBD] = nuevo;
      detalle.push(`${etiqueta}: "${actual ?? ''}" → "${nuevo ?? ''}"`);
    };
    comparar('id_estandar', d.idEstandar, 'estándar', e.id_estandar);
    comparar('nombre', d.nombre, 'nombre', e.nombre);
    comparar('descripcion', d.descripcion === undefined ? undefined : d.descripcion || null, 'descripción', e.descripcion);
    comparar('tipo_instrumento', d.tipo, 'tipo', e.tipo_instrumento);
    comparar('calificacion_minima', d.calificacionMinima, 'calificación mínima', Number(e.calificacion_minima));
    if (!detalle.length) throw new AppError(400, 'No hay cambios que guardar.');

    const protegidos = ['id_estandar', 'tipo_instrumento', 'calificacion_minima'].filter((c) => c in cambios);
    if (protegidos.length) {
      const calificados = await IntentoEvaluacion.count({ where: { id_evaluacion: id, estatus: { [Op.ne]: 'pendiente' } }, transaction: t });
      if (calificados) {
        throw new AppError(409, `Este instrumento ya se usó en ${calificados} intento(s) calificado(s): solo puede cambiar su nombre y descripción. Si el criterio cambió, desactívelo y registre uno nuevo.`);
      }
    }
    if ('id_estandar' in cambios) await estandarActivo(cambios.id_estandar, t);
    if ('nombre' in cambios || 'id_estandar' in cambios) await verificarNombreLibre(cambios.id_estandar ?? e.id_estandar, cambios.nombre ?? e.nombre, id, t);

    await e.update(cambios, { transaction: t });
    await registrarAuditoria({ idUsuario, accion: 'modificar', entidad: 'evaluacion', idRegistro: e.id_evaluacion, detalle: detalle.join('; ') }, t);
    return aRespuesta(await buscar(id, t));
  });
}

async function cambiarEstado(id, activa, idUsuario) {
  return sequelize.transaction(async (t) => {
    const e = await buscar(id, t);
    if (e.activa === activa) throw new AppError(400, `El instrumento ya está ${activa ? 'activo' : 'desactivado'}.`);
    if (!activa) {
      const pendientes = await IntentoEvaluacion.count({ where: { id_evaluacion: id, estatus: 'pendiente' }, transaction: t });
      if (pendientes) throw new AppError(409, `No se puede desactivar: tiene ${pendientes} intento(s) pendiente(s) de calificar.`);
    } else if (!e.estandar.activo) {
      throw new AppError(409, `No se puede activar: el estándar ${e.estandar.codigo} está desactivado.`);
    }
    await e.update({ activa }, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: activa ? 'activar' : 'desactivar', entidad: 'evaluacion', idRegistro: e.id_evaluacion,
      detalle: `Instrumento "${e.nombre}" del estándar ${e.estandar.codigo}`,
    }, t);
    return { nombre: e.nombre, activa };
  });
}

module.exports = { listar, crear, actualizar, cambiarEstado, TIPO_TEXTO };
