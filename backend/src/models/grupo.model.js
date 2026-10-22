const { DataTypes } = require('sequelize');
const { ESTATUS_GRUPO, MODALIDAD } = require('./enums');

// Tabla: grupo
// Oferta concreta de un curso: fechas, cupo, modalidad, instructor y evaluador (RF-CUR-02, 05, 08, 09).
// Fuente: docs/02-diseno/sql/03-modulo-cursos-participantes.sql
module.exports = (sequelize) =>
  sequelize.define('Grupo', {
    id_grupo:                { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_curso:                { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> curso
    id_instructor:           { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // FK -> usuario; vacío mientras está planeado
    id_evaluador:            { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // FK -> usuario; vacío mientras está planeado
    clave:                   { type: DataTypes.STRING(20), allowNull: false }, // único, p. ej. G-2026-01
    fecha_inicio:            { type: DataTypes.DATEONLY, allowNull: false },
    fecha_fin:               { type: DataTypes.DATEONLY, allowNull: false }, // CHECK: >= fecha_inicio
    cupo:                    { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false }, // CHECK: > 0
    modalidad:               { type: DataTypes.ENUM(...MODALIDAD), allowNull: false },
    estatus:                 { type: DataTypes.ENUM(...ESTATUS_GRUPO), allowNull: false, defaultValue: 'planeado' },
    enlace_videoconferencia: { type: DataTypes.STRING(500), allowNull: true }, // solo en línea / mixta
  }, {
    tableName: 'grupo',
  });
