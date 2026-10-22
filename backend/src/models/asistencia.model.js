const { DataTypes } = require('sequelize');

// Tabla: asistencia
// Asistencia de una inscripción a una sesión (RF-CUR-10). Par único.
// Fuente: docs/02-diseno/sql/03-modulo-cursos-participantes.sql
module.exports = (sequelize) =>
  sequelize.define('Asistencia', {
    id_asistencia:  { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_inscripcion: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> inscripcion
    id_sesion:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> sesion
    asistio:        { type: DataTypes.BOOLEAN, allowNull: false },
    observaciones:  { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'asistencia',
  });
