const { DataTypes } = require('sequelize');
const { DICTAMEN, ESTATUS_INTENTO } = require('./enums');

// Tabla: intento_evaluacion
// Cada intento de un participante en una evaluación; guarda estatus y dictamen (RF-EVA-02, 03, 05).
// Fuente: docs/02-diseno/sql/05-modulo-evaluaciones.sql
module.exports = (sequelize) =>
  sequelize.define('IntentoEvaluacion', {
    id_intento:       { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_inscripcion:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> inscripcion
    id_evaluacion:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> evaluacion
    id_evaluador:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // FK -> usuario; vacío mientras está pendiente
    numero_intento:   { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false }, // 1, 2, 3...
    fecha_aplicacion: { type: DataTypes.DATEONLY, allowNull: false },
    calificacion:     { type: DataTypes.DECIMAL(5, 2), allowNull: true }, // vacía mientras está pendiente
    estatus:          { type: DataTypes.ENUM(...ESTATUS_INTENTO), allowNull: false, defaultValue: 'pendiente' },
    dictamen:         { type: DataTypes.ENUM(...DICTAMEN), allowNull: true }, // competente / todavía no competente
    observaciones:    { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'intento_evaluacion',
  });
