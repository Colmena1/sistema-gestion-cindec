const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const { cifrar } = require('../../utils/contrasena');
const { registrarAuditoria } = require('../../utils/auditoria');
const ROLES = require('../../config/roles');
const { Usuario, Rol, sequelize } = require('../../models');

// ---------------------------------------------------------------------
// Reglas de negocio del módulo Usuarios (CU-03, RF-USR-01, 02 y 04)
// 1. Los participantes NO se crean aquí: necesitan CURP, teléfono y documentos
//    (tabla participante), y se registran por autorregistro o por el coordinador
//    (Sprint 2). Por lo mismo, no se puede cambiar el rol de un participante
//    ni convertir a alguien en participante desde esta pantalla.
// 2. Un administrador no puede desactivarse a sí mismo.
// 3. Siempre debe quedar al menos un Administrador general activo.
// 4. Cada alta, edición, cambio de contraseña y activación/desactivación queda en auditoría.
// ---------------------------------------------------------------------

const incluirRol = { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] };

function aRespuesta(u) {
  return {
    id: u.id_usuario,
    nombre: u.nombre,
    apellidos: u.apellidos,
    correo: u.correo,
    activo: u.activo,
    idRol: u.id_rol,
    rol: u.rol?.nombre,
    fechaRegistro: u.fecha_registro,
    ultimoAcceso: u.ultimo_acceso,
  };
}

async function listarRoles() {
  const roles = await Rol.findAll({ order: [['id_rol', 'ASC']] });
  return roles.map((r) => ({
    id: r.id_rol,
    nombre: r.nombre,
    descripcion: r.descripcion,
    asignableDesdeUsuarios: r.nombre !== ROLES.PARTICIPANTE,
  }));
}

// Lista con búsqueda, filtros y paginación (RNF-15: no se traen todos los registros).
async function listar({ buscar, idRol, activo, pagina = 1, limite = 10 }) {
  const where = {};
  if (buscar) {
    const texto = `%${buscar}%`;
    where[Op.or] = [
      { nombre: { [Op.like]: texto } },
      { apellidos: { [Op.like]: texto } },
      { correo: { [Op.like]: texto } },
    ];
  }
  if (idRol) where.id_rol = idRol;
  if (activo !== undefined) where.activo = activo;

  const { rows, count } = await Usuario.findAndCountAll({
    where,
    include: incluirRol,
    order: [['activo', 'DESC'], ['apellidos', 'ASC'], ['nombre', 'ASC']],
    limit: limite,
    offset: (pagina - 1) * limite,
  });

  return {
    usuarios: rows.map(aRespuesta),
    total: count,
    pagina,
    paginas: Math.max(1, Math.ceil(count / limite)),
  };
}

async function buscarPorId(id, transaction) {
  const usuario = await Usuario.findByPk(id, { include: incluirRol, transaction });
  if (!usuario) throw new AppError(404, 'No se encontró el usuario.');
  return usuario;
}

async function obtener(id) {
  return aRespuesta(await buscarPorId(id));
}

async function validarRolAsignable(idRol, transaction) {
  const rol = await Rol.findByPk(idRol, { transaction });
  if (!rol) throw new AppError(400, 'El rol seleccionado no existe.');
  if (rol.nombre === ROLES.PARTICIPANTE) {
    throw new AppError(400, 'Los participantes se registran con el formulario de autorregistro o desde el módulo de Participantes, porque requieren CURP y documentos.');
  }
  return rol;
}

async function verificarCorreoLibre(correo, idExcluir, transaction) {
  const where = { correo };
  if (idExcluir) where.id_usuario = { [Op.ne]: idExcluir };
  const existe = await Usuario.findOne({ where, transaction });
  if (existe) throw new AppError(409, 'Ya existe un usuario registrado con ese correo electrónico.');
}

// ¿Quedaría el sistema sin ningún administrador activo si este usuario deja de serlo?
async function esUltimoAdministradorActivo(usuario, transaction) {
  if (usuario.rol.nombre !== ROLES.ADMIN || !usuario.activo) return false;
  const activos = await Usuario.count({
    where: { activo: true },
    include: { model: Rol, as: 'rol', where: { nombre: ROLES.ADMIN } },
    transaction,
  });
  return activos <= 1;
}

// Alta de usuario (RF-USR-01, 02)
async function crear(datos, idAdmin) {
  return sequelize.transaction(async (t) => {
    const rol = await validarRolAsignable(datos.idRol, t);
    await verificarCorreoLibre(datos.correo, null, t);

    const nuevo = await Usuario.create({
      id_rol: rol.id_rol,
      nombre: datos.nombre,
      apellidos: datos.apellidos,
      correo: datos.correo,
      contrasena_hash: await cifrar(datos.contrasena),
    }, { transaction: t });

    await registrarAuditoria({
      idUsuario: idAdmin, accion: 'crear', entidad: 'usuario', idRegistro: nuevo.id_usuario,
      detalle: `Alta de ${datos.nombre} ${datos.apellidos} (${datos.correo}) con rol ${rol.nombre}`,
    }, t);

    return aRespuesta(await buscarPorId(nuevo.id_usuario, t));
  });
}

// Edición de datos, rol y, opcionalmente, contraseña (RF-USR-04)
async function actualizar(id, datos, idAdmin) {
  return sequelize.transaction(async (t) => {
    const usuario = await buscarPorId(id, t);
    const cambios = {};
    const detalle = [];

    for (const [campo, etiqueta] of [['nombre', 'nombre'], ['apellidos', 'apellidos'], ['correo', 'correo']]) {
      if (datos[campo] !== undefined && datos[campo] !== usuario[campo]) {
        if (campo === 'correo') await verificarCorreoLibre(datos.correo, usuario.id_usuario, t);
        detalle.push(`${etiqueta}: "${usuario[campo]}" → "${datos[campo]}"`);
        cambios[campo] = datos[campo];
      }
    }

    if (datos.idRol !== undefined && Number(datos.idRol) !== usuario.id_rol) {
      if (usuario.rol.nombre === ROLES.PARTICIPANTE) {
        throw new AppError(400, 'No se puede cambiar el rol de un participante.');
      }
      const nuevoRol = await validarRolAsignable(datos.idRol, t);
      if (await esUltimoAdministradorActivo(usuario, t)) {
        throw new AppError(409, 'No se puede cambiar el rol del único administrador activo. Primero asigne el rol de administrador a otra persona.');
      }
      detalle.push(`rol: "${usuario.rol.nombre}" → "${nuevoRol.nombre}"`);
      cambios.id_rol = nuevoRol.id_rol;
    }

    if (datos.contrasena) {
      cambios.contrasena_hash = await cifrar(datos.contrasena);
      detalle.push('contraseña restablecida por el administrador');
    }

    if (Object.keys(cambios).length === 0) {
      throw new AppError(400, 'No hay cambios que guardar.');
    }

    await usuario.update(cambios, { transaction: t });
    await registrarAuditoria({
      idUsuario: idAdmin, accion: 'modificar', entidad: 'usuario', idRegistro: usuario.id_usuario,
      detalle: detalle.join('; '),
    }, t);

    return aRespuesta(await buscarPorId(usuario.id_usuario, t));
  });
}

// Activar / desactivar (en lugar de borrar, RNF-08 y RNF-10)
async function cambiarEstado(id, activo, idAdmin) {
  return sequelize.transaction(async (t) => {
    const usuario = await buscarPorId(id, t);
    if (usuario.activo === activo) {
      throw new AppError(400, activo ? 'El usuario ya está activo.' : 'El usuario ya está desactivado.');
    }
    if (!activo && usuario.id_usuario === idAdmin) {
      throw new AppError(409, 'No puede desactivar su propia cuenta.');
    }
    if (!activo && await esUltimoAdministradorActivo(usuario, t)) {
      throw new AppError(409, 'No se puede desactivar al único administrador activo.');
    }

    await usuario.update({ activo }, { transaction: t });
    await registrarAuditoria({
      idUsuario: idAdmin,
      accion: activo ? 'activar' : 'desactivar',
      entidad: 'usuario',
      idRegistro: usuario.id_usuario,
      detalle: `${activo ? 'Activación' : 'Desactivación'} de ${usuario.nombre} ${usuario.apellidos} (${usuario.correo})`,
    }, t);

    return aRespuesta(await buscarPorId(usuario.id_usuario, t));
  });
}

module.exports = { listarRoles, listar, obtener, crear, actualizar, cambiarEstado };
