const { DataTypes } = require('sequelize');
const { ESTATUS_TRAMITE } = require('./enums');

// Tabla: historial_tramite
// Cada cambio de estatus de un trámite.
// Fuente: docs/02-diseno/sql/06-modulo-certificaciones.sql
module.exports = (sequelize) =>
  sequelize.define('HistorialTramite', {
    id_historial:  { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_tramite:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> tramite_certificacion
    estatus:       { type: DataTypes.ENUM(...ESTATUS_TRAMITE), allowNull: false },
    fecha_cambio:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'historial_tramite',
  });
