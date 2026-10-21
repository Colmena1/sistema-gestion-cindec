-- =====================================================================
-- CINDEC · Diseño físico · Paso 6: índices adicionales
-- Servidor: MySQL 8.0 · Base de datos: cindec_db
-- MySQL ya creó solo los índices de cada PRIMARY KEY, UNIQUE y FOREIGN KEY.
-- Aquí solo se agregan los que necesitan las búsquedas y reportes frecuentes del ERS.
-- =====================================================================
USE cindec_db;

-- Buscar personas por nombre (el coordinador busca al participante al inscribirlo, RF-CUR-04).
CREATE INDEX idx_usuario_apellidos_nombre ON usuario (apellidos, nombre);

-- Reporte "participantes registrados por periodo" (RF-REP-01).
CREATE INDEX idx_usuario_fecha_registro ON usuario (fecha_registro);

-- Listar grupos activos / concluidos y por fechas (RF-CUR-08, RF-REP-01).
CREATE INDEX idx_grupo_estatus_inicio ON grupo (estatus, fecha_inicio);

-- Consultar certificaciones por estatus y por fechas (RF-CERT-05).
CREATE INDEX idx_tramite_estatus_fecha ON tramite_certificacion (estatus, fecha_solicitud);

-- Ver la bitácora de un registro concreto (RNF-07).
CREATE INDEX idx_auditoria_entidad_registro ON auditoria (entidad_afectada, id_registro_afectado);

-- Verificación: lista todos los índices de la base de datos.
-- SELECT table_name, index_name, column_name, non_unique
-- FROM information_schema.statistics
-- WHERE table_schema = 'cindec_db'
-- ORDER BY table_name, index_name, seq_in_index;
