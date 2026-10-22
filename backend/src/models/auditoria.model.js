const { DataTypes } = require('sequelize');

// Tabla: auditoria
// Bitácora de operaciones sensibles: quién, cuándo, qué y sobre qué registro (RNF-07).
// Fuente: docs/02-diseno/sql/02-modulo-usuarios.sql
module.exports = (sequelize) =>
  sequelize.define('Auditoria', {
    id_auditoria:         { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_usuario:           { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> usuario
    fecha_hora:           { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    accion:               { type: DataTypes.STRING(50), allowNull: false }, // crear, modificar, desactivar...
    entidad_afectada:     { type: DataTypes.STRING(64), allowNull: false }, // nombre de la tabla
    id_registro_afectado: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // sin FK a propósito
    detalle:              { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'auditoria',
  });
