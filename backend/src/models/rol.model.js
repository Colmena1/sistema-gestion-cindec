const { DataTypes } = require('sequelize');

// Tabla: rol
// Catálogo de los 5 roles de V1 (RF-USR-02).
// Fuente: docs/02-diseno/sql/02-modulo-usuarios.sql
module.exports = (sequelize) =>
  sequelize.define('Rol', {
    id_rol:      { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    nombre:      { type: DataTypes.STRING(50), allowNull: false }, // único
    descripcion: { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'rol',
  });
