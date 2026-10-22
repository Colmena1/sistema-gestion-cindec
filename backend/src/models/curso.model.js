const { DataTypes } = require('sequelize');

// Tabla: curso
// Plantilla de lo que se enseña; se basa en un estándar (RF-CUR-01).
// Fuente: docs/02-diseno/sql/03-modulo-cursos-participantes.sql
module.exports = (sequelize) =>
  sequelize.define('Curso', {
    id_curso:    { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_estandar: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> estandar_competencia
    nombre:      { type: DataTypes.STRING(150), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    activo:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'curso',
  });
