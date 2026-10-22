const { DataTypes } = require('sequelize');

// Tabla: usuario
// Toda persona que entra al sistema (RF-USR-01, 04, 05). Un rol por usuario.
// Fuente: docs/02-diseno/sql/02-modulo-usuarios.sql
module.exports = (sequelize) =>
  sequelize.define('Usuario', {
    id_usuario:      { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_rol:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> rol
    nombre:          { type: DataTypes.STRING(100), allowNull: false },
    apellidos:       { type: DataTypes.STRING(100), allowNull: false },
    correo:          { type: DataTypes.STRING(254), allowNull: false }, // único
    contrasena_hash: { type: DataTypes.CHAR(60), allowNull: false }, // hash bcrypt (60 caracteres)
    activo:          { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }, // se desactiva en vez de borrar
    fecha_registro:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    ultimo_acceso:   { type: DataTypes.DATE, allowNull: true }, // vacío hasta el primer inicio de sesión
  }, {
    tableName: 'usuario',
    // Por seguridad, las consultas normales NUNCA traen el hash de la contraseña.
    // Solo el login lo pide explícitamente con: Usuario.scope('conContrasena').findOne(...)
    defaultScope: { attributes: { exclude: ['contrasena_hash'] } },
    scopes: { conContrasena: { attributes: { include: ['contrasena_hash'] } } },
  });
