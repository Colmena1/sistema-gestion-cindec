const { DataTypes } = require('sequelize');

// Tabla: documento_certificacion
// Certificado emitido por CONOCER para un trámite (1 a 1).
// Fuente: docs/02-diseno/sql/06-modulo-certificaciones.sql
module.exports = (sequelize) =>
  sequelize.define('DocumentoCertificacion', {
    id_doc_cert:           { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_tramite:            { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> tramite_certificacion; único
    folio_conocer:         { type: DataTypes.STRING(50), allowNull: false }, // único
    tipo_documento:        { type: DataTypes.STRING(100), allowNull: false },
    fecha_emision:         { type: DataTypes.DATEONLY, allowNull: false },
    vigencia:              { type: DataTypes.DATEONLY, allowNull: true }, // CHECK: >= fecha_emision
    entidad_certificacion: { type: DataTypes.STRING(150), allowNull: false, defaultValue: 'CINDEC (ECE516-22)' },
    ruta_archivo:          { type: DataTypes.STRING(255), allowNull: false }, // PDF oficial en uploads/
  }, {
    tableName: 'documento_certificacion',
  });
