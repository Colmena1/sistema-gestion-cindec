const fs = require('fs/promises');
const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const { cifrar } = require('../../utils/contrasena');
const { registrarAuditoria } = require('../../utils/auditoria');
const archivos = require('../../utils/archivos');
const curpUtil = require('../../utils/curp');
const ROLES = require('../../config/roles');
const { plantilla, enviarCorreo } = require('../notificaciones/correo.service');
const { avancePorParticipante: avanceMateriales } = require('../aprendizaje/materiales.service');
const { historialDeParticipante: historialEvaluaciones } = require('../evaluaciones/intentos.service');
const {
  Usuario, Rol, Participante, DocumentoParticipante, Curso, EstandarCompetencia,
  Inscripcion, Grupo, sequelize,
} = require('../../models');

// ---------------------------------------------------------------------
// Participantes (CU-06 Autorregistrarse, CU-10 Consultar expediente; RF-CUR-03 y 06)
// Un participante es un usuario con rol Participante + sus datos propios (tabla participante)
// + sus documentos (catálogo del manual de CONOCER):
//   - identificación oficial (INE, cartilla militar, cédula profesional o pasaporte): obligatoria
//   - fotografía: obligatoria; JPG o PNG de 300 KB como máximo; se guarda con la CURP como nombre
//   - ficha de registro firmada: opcional al registrarse
//   - identificación del tutor: obligatoria si la CURP indica que es menor de edad
// Reglas: correo y CURP únicos; todo se guarda en una transacción y, si algo falla,
// se borran los archivos ya escritos (no quedan registros a medias).
// ---------------------------------------------------------------------

const IDENTIFICACIONES = ['ine', 'cartilla_militar', 'cedula_profesional', 'pasaporte'];
const NOMBRE_DOCUMENTO = {
  ine: 'INE', cartilla_militar: 'Cartilla militar', cedula_profesional: 'Cédula profesional', pasaporte: 'Pasaporte',
  fotografia: 'Fotografía', ficha_registro: 'Ficha de registro', identificacion_tutor: 'Identificación del tutor',
};
const FOTO_MAX_BYTES = 300 * 1024;

const carpetaDe = (idParticipante) => `participantes/${idParticipante}`;

// ---------- Catálogo público y verificación previa ----------
async function cursosDisponibles() {
  const cursos = await Curso.findAll({
    where: { activo: true },
    include: { model: EstandarCompetencia, as: 'estandar', where: { activo: true }, attributes: ['codigo'] },
    attributes: ['id_curso', 'nombre'],
    order: [['nombre', 'ASC']],
  });
  return cursos.map((c) => ({ id: c.id_curso, nombre: c.nombre, estandar: c.estandar.codigo }));
}

async function verificarDisponibilidad({ correo, curp }) {
  const [usuario, participante] = await Promise.all([
    correo ? Usuario.findOne({ where: { correo }, attributes: ['id_usuario'] }) : null,
    curp ? Participante.findOne({ where: { curp }, attributes: ['id_participante'] }) : null,
  ]);
  return { correoDisponible: !usuario, curpDisponible: !participante };
}

// ---------- Validación de documentos ----------
function validarDocumentos(archivosRecibidos, tipoIdentificacion, curp, { exigirObligatorios }) {
  const a = archivosRecibidos || {};
  const errores = [];
  if (exigirObligatorios && !a.identificacion) errores.push({ campo: 'identificacion', mensaje: 'Suba su identificación oficial.' });
  if (a.identificacion && !IDENTIFICACIONES.includes(tipoIdentificacion)) {
    errores.push({ campo: 'tipoIdentificacion', mensaje: 'Indique qué identificación está subiendo.' });
  }
  if (exigirObligatorios && !a.fotografia) errores.push({ campo: 'fotografia', mensaje: 'Suba su fotografía.' });
  if (a.fotografia) {
    if (a.fotografia.mimetype === 'application/pdf') errores.push({ campo: 'fotografia', mensaje: 'La fotografía debe ser JPG o PNG, no PDF.' });
    else if (a.fotografia.size > FOTO_MAX_BYTES) errores.push({ campo: 'fotografia', mensaje: 'La fotografía debe pesar como máximo 300 KB (requisito de CONOCER).' });
  }
  if (exigirObligatorios && curpUtil.esMenorDeEdad(curp) && !a.identificacion_tutor) {
    errores.push({ campo: 'identificacion_tutor', mensaje: 'Por ser menor de edad, suba la identificación de su madre, padre o tutor.' });
  }
  if (errores.length) throw new AppError(400, 'Revise los documentos.', errores);
}

// Escribe los documentos y crea sus registros. Devuelve las rutas escritas (para borrarlas si algo falla).
async function guardarDocumentos(participante, archivosRecibidos, tipoIdentificacion, transaction, escritas) {
  const marca = Date.now();
  const lista = [];
  if (archivosRecibidos.identificacion) lista.push([tipoIdentificacion, archivosRecibidos.identificacion, `identificacion-${marca}`]);
  if (archivosRecibidos.fotografia) lista.push(['fotografia', archivosRecibidos.fotografia, participante.curp]); // CONOCER: nombre = CURP
  if (archivosRecibidos.ficha_registro) lista.push(['ficha_registro', archivosRecibidos.ficha_registro, `ficha-registro-${marca}`]);
  if (archivosRecibidos.identificacion_tutor) lista.push(['identificacion_tutor', archivosRecibidos.identificacion_tutor, `identificacion-tutor-${marca}`]);

  for (const [tipo, archivo, nombre] of lista) {
    const ruta = await archivos.guardar(carpetaDe(participante.id_participante), nombre, archivo);
    escritas.push(ruta);
    await DocumentoParticipante.create({
      id_participante: participante.id_participante,
      tipo_documento: tipo,
      nombre_archivo: archivo.originalname.slice(0, 255),
      ruta_archivo: ruta,
    }, { transaction });
  }
  return lista.map(([tipo]) => NOMBRE_DOCUMENTO[tipo]);
}

// ---------- Alta (autorregistro o por el coordinador) ----------
async function registrar(datos, archivosRecibidos, { origen, idQuienRegistra }) {
  if (!curpUtil.esValida(datos.curp)) {
    throw new AppError(400, 'Revise los datos.', [{ campo: 'curp', mensaje: 'La CURP no es válida. Revise que tenga 18 caracteres y la fecha de nacimiento correcta.' }]);
  }
  validarDocumentos(archivosRecibidos, datos.tipoIdentificacion, datos.curp, { exigirObligatorios: origen === 'autorregistro' });

  const escritas = [];
  let resultado;
  try {
    resultado = await sequelize.transaction(async (t) => {
      const disponibles = await verificarDisponibilidad({ correo: datos.correo, curp: datos.curp });
      const errores = [];
      if (!disponibles.correoDisponible) errores.push({ campo: 'correo', mensaje: 'Ya existe una cuenta con ese correo. Si es suya, inicie sesión o recupere su contraseña.' });
      if (!disponibles.curpDisponible) errores.push({ campo: 'curp', mensaje: 'Ya hay un participante registrado con esa CURP.' });
      if (errores.length) throw new AppError(409, 'Esos datos ya están registrados.', errores);

      if (datos.idCursoInteres) {
        const curso = await Curso.findByPk(datos.idCursoInteres, { transaction: t });
        if (!curso || !curso.activo) throw new AppError(400, 'El curso de interés seleccionado no está disponible.');
      }

      const rol = await Rol.findOne({ where: { nombre: ROLES.PARTICIPANTE }, transaction: t });
      const usuario = await Usuario.create({
        id_rol: rol.id_rol,
        nombre: datos.nombre,
        apellidos: datos.apellidos,
        correo: datos.correo,
        contrasena_hash: await cifrar(datos.contrasena),
      }, { transaction: t });

      const participante = await Participante.create({
        id_usuario: usuario.id_usuario,
        id_curso_interes: datos.idCursoInteres || null,
        telefono: datos.telefono,
        curp: datos.curp,
        empresa_procedencia: datos.empresaProcedencia || null,
        origen_registro: origen,
      }, { transaction: t });

      const documentos = await guardarDocumentos(participante, archivosRecibidos || {}, datos.tipoIdentificacion, t, escritas);

      await registrarAuditoria({
        idUsuario: idQuienRegistra || usuario.id_usuario,
        accion: 'crear',
        entidad: 'participante',
        idRegistro: participante.id_participante,
        detalle: `${origen === 'autorregistro' ? 'Autorregistro' : 'Alta por coordinación'} de ${datos.nombre} ${datos.apellidos} (CURP ${datos.curp}); documentos: ${documentos.join(', ') || 'ninguno'}`,
      }, t);

      return { idParticipante: participante.id_participante, usuario };
    });
  } catch (err) {
    await Promise.all(escritas.map(archivos.eliminar)); // no dejar archivos huérfanos
    throw err;
  }

  // Confirmación por correo (RF-NOT-01, CU-21). Si el correo falla, el registro ya quedó hecho.
  const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  enviarCorreo({
    para: datos.correo,
    asunto: 'Registro exitoso — Sistema CINDEC',
    html: plantilla({
      titulo: 'Su registro se completó',
      parrafos: [
        `Hola, ${datos.nombre}.`,
        origen === 'autorregistro'
          ? 'Su cuenta de participante en el Sistema de Gestión de Capacitación y Certificación de CINDEC quedó creada.'
          : 'El personal de CINDEC creó su cuenta de participante en el Sistema de Gestión de Capacitación y Certificación. La contraseña inicial se la proporcionará la coordinación.',
        'Desde el sistema podrá consultar sus cursos, materiales, evaluaciones y certificados.',
      ],
      boton: { texto: 'Iniciar sesión', url },
    }),
    texto: `Hola, ${datos.nombre}. Su cuenta de participante en el Sistema CINDEC quedó creada. Inicie sesión en: ${url}`,
  }).catch((err) => console.error('No se pudo enviar el correo de registro:', err.message));

  return { id: resultado.idParticipante };
}

// ---------- Lista y expediente (CU-10) ----------
const incluirUsuario = { model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nombre', 'apellidos', 'correo', 'activo', 'fecha_registro'] };
const incluirCursoInteres = { model: Curso, as: 'cursoInteres', attributes: ['id_curso', 'nombre'] };

async function listar({ buscar, pagina = 1, limite = 10 }) {
  const where = {};
  if (buscar) {
    const texto = `%${buscar}%`;
    where[Op.or] = [
      { curp: { [Op.like]: texto } },
      { '$usuario.nombre$': { [Op.like]: texto } },
      { '$usuario.apellidos$': { [Op.like]: texto } },
      { '$usuario.correo$': { [Op.like]: texto } },
    ];
  }
  const { rows, count } = await Participante.findAndCountAll({
    where,
    include: [incluirUsuario, incluirCursoInteres],
    attributes: {
      include: [[sequelize.literal("(SELECT COUNT(*) FROM inscripcion i WHERE i.id_participante = Participante.id_participante AND i.estatus <> 'baja')"), 'inscripcionesActivas']],
    },
    order: [[{ model: Usuario, as: 'usuario' }, 'apellidos', 'ASC'], [{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC']],
    limit: limite,
    offset: (pagina - 1) * limite,
    subQuery: false,
  });
  return {
    participantes: rows.map((p) => ({
      id: p.id_participante,
      nombre: `${p.usuario.nombre} ${p.usuario.apellidos}`,
      correo: p.usuario.correo,
      curp: p.curp,
      telefono: p.telefono,
      empresa: p.empresa_procedencia,
      cursoInteres: p.cursoInteres?.nombre || null,
      activo: p.usuario.activo,
      origen: p.origen_registro,
      inscripcionesActivas: Number(p.get('inscripcionesActivas')),
    })),
    total: count,
    pagina,
    paginas: Math.max(1, Math.ceil(count / limite)),
  };
}

async function buscarPorId(id, transaction) {
  const participante = await Participante.findByPk(id, { include: [incluirUsuario, incluirCursoInteres], transaction });
  if (!participante) throw new AppError(404, 'No se encontró el participante.');
  return participante;
}

async function expediente(id) {
  const p = await buscarPorId(id);
  const [documentos, inscripciones] = await Promise.all([
    DocumentoParticipante.findAll({ where: { id_participante: id }, order: [['fecha_carga', 'DESC']] }),
    Inscripcion.findAll({
      where: { id_participante: id },
      include: {
        model: Grupo, as: 'grupo', attributes: ['id_grupo', 'clave', 'fecha_inicio', 'fecha_fin', 'modalidad', 'estatus'],
        include: { model: Curso, as: 'curso', attributes: ['id_curso', 'nombre'], include: { model: EstandarCompetencia, as: 'estandar', attributes: ['codigo'] } },
      },
      order: [['fecha_inscripcion', 'DESC']],
    }),
  ]);
  const [avance, evaluaciones] = await Promise.all([avanceMateriales(id), historialEvaluaciones(id)]);
  return {
    id: p.id_participante,
    idUsuario: p.usuario.id_usuario,
    nombre: p.usuario.nombre,
    apellidos: p.usuario.apellidos,
    correo: p.usuario.correo,
    activo: p.usuario.activo,
    fechaRegistro: p.usuario.fecha_registro,
    curp: p.curp,
    esMenorDeEdad: curpUtil.esMenorDeEdad(p.curp),
    telefono: p.telefono,
    empresa: p.empresa_procedencia,
    idCursoInteres: p.id_curso_interes,
    cursoInteres: p.cursoInteres?.nombre || null,
    origen: p.origen_registro,
    documentos: documentos.map((d) => ({
      id: d.id_documento, tipo: d.tipo_documento, nombreTipo: NOMBRE_DOCUMENTO[d.tipo_documento],
      nombreArchivo: d.nombre_archivo, fechaCarga: d.fecha_carga,
    })),
    inscripciones: inscripciones.map((i) => ({
      id: i.id_inscripcion,
      idGrupo: i.grupo.id_grupo,
      clave: i.grupo.clave,
      curso: i.grupo.curso.nombre,
      estandar: i.grupo.curso.estandar.codigo,
      fechaInicio: i.grupo.fecha_inicio,
      fechaFin: i.grupo.fecha_fin,
      estatusGrupo: i.grupo.estatus,
      estatus: i.estatus,
      esRefuerzo: i.es_refuerzo,
      fechaInscripcion: i.fecha_inscripcion,
      materiales: avance[i.grupo.curso.id_curso] || { total: 0, consultados: 0 }, // RF-APR-03
    })),
    evaluaciones, // RF-EVA-05: intentos con su estatus y dictamen
  };
}

// Edición de datos por la coordinación
async function actualizar(id, d, idUsuario) {
  return sequelize.transaction(async (t) => {
    const p = await buscarPorId(id, t);
    const cambiosUsuario = {};
    const cambiosParticipante = {};
    const detalle = [];
    const comparar = (destino, campoBD, valorNuevo, etiqueta, actual) => {
      if (valorNuevo === undefined || valorNuevo === actual) return;
      destino[campoBD] = valorNuevo;
      detalle.push(`${etiqueta}: "${actual ?? ''}" → "${valorNuevo ?? ''}"`);
    };
    comparar(cambiosUsuario, 'nombre', d.nombre, 'nombre', p.usuario.nombre);
    comparar(cambiosUsuario, 'apellidos', d.apellidos, 'apellidos', p.usuario.apellidos);
    if (d.correo !== undefined && d.correo !== p.usuario.correo) {
      if (await Usuario.findOne({ where: { correo: d.correo, id_usuario: { [Op.ne]: p.id_usuario } }, transaction: t })) {
        throw new AppError(409, 'Ya existe una cuenta con ese correo.', [{ campo: 'correo', mensaje: 'Ya existe una cuenta con ese correo.' }]);
      }
      comparar(cambiosUsuario, 'correo', d.correo, 'correo', p.usuario.correo);
    }
    if (d.curp !== undefined && d.curp !== p.curp) {
      if (!curpUtil.esValida(d.curp)) throw new AppError(400, 'Revise los datos.', [{ campo: 'curp', mensaje: 'La CURP no es válida.' }]);
      if (await Participante.findOne({ where: { curp: d.curp, id_participante: { [Op.ne]: p.id_participante } }, transaction: t })) {
        throw new AppError(409, 'Ya hay un participante con esa CURP.', [{ campo: 'curp', mensaje: 'Ya hay un participante con esa CURP.' }]);
      }
      comparar(cambiosParticipante, 'curp', d.curp, 'CURP', p.curp);
    }
    comparar(cambiosParticipante, 'telefono', d.telefono, 'teléfono', p.telefono);
    if (d.empresaProcedencia !== undefined) comparar(cambiosParticipante, 'empresa_procedencia', d.empresaProcedencia || null, 'empresa', p.empresa_procedencia);
    if (d.idCursoInteres !== undefined) {
      const nuevo = d.idCursoInteres || null;
      if (nuevo && !(await Curso.findByPk(nuevo, { transaction: t }))) throw new AppError(400, 'El curso de interés no existe.');
      comparar(cambiosParticipante, 'id_curso_interes', nuevo, 'curso de interés', p.id_curso_interes);
    }
    if (!detalle.length) throw new AppError(400, 'No hay cambios que guardar.');
    if (Object.keys(cambiosUsuario).length) await p.usuario.update(cambiosUsuario, { transaction: t });
    if (Object.keys(cambiosParticipante).length) await p.update(cambiosParticipante, { transaction: t });
    await registrarAuditoria({
      idUsuario, accion: 'modificar', entidad: 'participante', idRegistro: p.id_participante, detalle: detalle.join('; '),
    }, t);
  });
}

// Agregar un documento al expediente (por la coordinación)
async function agregarDocumento(id, tipo, archivo, idUsuario) {
  if (!archivo) throw new AppError(400, 'Seleccione el archivo.', [{ campo: 'archivo', mensaje: 'Seleccione el archivo.' }]);
  if (tipo === 'fotografia') {
    if (archivo.mimetype === 'application/pdf') throw new AppError(400, 'La fotografía debe ser JPG o PNG, no PDF.');
    if (archivo.size > FOTO_MAX_BYTES) throw new AppError(400, 'La fotografía debe pesar como máximo 300 KB (requisito de CONOCER).');
  }
  const escritas = [];
  try {
    await sequelize.transaction(async (t) => {
      const p = await buscarPorId(id, t);
      const nombre = tipo === 'fotografia' ? `${p.curp}-${Date.now()}` : `${tipo.replace(/_/g, '-')}-${Date.now()}`;
      const ruta = await archivos.guardar(carpetaDe(p.id_participante), nombre, archivo);
      escritas.push(ruta);
      const doc = await DocumentoParticipante.create({
        id_participante: p.id_participante, tipo_documento: tipo, nombre_archivo: archivo.originalname.slice(0, 255), ruta_archivo: ruta,
      }, { transaction: t });
      await registrarAuditoria({
        idUsuario, accion: 'crear', entidad: 'documento_participante', idRegistro: doc.id_documento,
        detalle: `${NOMBRE_DOCUMENTO[tipo]} agregada al expediente de ${p.usuario.nombre} ${p.usuario.apellidos}`,
      }, t);
    });
  } catch (err) {
    await Promise.all(escritas.map(archivos.eliminar));
    throw err;
  }
}

// Archivo de un documento. Lo pueden ver la coordinación y el propio participante.
async function archivoDocumento(idDocumento, solicitante) {
  const doc = await DocumentoParticipante.findByPk(idDocumento, { include: { model: Participante, as: 'participante', attributes: ['id_usuario'] } });
  if (!doc) throw new AppError(404, 'No se encontró el documento.');
  const esPersonal = [ROLES.ADMIN, ROLES.COORDINADOR].includes(solicitante.rol);
  if (!esPersonal && doc.participante.id_usuario !== solicitante.id) {
    throw new AppError(403, 'No tiene permiso para ver este documento.');
  }
  const ruta = archivos.rutaAbsoluta(doc.ruta_archivo);
  try {
    await fs.access(ruta);
  } catch {
    throw new AppError(404, 'El archivo de este documento no se encuentra en el servidor. Vuelva a subirlo con "Agregar documento".');
  }
  return { ruta, nombre: doc.nombre_archivo };
}

module.exports = {
  IDENTIFICACIONES, cursosDisponibles, verificarDisponibilidad, registrar, listar, expediente,
  actualizar, agregarDocumento, archivoDocumento,
};
