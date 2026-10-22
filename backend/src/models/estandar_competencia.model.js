const { DataTypes } = require('sequelize');

// Tabla: estandar_competencia
// Estándar de competencia de CONOCER (p. ej. EC0110.02).
// Fuente: docs/02-diseno/sql/03-modulo-cursos-participantes.sql
module.exports = (sequelize) =>
  sequelize.define('EstandarCompetencia', {
    id_estandar: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    codigo:      { type: DataTypes.STRING(20), allowNull: false }, // único
    nombre:      { type: DataTypes.STRING(255), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    activo:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'estandar_competencia',
  });
