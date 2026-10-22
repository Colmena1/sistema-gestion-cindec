const { DataTypes } = require('sequelize');
const { TIPO_INSTRUMENTO } = require('./enums');

// Tabla: evaluacion
// Instrumento de evaluación de un estándar (RF-EVA-01, 04).
// Fuente: docs/02-diseno/sql/05-modulo-evaluaciones.sql
module.exports = (sequelize) =>
  sequelize.define('Evaluacion', {
    id_evaluacion:       { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_estandar:         { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> estandar_competencia
    nombre:              { type: DataTypes.STRING(150), allowNull: false },
    descripcion:         { type: DataTypes.TEXT, allowNull: true },
    tipo_instrumento:    { type: DataTypes.ENUM(...TIPO_INSTRUMENTO), allowNull: false },
    calificacion_minima: { type: DataTypes.DECIMAL(5, 2), allowNull: false }, // CHECK: 0 a 100
    activa:              { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'evaluacion',
  });
