const { DataTypes } = require('sequelize');
const { ESTATUS_INSCRIPCION } = require('./enums');

// Tabla: inscripcion
// Participante inscrito en un grupo (RF-CUR-04). Par participante-grupo único.
// Fuente: docs/02-diseno/sql/03-modulo-cursos-participantes.sql
module.exports = (sequelize) =>
  sequelize.define('Inscripcion', {
    id_inscripcion:    { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_participante:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> participante
    id_grupo:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> grupo
    fecha_inscripcion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    estatus:           { type: DataTypes.ENUM(...ESTATUS_INSCRIPCION), allowNull: false, defaultValue: 'inscrito' },
    es_refuerzo:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // recursa como refuerzo (RF-EVA-04)
  }, {
    tableName: 'inscripcion',
  });
