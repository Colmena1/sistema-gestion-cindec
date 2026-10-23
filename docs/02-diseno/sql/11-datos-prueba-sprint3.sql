-- =====================================================================
-- CINDEC · Datos de prueba para Sprint 3 (Materiales, Evaluaciones, Certificaciones)
-- Servidor: MySQL 8.0 · Base de datos: cindec_db
-- Requiere: 02 a 07 (tablas creadas) y 08-datos-prueba.sql ya ejecutado
--           (reutiliza el rol Participante, el instructor y la evaluadora de prueba,
--           y el curso/estándar "Asesor inmobiliario" / EC0110.02 de ese script).
-- TODOS los datos son FICTICIOS (personas, CURP, correos, folios).
--
-- Por qué existe: 08-datos-prueba.sql dejó evaluaciones/certificación "adelantadas"
-- sobre el grupo G-2026-01, que sigue "planeado" (inicia 03/11/2026) y las reglas de
-- negocio no permiten evaluar antes de tiempo; 10-limpiar-registros-adelantados.sql
-- ya las quitó. Este script las repone con un grupo NUEVO que ya está "concluido"
-- (terminó antes de hoy), para poder probar Materiales, Evaluaciones y Certificaciones
-- (Sprint 3, sem. 46) sin chocar con esa regla. No toca nada de lo que ya existe.
--
-- No usa IDs fijos: toma cada referencia (rol, usuario, curso, grupo, etc.) con un
-- SELECT por su dato único (correo, clave, folio...), así que corre sin importar qué
-- IDs haya asignado AUTO_INCREMENT en tu cindec_db.
--
-- Cómo usarlo: ábrelo en MySQL Workbench y ejecútalo completo (rayo ⚡). Si ya lo
-- habías corrido antes, fallará por duplicados (correo/clave/folio) — es lo esperado.
-- Después, corre "npm run contrasenas-prueba" para que Karla y Miguel también
-- puedan iniciar sesión con la contraseña de prueba.
-- =====================================================================
USE cindec_db;

START TRANSACTION;

-- ---------- Dos participantes nuevos (Karla: aprueba; Miguel: no aprueba y repite) ----------
SET @rol_participante = (SELECT id_rol FROM rol WHERE nombre = 'Participante');

INSERT INTO usuario (id_rol, nombre, apellidos, correo, contrasena_hash) VALUES
  (@rol_participante, 'Karla',  'Medina Flores', 'karla@ejemplo.com',  CONCAT('$2b$10$', REPEAT('x', 53))),
  (@rol_participante, 'Miguel', 'Ortega Ruiz',   'miguel@ejemplo.com', CONCAT('$2b$10$', REPEAT('x', 53)));

SET @usuario_karla  = (SELECT id_usuario FROM usuario WHERE correo = 'karla@ejemplo.com');
SET @usuario_miguel = (SELECT id_usuario FROM usuario WHERE correo = 'miguel@ejemplo.com');
SET @instructor     = (SELECT id_usuario FROM usuario WHERE correo = 'instructor@ejemplo.com');
SET @evaluador      = (SELECT id_usuario FROM usuario WHERE correo = 'evaluadora@ejemplo.com');
SET @curso1         = (SELECT id_curso   FROM curso   WHERE nombre = 'Asesor inmobiliario');

-- ---------- Un grupo YA CONCLUIDO del mismo curso, para poder evaluar de inmediato ----------
INSERT INTO grupo (id_curso, id_instructor, id_evaluador, clave, fecha_inicio, fecha_fin, cupo, modalidad, estatus) VALUES
  (@curso1, @instructor, @evaluador, 'G-2026-03', '2026-09-21', '2026-10-02', 20, 'presencial', 'concluido');

SET @grupo3 = (SELECT id_grupo FROM grupo WHERE clave = 'G-2026-03');

INSERT INTO sesion (id_grupo, fecha, hora_inicio, hora_fin, tema) VALUES
  (@grupo3, '2026-09-21', '09:00', '13:00', 'Introducción al estándar'),
  (@grupo3, '2026-09-28', '09:00', '13:00', 'Práctica de atención al cliente');

SET @sesion1 = (SELECT id_sesion FROM sesion WHERE id_grupo = @grupo3 AND fecha = '2026-09-21');
SET @sesion2 = (SELECT id_sesion FROM sesion WHERE id_grupo = @grupo3 AND fecha = '2026-09-28');

INSERT INTO participante (id_usuario, id_curso_interes, telefono, curp, empresa_procedencia, origen_registro) VALUES
  (@usuario_karla,  @curso1, '4771230001', 'MEFK000229MGTDLR07', 'Despacho Jurídico Ejemplo', 'autorregistro'),
  (@usuario_miguel, @curso1, '4771230002', 'OERM950923HGTRZG03', NULL,                        'alta_coordinador');

SET @participante_karla  = (SELECT id_participante FROM participante WHERE id_usuario = @usuario_karla);
SET @participante_miguel = (SELECT id_participante FROM participante WHERE id_usuario = @usuario_miguel);

INSERT INTO inscripcion (id_participante, id_grupo, estatus) VALUES
  (@participante_karla,  @grupo3, 'capacitacion_concluida'),
  (@participante_miguel, @grupo3, 'capacitacion_concluida');

SET @inscripcion_karla  = (SELECT id_inscripcion FROM inscripcion WHERE id_participante = @participante_karla  AND id_grupo = @grupo3);
SET @inscripcion_miguel = (SELECT id_inscripcion FROM inscripcion WHERE id_participante = @participante_miguel AND id_grupo = @grupo3);

INSERT INTO asistencia (id_inscripcion, id_sesion, asistio) VALUES
  (@inscripcion_karla,  @sesion1, TRUE),
  (@inscripcion_karla,  @sesion2, TRUE),
  (@inscripcion_miguel, @sesion1, TRUE),
  (@inscripcion_miguel, @sesion2, FALSE);

-- ---------- Módulo Aprendizaje: dos materiales nuevos del mismo curso ----------
SET @orden_siguiente = (SELECT COALESCE(MAX(orden), 0) + 1 FROM material WHERE id_curso = @curso1);

INSERT INTO material (id_curso, titulo, tipo, ruta_archivo, url_video, orden) VALUES
  (@curso1, 'Checklist de cierre de visita',        'ejercicio',     'uploads/materiales/checklist-cierre.pdf', NULL, @orden_siguiente),
  (@curso1, 'Presentación: objeciones frecuentes',  'presentacion',  'uploads/materiales/objeciones.pptx',      NULL, @orden_siguiente + 1);

SET @material1 = (SELECT id_material FROM material WHERE id_curso = @curso1 AND titulo = 'Checklist de cierre de visita');
SET @material2 = (SELECT id_material FROM material WHERE id_curso = @curso1 AND titulo = 'Presentación: objeciones frecuentes');

INSERT INTO consulta_material (id_participante, id_material) VALUES
  (@participante_karla,  @material1),
  (@participante_karla,  @material2),
  (@participante_miguel, @material1);

-- ---------- Módulo Evaluaciones: reutiliza la evaluación de EC0110.02 de 08-datos-prueba.sql ----------
SET @evaluacion1 = (SELECT id_evaluacion FROM evaluacion WHERE nombre = 'Evaluación EC0110.02');

-- Karla: aprueba al primer intento. Miguel: no aprueba y tiene un segundo intento pendiente.
INSERT INTO intento_evaluacion (id_inscripcion, id_evaluacion, id_evaluador, numero_intento, fecha_aplicacion, calificacion, estatus, dictamen, observaciones) VALUES
  (@inscripcion_karla,  @evaluacion1, @evaluador, 1, '2026-10-05', 97.00, 'aprobada',    'competente',            NULL),
  (@inscripcion_miguel, @evaluacion1, @evaluador, 1, '2026-10-05', 80.00, 'no_aprobada', 'todavia_no_competente', 'No cubrió el criterio de manejo de objeciones.'),
  (@inscripcion_miguel, @evaluacion1, NULL,        2, '2026-11-02', NULL,  'pendiente',   NULL,                    'Segundo intento programado; en espera de evaluador.');

SET @intento_karla   = (SELECT id_intento FROM intento_evaluacion WHERE id_inscripcion = @inscripcion_karla  AND numero_intento = 1);
SET @intento_miguel1 = (SELECT id_intento FROM intento_evaluacion WHERE id_inscripcion = @inscripcion_miguel AND numero_intento = 1);
SET @intento_miguel2 = (SELECT id_intento FROM intento_evaluacion WHERE id_inscripcion = @inscripcion_miguel AND numero_intento = 2);

INSERT INTO evidencia (id_intento, descripcion, ruta_archivo) VALUES
  (@intento_karla,   'Guía de observación firmada por la evaluadora',             'uploads/evidencias/karla/guia.pdf'),
  (@intento_miguel1, 'Lista de cotejo con áreas de oportunidad marcadas',         'uploads/evidencias/miguel/lista.pdf');

-- ---------- Módulo Certificaciones: trámite completo de Karla, hasta el documento emitido ----------
INSERT INTO tramite_certificacion (id_intento, folio_interno, fecha_solicitud, estatus) VALUES
  (@intento_karla, 'CINDEC-2026-0002', '2026-10-06', 'emitido');

SET @tramite_karla = (SELECT id_tramite FROM tramite_certificacion WHERE folio_interno = 'CINDEC-2026-0002');

INSERT INTO historial_tramite (id_tramite, estatus, fecha_cambio, observaciones) VALUES
  (@tramite_karla, 'solicitado', '2026-10-06 10:00:00', 'Solicitud registrada ante CONOCER'),
  (@tramite_karla, 'pagado',     '2026-10-08 12:00:00', 'Pago confirmado por la participante'),
  (@tramite_karla, 'en_tramite', '2026-10-10 09:00:00', 'CONOCER procesando el certificado'),
  (@tramite_karla, 'emitido',    '2026-10-15 16:00:00', 'Certificado recibido de CONOCER');

INSERT INTO documento_certificacion (id_tramite, folio_conocer, tipo_documento, fecha_emision, vigencia, ruta_archivo) VALUES
  (@tramite_karla, 'CONOCER-EC0110.02-000456', 'Certificado de Competencia Laboral', '2026-10-15', NULL, 'uploads/certificados/karla-ec0110.pdf');

COMMIT;

-- ---------- Verificación: historial de Karla y Miguel, uniendo las 7 tablas del sprint ----------
SELECT u.nombre, u.apellidos, g.clave AS grupo, m.titulo AS material_consultado,
       i.numero_intento, i.calificacion, i.estatus, i.dictamen,
       t.folio_interno, t.estatus AS tramite, d.folio_conocer
FROM usuario u
JOIN participante p            ON p.id_usuario = u.id_usuario
JOIN inscripcion ins            ON ins.id_participante = p.id_participante
JOIN grupo g                    ON g.id_grupo = ins.id_grupo
LEFT JOIN consulta_material cm  ON cm.id_participante = p.id_participante
LEFT JOIN material m            ON m.id_material = cm.id_material
JOIN intento_evaluacion i       ON i.id_inscripcion = ins.id_inscripcion
LEFT JOIN tramite_certificacion t    ON t.id_intento = i.id_intento
LEFT JOIN documento_certificacion d  ON d.id_tramite = t.id_tramite
WHERE g.clave = 'G-2026-03'
ORDER BY u.apellidos, i.numero_intento, m.titulo;
