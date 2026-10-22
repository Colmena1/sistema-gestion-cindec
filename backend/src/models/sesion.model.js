const { DataTypes } = require('sequelize');

// Tabla: sesion
// Cada sesión (fecha y horario) de un grupo (RF-CUR-09, 10).
// Fuente: docs/02-diseno/sql/03-modulo-cursos-participantes.sql
module.exports = (sequelize) =>
  sequelize.define('Sesion', {
    id_sesion:   { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_grupo:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> grupo
    fecha:       { type: DataTypes.DATEONLY, allowNull: false },
    hora_inicio: { type: DataTypes.TIME, allowNull: false },
    hora_fin:    { type: DataTypes.TIME, allowNull: false }, // CHECK: > hora_inicio
    tema:        { type: DataTypes.STRING(200), allowNull: true },
  }, {
    tableName: 'sesion',
  });
