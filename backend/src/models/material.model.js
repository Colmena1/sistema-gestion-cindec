const { DataTypes } = require('sequelize');
const { TIPO_MATERIAL } = require('./enums');

// Tabla: material
// Material de aprendizaje de un curso (RF-APR-01).
// Fuente: docs/02-diseno/sql/04-modulo-aprendizaje.sql
module.exports = (sequelize) =>
  sequelize.define('Material', {
    id_material:  { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_curso:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> curso
    titulo:       { type: DataTypes.STRING(200), allowNull: false },
    tipo:         { type: DataTypes.ENUM(...TIPO_MATERIAL), allowNull: false },
    ruta_archivo: { type: DataTypes.STRING(255), allowNull: true }, // CHECK: archivo o video, al menos uno
    url_video:    { type: DataTypes.STRING(500), allowNull: true },
    orden:        { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 1 }, // posición en la lista
    fecha_carga:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'material',
  });
