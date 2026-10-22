const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const { registrarAuditoria } = require('../../utils/auditoria');
const { EstandarCompetencia, Curso, sequelize } = require('../../models');

// ---------------------------------------------------------------------
// Estándares de competencia (CU-04, RF-CUR-01)
// Reglas: el código es único (p. ej. EC0110.02); no se borran, se desactivan;
// no se puede desactivar un estándar que todavía tenga cursos activos.
// ---------------------------------------------------------------------

function aRespuesta(e) {
  return {
    id: e.id_estandar,
    codigo: e.codigo,
    nombre: e.nombre,
    descripcion: e.descripcion,
    activo: e.activo,
    cursosActivos: e.get('cursosActivos') !== undefined ? Number(e.get('cursosActivos')) : undefined,
  };
}

// Cuenta los cursos activos de cada estándar dentro de la misma consulta (RNF-15).
const contarCursosActivos = [
  sequelize.literal('(SELECT COUNT(*) FROM curso c WHERE c.id_estandar = EstandarCompetencia.id_estandar AND c.activo = TRUE)'),
  'cursosActivos',
];

async function listar({ buscar, activo }) {
  const where = {};
  if (buscar) {
    where[Op.or] = [{ codigo: { [Op.like]: `%${buscar}%` } }, { nombre: { [Op.like]: `%${buscar}%` } }];
  }
  if (activo !== undefined) where.activo = activo;
  const estandares = await EstandarCompetencia.findAll({
    where,
    attributes: { include: [contarCursosActivos] },
    order: [['activo', 'DESC'], ['codigo', 'ASC']],
  });
  return estandares.map(aRespuesta);
}

async function buscarPorId(id, transaction) {
  const estandar = await EstandarCompetencia.findByPk(id, { transaction });
  if (!estandar) throw new AppError(404, 'No se encontró el estándar de competencia.');
  return estandar;
}

async function verificarCodigoLibre(codigo, idExcluir, transaction) {
  const where = { codigo };
  if (idExcluir) where.id_estandar = { [Op.ne]: idExcluir };
  if (await EstandarCompetencia.findOne({ where, transaction })) {
    throw new AppError(409, `Ya existe un estándar con el código ${codigo}.`);
  }
}

async function crear(datos, idUsuario) {
  return sequelize.transaction(async (t) => {
    await verificarCodigoLibre(datos.codigo, null, t);
    const estandar = await EstandarCompetencia.create({
      codigo: datos.codigo, nombre: datos.nombre, descripcion: datos.descripcion || null,
    }, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: 'crear', entidad: 'estandar_competencia', idRegistro: estandar.id_estandar,
      detalle: `Alta del estándar ${datos.codigo} — ${datos.nombre}`,
    }, t);
    return aRespuesta(estandar);
  });
}

async function actualizar(id, datos, idUsuario) {
  return sequelize.transaction(async (t) => {
    const estandar = await buscarPorId(id, t);
    const cambios = {};
    const detalle = [];
    for (const campo of ['codigo', 'nombre', 'descripcion']) {
      const nuevo = campo === 'descripcion' ? (datos.descripcion || null) : datos[campo];
      if (datos[campo] !== undefined && nuevo !== estandar[campo]) {
        if (campo === 'codigo') await verificarCodigoLibre(nuevo, estandar.id_estandar, t);
        detalle.push(`${campo}: "${estandar[campo] ?? ''}" → "${nuevo ?? ''}"`);
        cambios[campo] = nuevo;
      }
    }
    if (!Object.keys(cambios).length) throw new AppError(400, 'No hay cambios que guardar.');
    await estandar.update(cambios, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: 'modificar', entidad: 'estandar_competencia', idRegistro: estandar.id_estandar,
      detalle: detalle.join('; '),
    }, t);
    return aRespuesta(estandar);
  });
}

async function cambiarEstado(id, activo, idUsuario) {
  return sequelize.transaction(async (t) => {
    const estandar = await buscarPorId(id, t);
    if (estandar.activo === activo) throw new AppError(400, activo ? 'El estándar ya está activo.' : 'El estándar ya está desactivado.');
    if (!activo) {
      const cursos = await Curso.count({ where: { id_estandar: estandar.id_estandar, activo: true }, transaction: t });
      if (cursos > 0) {
        throw new AppError(409, `El estándar tiene ${cursos} curso(s) activo(s). Desactive primero esos cursos.`);
      }
    }
    await estandar.update({ activo }, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: activo ? 'activar' : 'desactivar', entidad: 'estandar_competencia', idRegistro: estandar.id_estandar,
      detalle: `${activo ? 'Activación' : 'Desactivación'} del estándar ${estandar.codigo}`,
    }, t);
    return aRespuesta(estandar);
  });
}

module.exports = { listar, crear, actualizar, cambiarEstado };
