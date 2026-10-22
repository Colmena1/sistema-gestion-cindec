const { DataTypes } = require('sequelize');

// Tabla: evidencia
// Evidencias de un intento de evaluación (RF-EVA-02).
// Fuente: docs/02-diseno/sql/05-modulo-evaluaciones.sql
module.exports = (sequelize) =>
  sequelize.define('Evidencia', {
    id_evidencia: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_intento:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> intento_evaluacion
    descripcion:  { type: DataTypes.TEXT, allowNull: true }, // CHECK: descripción o archivo
    ruta_archivo: { type: DataTypes.STRING(255), allowNull: true },
    fecha_carga:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'evidencia',
  });
