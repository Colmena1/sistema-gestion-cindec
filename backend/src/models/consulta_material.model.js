const { DataTypes } = require('sequelize');

// Tabla: consulta_material
// Qué materiales ha revisado cada participante (RF-APR-03). Par único.
// Fuente: docs/02-diseno/sql/04-modulo-aprendizaje.sql
module.exports = (sequelize) =>
  sequelize.define('ConsultaMaterial', {
    id_consulta:            { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_participante:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> participante
    id_material:            { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> material
    fecha_primera_consulta: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    fecha_ultima_consulta:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }, // MySQL la actualiza sola (ON UPDATE)
  }, {
    tableName: 'consulta_material',
  });
