const fs = require('fs/promises');
const path = require('path');
const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const { registrarAuditoria } = require('../../utils/auditoria');
const archivos = require('../../utils/archivos');
const ROLES = require('../../config/roles');
const {
  Material, ConsultaMaterial, Curso, EstandarCompetencia, Grupo, Inscripcion, Participante, Usuario, sequelize,
} = require('../../models');

// ---------------------------------------------------------------------
// Aprendizaje: CU-12 Gestionar materiales (Instructor), CU-13 Consultar y descargar (Participante)
// RF-APR-01, 02 y 03.
// Reglas:
//  - el material pertenece al CURSO (lo comparten todos sus grupos);
//  - el instructor solo administra materiales de cursos en los que tiene (o tuvo) un grupo;
//    la coordinación y el administrador, de todos;
//  - un material es un archivo (PDF, Office, imagen; hasta 20 MB) o un enlace a video (CHECK en BD);
//  - el participante solo ve materiales de cursos en los que está inscrito (sin baja);
//  - cada descarga o apertura de video del participante queda en consulta_material
//    (primera y última consulta) = indicador "materiales consultados" (RF-APR-03);
//  - un material ya consultado no se elimina (conserva el historial; RNF-08).
// ---------------------------------------------------------------------

const TIPO_TEXTO = { manual: 'Manual', presentacion: 'Presentación', pdf: 'PDF', ejercicio: 'Ejercicio', video: 'Video' };
const FORMATO = { '.pdf': 'PDF', '.doc': 'Word', '.docx': 'Word', '.ppt': 'PowerPoint', '.pptx': 'PowerPoint', '.xls': 'Excel', '.xlsx': 'Excel', '.jpg': 'Imagen', '.png': 'Imagen' };
const esPersonal = (u) => [ROLES.ADMIN, ROLES.COORDINADOR].includes(u.rol);

async function tamanoArchivo(ruta) {
  try { return (await fs.stat(archivos.rutaAbsoluta(ruta))).size; } catch { return null; }
}

async function aRespuesta(m, extra = {}) {
  return {
    id: m.id_material,
    titulo: m.titulo,
    tipo: m.tipo,
    tipoTexto: TIPO_TEXTO[m.tipo],
    esVideo: !m.ruta_archivo,
    urlVideo: m.url_video,
    formato: m.ruta_archivo ? FORMATO[path.extname(m.ruta_archivo).toLowerCase()] || 'Archivo' : 'Enlace externo',
    tamano: m.ruta_archivo ? await tamanoArchivo(m.ruta_archivo) : null,
    orden: m.orden,
    fechaCarga: m.fecha_carga,
    ...extra,
  };
}

// ¿Puede esta persona administrar los materiales del curso?
async function verificarGestion(idCurso, solicitante, transaction) {
  const curso = await Curso.findByPk(idCurso, { include: { model: EstandarCompetencia, as: 'estandar', attributes: ['codigo'] }, transaction });
  if (!curso) throw new AppError(404, 'No se encontró el curso.');
  if (esPersonal(solicitante)) return curso;
  if (solicitante.rol === ROLES.INSTRUCTOR) {
    const imparte = await Grupo.count({ where: { id_curso: idCurso, id_instructor: solicitante.id, estatus: { [Op.ne]: 'cancelado' } }, transaction });
    if (imparte) return curso;
  }
  throw new AppError(403, 'Solo puede administrar los materiales de los cursos que imparte.');
}

// ---------- Administración (CU-12) ----------

// Cursos cuyos materiales puede administrar (para la pantalla del instructor)
async function cursosGestionables(solicitante) {
  const where = { activo: true };
  const include = [{ model: EstandarCompetencia, as: 'estandar', attributes: ['codigo'] }];
  if (!esPersonal(solicitante)) {
    include.push({ model: Grupo, as: 'grupos', where: { id_instructor: solicitante.id, estatus: { [Op.ne]: 'cancelado' } }, attributes: [] });
  }
  const cursos = await Curso.findAll({
    where, include, order: [['nombre', 'ASC']],
    attributes: {
      include: [[sequelize.literal('(SELECT COUNT(*) FROM material m WHERE m.id_curso = Curso.id_curso)'), 'materiales']],
    },
  });
  // Un curso aparece una sola vez aunque el instructor tenga varios grupos de él
  const unicos = new Map(cursos.map((c) => [c.id_curso, c]));
  return [...unicos.values()].map((c) => ({ id: c.id_curso, nombre: c.nombre, estandar: c.estandar.codigo, materiales: Number(c.get('materiales')) }));
}

async function listarDeCurso(idCurso, solicitante) {
  const curso = await verificarGestion(idCurso, solicitante);
  const materiales = await Material.findAll({
    where: { id_curso: idCurso },
    attributes: { include: [[sequelize.literal('(SELECT COUNT(*) FROM consulta_material c WHERE c.id_material = Material.id_material)'), 'consultas']] },
    order: [['orden', 'ASC'], ['id_material', 'ASC']],
  });
  // Participantes con inscripción vigente en el curso: base del indicador "consultado por X de Y"
  const participantesCurso = await Inscripcion.count({
    where: { estatus: { [Op.ne]: 'baja' } },
    include: { model: Grupo, as: 'grupo', where: { id_curso: idCurso, estatus: { [Op.ne]: 'cancelado' } }, attributes: [] },
    distinct: true, col: 'id_participante',
  });
  return {
    curso: { id: curso.id_curso, nombre: curso.nombre, estandar: curso.estandar.codigo },
    participantesCurso,
    materiales: await Promise.all(materiales.map((m) => aRespuesta(m, { consultas: Number(m.get('consultas')) }))),
  };
}

async function crear(idCurso, datos, archivo, solicitante) {
  const escritas = [];
  try {
    return await sequelize.transaction(async (t) => {
      const curso = await verificarGestion(idCurso, solicitante, t);
      const esVideo = datos.tipo === 'video';
      if (esVideo && !datos.urlVideo) throw new AppError(400, 'Escriba el enlace del video.', [{ campo: 'urlVideo', mensaje: 'Escriba el enlace del video, empezando con https://' }]);
      if (!esVideo && !archivo) throw new AppError(400, 'Seleccione el archivo del material.', [{ campo: 'archivo', mensaje: 'Seleccione el archivo.' }]);

      const orden = datos.orden || (await Material.max('orden', { where: { id_curso: idCurso }, transaction: t }) || 0) + 1;
      const material = await Material.create({
        id_curso: idCurso, titulo: datos.titulo, tipo: datos.tipo, orden,
        url_video: esVideo ? datos.urlVideo : null,
        ruta_archivo: esVideo ? null : 'pendiente', // se sustituye en cuanto se guarda el archivo (CHECK: archivo o video)
      }, { transaction: t });
      if (!esVideo) {
        const ruta = await archivos.guardar(`materiales/curso-${idCurso}`, `material-${material.id_material}-${Date.now()}`, archivo);
        escritas.push(ruta);
        await material.update({ ruta_archivo: ruta }, { transaction: t });
      }
      await registrarAuditoria({
        idUsuario: solicitante.id, accion: 'crear', entidad: 'material', idRegistro: material.id_material,
        detalle: `Material "${datos.titulo}" (${TIPO_TEXTO[datos.tipo]}) en el curso "${curso.nombre}"`,
      }, t);
      return aRespuesta(material);
    });
  } catch (err) {
    await Promise.all(escritas.map(archivos.eliminar));
    throw err;
  }
}

async function buscarMaterial(id, transaction) {
  const material = await Material.findByPk(id, { transaction });
  if (!material) throw new AppError(404, 'No se encontró el material.');
  return material;
}

async function actualizar(id, datos, solicitante) {
  return sequelize.transaction(async (t) => {
    const material = await buscarMaterial(id, t);
    await verificarGestion(material.id_curso, solicitante, t);
    const cambios = {};
    if (datos.titulo !== undefined && datos.titulo !== material.titulo) cambios.titulo = datos.titulo;
    if (datos.orden !== undefined && datos.orden !== material.orden) cambios.orden = datos.orden;
    if (datos.urlVideo !== undefined && !material.ruta_archivo && datos.urlVideo !== material.url_video) cambios.url_video = datos.urlVideo;
    if (!Object.keys(cambios).length) throw new AppError(400, 'No hay cambios que guardar.');
    await material.update(cambios, { transaction: t });
    await registrarAuditoria({
      idUsuario: solicitante.id, accion: 'modificar', entidad: 'material', idRegistro: material.id_material,
      detalle: Object.entries(cambios).map(([k, v]) => `${k}: "${v}"`).join('; '),
    }, t);
    return aRespuesta(material);
  });
}

async function eliminar(id, solicitante) {
  let ruta = null;
  await sequelize.transaction(async (t) => {
    const material = await buscarMaterial(id, t);
    await verificarGestion(material.id_curso, solicitante, t);
    const consultas = await ConsultaMaterial.count({ where: { id_material: id }, transaction: t });
    if (consultas) throw new AppError(409, `Este material ya fue consultado por ${consultas} participante(s) y no se puede eliminar, para conservar su historial.`);
    ruta = material.ruta_archivo;
    await registrarAuditoria({
      idUsuario: solicitante.id, accion: 'eliminar', entidad: 'material', idRegistro: material.id_material,
      detalle: `Material "${material.titulo}" eliminado`,
    }, t);
    await material.destroy({ transaction: t });
  });
  if (ruta) await archivos.eliminar(ruta);
}

// ---------- Consulta (CU-13) ----------

// ¿Puede ver el material? Personal, instructor del curso o participante inscrito (sin baja).
// Si es participante, devuelve su id para registrar la consulta.
async function verificarAcceso(material, solicitante) {
  if (esPersonal(solicitante)) return null;
  if (solicitante.rol === ROLES.INSTRUCTOR) {
    await verificarGestion(material.id_curso, solicitante);
    return null;
  }
  if (solicitante.rol === ROLES.PARTICIPANTE) {
    const participante = await Participante.findOne({ where: { id_usuario: solicitante.id } });
    const inscrito = participante && await Inscripcion.count({
      where: { id_participante: participante.id_participante, estatus: { [Op.ne]: 'baja' } },
      include: { model: Grupo, as: 'grupo', where: { id_curso: material.id_curso, estatus: { [Op.ne]: 'cancelado' } }, attributes: [] },
    });
    if (inscrito) return participante.id_participante;
  }
  throw new AppError(403, 'Este material es solo para los participantes inscritos en el curso.');
}

// Registra la consulta: la primera vez la crea; después, MySQL actualiza fecha_ultima_consulta.
async function registrarConsulta(idParticipante, idMaterial) {
  const [consulta, creada] = await ConsultaMaterial.findOrCreate({
    where: { id_participante: idParticipante, id_material: idMaterial },
    defaults: { id_participante: idParticipante, id_material: idMaterial },
  });
  if (!creada) await consulta.update({ fecha_ultima_consulta: new Date() });
}

async function archivoParaDescargar(id, solicitante) {
  const material = await buscarMaterial(id);
  if (!material.ruta_archivo) throw new AppError(400, 'Este material es un video; ábralo con "Ver video".');
  const idParticipante = await verificarAcceso(material, solicitante);
  const ruta = archivos.rutaAbsoluta(material.ruta_archivo);
  try { await fs.access(ruta); } catch { throw new AppError(404, 'El archivo de este material no se encuentra en el servidor.'); }
  if (idParticipante) await registrarConsulta(idParticipante, material.id_material);
  const nombre = `${material.titulo}${path.extname(material.ruta_archivo)}`.replace(/[\\/:*?"<>|]/g, '');
  return { ruta, nombre };
}

async function abrirVideo(id, solicitante) {
  const material = await buscarMaterial(id);
  if (!material.url_video) throw new AppError(400, 'Este material no es un video.');
  const idParticipante = await verificarAcceso(material, solicitante);
  if (idParticipante) await registrarConsulta(idParticipante, material.id_material);
  return { url: material.url_video };
}

// Materiales del participante, agrupados por curso, con lo que ya consultó (P-22)
async function misMateriales(idUsuario) {
  const participante = await Participante.findOne({ where: { id_usuario: idUsuario } });
  if (!participante) throw new AppError(404, 'No se encontró su registro de participante.');
  const inscripciones = await Inscripcion.findAll({
    where: { id_participante: participante.id_participante, estatus: { [Op.ne]: 'baja' } },
    include: {
      model: Grupo, as: 'grupo', where: { estatus: { [Op.ne]: 'cancelado' } },
      include: [
        { model: Curso, as: 'curso', include: { model: EstandarCompetencia, as: 'estandar', attributes: ['codigo'] } },
        { model: Usuario, as: 'instructor', attributes: ['nombre', 'apellidos'] },
      ],
    },
    order: [['fecha_inscripcion', 'DESC']],
  });
  const consultas = await ConsultaMaterial.findAll({ where: { id_participante: participante.id_participante } });
  const consultados = new Map(consultas.map((c) => [c.id_material, c.fecha_ultima_consulta]));

  const vistos = new Set();
  const resultado = [];
  for (const i of inscripciones) {
    const curso = i.grupo.curso;
    if (vistos.has(curso.id_curso)) continue; // un curso aparece una sola vez aunque haya sido refuerzo
    vistos.add(curso.id_curso);
    const materiales = await Material.findAll({ where: { id_curso: curso.id_curso }, order: [['orden', 'ASC'], ['id_material', 'ASC']] });
    resultado.push({
      idCurso: curso.id_curso,
      curso: curso.nombre,
      estandar: curso.estandar.codigo,
      clave: i.grupo.clave,
      estatusGrupo: i.grupo.estatus,
      instructor: i.grupo.instructor ? `${i.grupo.instructor.nombre} ${i.grupo.instructor.apellidos}` : null,
      materiales: await Promise.all(materiales.map((m) => aRespuesta(m, { consultado: consultados.has(m.id_material), ultimaConsulta: consultados.get(m.id_material) || null }))),
    });
  }
  return resultado;
}

// Indicador por participante (RF-APR-03): materiales consultados de cada curso en que está inscrito
async function avancePorParticipante(idParticipante) {
  const filas = await sequelize.query(`
    SELECT g.id_curso AS idCurso,
           (SELECT COUNT(*) FROM material m WHERE m.id_curso = g.id_curso) AS total,
           (SELECT COUNT(*) FROM consulta_material c JOIN material m ON m.id_material = c.id_material
             WHERE c.id_participante = :idParticipante AND m.id_curso = g.id_curso) AS consultados
    FROM inscripcion i JOIN grupo g ON g.id_grupo = i.id_grupo
    WHERE i.id_participante = :idParticipante
    GROUP BY g.id_curso`, { replacements: { idParticipante }, type: sequelize.QueryTypes.SELECT });
  return Object.fromEntries(filas.map((f) => [f.idCurso, { total: Number(f.total), consultados: Number(f.consultados) }]));
}

module.exports = {
  cursosGestionables, listarDeCurso, crear, actualizar, eliminar,
  archivoParaDescargar, abrirVideo, misMateriales, avancePorParticipante,
};
