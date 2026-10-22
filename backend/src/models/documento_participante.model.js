const { DataTypes } = require('sequelize');
const { TIPO_DOCUMENTO_PARTICIPANTE } = require('./enums');

// Tabla: documento_participante
// Documentos que entrega el participante (catálogo del manual CONOCER).
// Fuente: docs/02-diseno/sql/03-modulo-cursos-participantes.sql
module.exports = (sequelize) =>
  sequelize.define('DocumentoParticipante', {
    id_documento:    { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_participante: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> participante
    tipo_documento:  { type: DataTypes.ENUM(...TIPO_DOCUMENTO_PARTICIPANTE), allowNull: false },
    nombre_archivo:  { type: DataTypes.STRING(255), allowNull: false }, // nombre original
    ruta_archivo:    { type: DataTypes.STRING(255), allowNull: false }, // dónde quedó en uploads/
    fecha_carga:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'documento_participante',
  });
