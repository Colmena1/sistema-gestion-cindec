const { DataTypes } = require('sequelize');
const { ESTATUS_TRAMITE } = require('./enums');

// Tabla: tramite_certificacion
// Trámite de certificación; solo nace de un intento 'competente' (RF-CERT).
// Fuente: docs/02-diseno/sql/06-modulo-certificaciones.sql
module.exports = (sequelize) =>
  sequelize.define('TramiteCertificacion', {
    id_tramite:      { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_intento:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> intento_evaluacion; único (1 a 1)
    folio_interno:   { type: DataTypes.STRING(30), allowNull: false }, // único
    fecha_solicitud: { type: DataTypes.DATEONLY, allowNull: false },
    estatus:         { type: DataTypes.ENUM(...ESTATUS_TRAMITE), allowNull: false, defaultValue: 'solicitado' },
  }, {
    tableName: 'tramite_certificacion',
  });
