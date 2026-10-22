const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const { registrarAuditoria } = require('../../utils/auditoria');
const { Curso, EstandarCompetencia, Grupo, sequelize } = require('../../models');

// ---------------------------------------------------------------------
// Cursos (CU-04, RF-CUR-01)
// El curso es la plantilla de lo que se enseña y siempre se basa en un estándar.
// La modalidad, fechas, cupo, instructor y evaluador pertenecen al GRUPO (CU-05).
// Reglas: el estándar debe estar activo; no se borra, se desactiva; no se puede
// desactivar si tiene grupos planeados o en curso.
// ---------------------------------------------------------------------

const incluirEstandar = { model: EstandarCompetencia, as: 'estandar', attributes: ['id_estandar', 'codigo', 'nombre', 'activo'] };

const contarGrupos = [
  sequelize.literal("(SELECT COUNT(*) FROM grupo g WHERE g.id_curso = Curso.id_curso AND g.estatus IN ('planeado','en_curso'))"),
  'gruposVigentes',
];

function aRespuesta(c) {
  return {
    id: c.id_curso,
    nombre: c.nombre,
    descripcion: c.descripcion,
    activo: c.activo,
    idEstandar: c.id_estandar,
    estandar: c.estandar ? { id: c.estandar.id_estandar, codigo: c.estandar.codigo, nombre: c.estandar.nombre, activo: c.estandar.activo } : undefined,
    gruposVigentes: c.get('gruposVigentes') !== undefined ? Number(c.get('gruposVigentes')) : undefined,
  };
}

async function listar({ buscar, idEstandar, activo }) {
  const where = {};
  if (buscar) where.nombre = { [Op.like]: `%${buscar}%` };
  if (idEstandar) where.id_estandar = idEstandar;
  if (activo !== undefined) where.activo = activo;
  const cursos = await Curso.findAll({
    where,
    include: incluirEstandar,
    attributes: { include: [contarGrupos] },
    order: [['activo', 'DESC'], ['nombre', 'ASC']],
  });
  return cursos.map(aRespuesta);
}

async function buscarPorId(id, transaction) {
  const curso = await Curso.findByPk(id, { include: incluirEstandar, transaction });
  if (!curso) throw new AppError(404, 'No se encontró el curso.');
  return curso;
}

async function obtener(id) {
  return aRespuesta(await buscarPorId(id));
}

async function validarEstandarActivo(idEstandar, transaction) {
  const estandar = await EstandarCompetencia.findByPk(idEstandar, { transaction });
  if (!estandar) throw new AppError(400, 'El estándar de competencia seleccionado no existe.');
  if (!estandar.activo) throw new AppError(400, `El estándar ${estandar.codigo} está desactivado. Actívelo o elija otro.`);
  return estandar;
}

async function crear(datos, idUsuario) {
  return sequelize.transaction(async (t) => {
    const estandar = await validarEstandarActivo(datos.idEstandar, t);
    const curso = await Curso.create({
      id_estandar: estandar.id_estandar, nombre: datos.nombre, descripcion: datos.descripcion || null,
    }, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: 'crear', entidad: 'curso', idRegistro: curso.id_curso,
      detalle: `Alta del curso "${datos.nombre}" basado en ${estandar.codigo}`,
    }, t);
    return aRespuesta(await buscarPorId(curso.id_curso, t));
  });
}

async function actualizar(id, datos, idUsuario) {
  return sequelize.transaction(async (t) => {
    const curso = await buscarPorId(id, t);
    const cambios = {};
    const detalle = [];
    for (const campo of ['nombre', 'descripcion']) {
      const nuevo = campo === 'descripcion' ? (datos.descripcion || null) : datos[campo];
      if (datos[campo] !== undefined && nuevo !== curso[campo]) {
        detalle.push(`${campo}: "${curso[campo] ?? ''}" → "${nuevo ?? ''}"`);
        cambios[campo] = nuevo;
      }
    }
    if (datos.idEstandar !== undefined && Number(datos.idEstandar) !== curso.id_estandar) {
      const estandar = await validarEstandarActivo(datos.idEstandar, t);
      const grupos = await Grupo.count({ where: { id_curso: curso.id_curso }, transaction: t });
      if (grupos > 0) {
        throw new AppError(409, 'No se puede cambiar el estándar de un curso que ya tiene grupos. Registre un curso nuevo para el otro estándar.');
      }
      detalle.push(`estándar: ${curso.estandar.codigo} → ${estandar.codigo}`);
      cambios.id_estandar = estandar.id_estandar;
    }
    if (!Object.keys(cambios).length) throw new AppError(400, 'No hay cambios que guardar.');
    await curso.update(cambios, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: 'modificar', entidad: 'curso', idRegistro: curso.id_curso, detalle: detalle.join('; '),
    }, t);
    return aRespuesta(await buscarPorId(curso.id_curso, t));
  });
}

async function cambiarEstado(id, activo, idUsuario) {
  return sequelize.transaction(async (t) => {
    const curso = await buscarPorId(id, t);
    if (curso.activo === activo) throw new AppError(400, activo ? 'El curso ya está activo.' : 'El curso ya está desactivado.');
    if (activo && !curso.estandar.activo) {
      throw new AppError(409, `No se puede activar: el estándar ${curso.estandar.codigo} está desactivado.`);
    }
    if (!activo) {
      const vigentes = await Grupo.count({
        where: { id_curso: curso.id_curso, estatus: ['planeado', 'en_curso'] }, transaction: t,
      });
      if (vigentes > 0) {
        throw new AppError(409, `El curso tiene ${vigentes} grupo(s) planeado(s) o en curso. Concluya o cancele esos grupos antes de desactivarlo.`);
      }
    }
    await curso.update({ activo }, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: activo ? 'activar' : 'desactivar', entidad: 'curso', idRegistro: curso.id_curso,
      detalle: `${activo ? 'Activación' : 'Desactivación'} del curso "${curso.nombre}"`,
    }, t);
    return aRespuesta(await buscarPorId(curso.id_curso, t));
  });
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstado };
