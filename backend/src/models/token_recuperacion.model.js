const { DataTypes } = require('sequelize');

// Tabla: token_recuperacion
// Enlace de un solo uso para restablecer la contraseña (RF-USR-06).
// Fuente: docs/02-diseno/sql/02-modulo-usuarios.sql
module.exports = (sequelize) =>
  sequelize.define('TokenRecuperacion', {
    id_token:         { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_usuario:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> usuario (CASCADE)
    token_hash:       { type: DataTypes.CHAR(64), allowNull: false }, // SHA-256 del token; único
    fecha_expiracion: { type: DataTypes.DATE, allowNull: false },
    usado:            { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    tableName: 'token_recuperacion',
  });
