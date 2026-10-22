-- =====================================================================
-- CINDEC · Mantenimiento de datos de prueba · Script 10
-- Servidor: MySQL 8.0 · Base de datos: cindec_db
--
-- Por qué existe: el script 08-datos-prueba.sql se escribió en la fase de Diseño para
-- probar las tablas y sus relaciones, e insertó directamente asistencias, intentos de
-- evaluación, evidencias y un trámite de certificación del grupo G-2026-01, que todavía
-- está "planeado" (inicia el 03/11/2026). El sistema no permite crear esos registros
-- antes de tiempo, así que se eliminan para que los datos de prueba sean coherentes con
-- las reglas de negocio antes de desarrollar Evaluaciones y Certificaciones (Sprint 3).
--
-- Qué borra (SOLO esto):
--   1. Asistencias de grupos planeados o de sesiones con fecha futura.
--   2. Trámites (con su historial y documento), evidencias e intentos de evaluación
--      de inscripciones en grupos planeados.
-- Qué NO toca: usuarios, participantes, cursos, grupos, sesiones, inscripciones,
-- ni nada registrado desde el sistema en grupos en curso (por ejemplo, la asistencia
-- tomada el 22/10/2026 en EC0301-2026-02).
--
-- Cómo usarlo: abrirlo en MySQL Workbench y ejecutarlo completo (rayo ⚡).
-- Al final muestra cuántos registros quedan de cada tabla.
-- =====================================================================
USE cindec_db;

SET SQL_SAFE_UPDATES = 0;   -- Workbench bloquea DELETE con JOIN si está activo
START TRANSACTION;

-- 1. Asistencias adelantadas
DELETE a
FROM asistencia a
JOIN sesion s ON s.id_sesion = a.id_sesion
JOIN grupo  g ON g.id_grupo  = s.id_grupo
WHERE g.estatus = 'planeado' OR s.fecha > CURDATE();

-- 2. Cadena de certificación y evaluación de grupos planeados (de hijos a padres)
DELETE h
FROM historial_tramite h
JOIN tramite_certificacion t ON t.id_tramite     = h.id_tramite
JOIN intento_evaluacion    i ON i.id_intento     = t.id_intento
JOIN inscripcion         ins ON ins.id_inscripcion = i.id_inscripcion
JOIN grupo                 g ON g.id_grupo       = ins.id_grupo
WHERE g.estatus = 'planeado';

DELETE d
FROM documento_certificacion d
JOIN tramite_certificacion t ON t.id_tramite     = d.id_tramite
JOIN intento_evaluacion    i ON i.id_intento     = t.id_intento
JOIN inscripcion         ins ON ins.id_inscripcion = i.id_inscripcion
JOIN grupo                 g ON g.id_grupo       = ins.id_grupo
WHERE g.estatus = 'planeado';

DELETE t
FROM tramite_certificacion t
JOIN intento_evaluacion    i ON i.id_intento     = t.id_intento
JOIN inscripcion         ins ON ins.id_inscripcion = i.id_inscripcion
JOIN grupo                 g ON g.id_grupo       = ins.id_grupo
WHERE g.estatus = 'planeado';

DELETE e
FROM evidencia e
JOIN intento_evaluacion    i ON i.id_intento     = e.id_intento
JOIN inscripcion         ins ON ins.id_inscripcion = i.id_inscripcion
JOIN grupo                 g ON g.id_grupo       = ins.id_grupo
WHERE g.estatus = 'planeado';

DELETE i
FROM intento_evaluacion    i
JOIN inscripcion         ins ON ins.id_inscripcion = i.id_inscripcion
JOIN grupo                 g ON g.id_grupo       = ins.id_grupo
WHERE g.estatus = 'planeado';

COMMIT;
SET SQL_SAFE_UPDATES = 1;

-- Verificación: registros que quedan
SELECT 'asistencia' AS tabla, COUNT(*) AS registros FROM asistencia
UNION ALL SELECT 'intento_evaluacion', COUNT(*) FROM intento_evaluacion
UNION ALL SELECT 'evidencia', COUNT(*) FROM evidencia
UNION ALL SELECT 'tramite_certificacion', COUNT(*) FROM tramite_certificacion
UNION ALL SELECT 'historial_tramite', COUNT(*) FROM historial_tramite
UNION ALL SELECT 'documento_certificacion', COUNT(*) FROM documento_certificacion;
