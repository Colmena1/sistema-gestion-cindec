-- =====================================================================
-- CINDEC · Diseño físico · Paso 7A: datos de prueba
-- Servidor: MySQL 8.0 · Base de datos: cindec_db
-- TODOS los datos son FICTICIOS (personas, CURP, correos, folios).
-- Los id se escriben a mano solo para que las pruebas sean fáciles de seguir;
-- en el sistema real MySQL los numera solo (AUTO_INCREMENT).
-- Orden: igual que la creación de tablas (padres primero).
-- =====================================================================
USE cindec_db;

-- ---------- Módulo Usuarios ----------
INSERT INTO rol (id_rol, nombre, descripcion) VALUES
  (1, 'Administrador general',       'Control total de la plataforma'),
  (2, 'Coordinador de capacitación', 'Administra grupos, participantes y asistencia'),
  (3, 'Instructor',                  'Gestiona materiales y asistencia de sus grupos'),
  (4, 'Evaluador',                   'Registra evidencias y resultados de evaluación'),
  (5, 'Participante',                'Consulta sus cursos, evaluaciones y documentos');

-- contrasena_hash: texto de relleno de 60 caracteres (en el sistema real lo genera bcrypt).
INSERT INTO usuario (id_usuario, id_rol, nombre, apellidos, correo, contrasena_hash) VALUES
  (1, 1, 'Admin',  'Prueba Uno',    'admin@ejemplo.com',       CONCAT('$2b$10$', REPEAT('x', 53))),
  (2, 2, 'Carla',  'Coordinadora Prueba', 'coordinacion@ejemplo.com', CONCAT('$2b$10$', REPEAT('x', 53))),
  (3, 3, 'Iván',   'Instructor Prueba',   'instructor@ejemplo.com',   CONCAT('$2b$10$', REPEAT('x', 53))),
  (4, 4, 'Elena',  'Evaluadora Prueba',   'evaluadora@ejemplo.com',   CONCAT('$2b$10$', REPEAT('x', 53))),
  (5, 5, 'Ana',    'López Ruiz',    'ana@ejemplo.com',         CONCAT('$2b$10$', REPEAT('x', 53))),
  (6, 5, 'Luis',   'Pérez Gómez',   'luis@ejemplo.com',        CONCAT('$2b$10$', REPEAT('x', 53)));

INSERT INTO auditoria (id_usuario, accion, entidad_afectada, id_registro_afectado, detalle) VALUES
  (1, 'crear', 'usuario', 2, 'Alta de la coordinadora de prueba');

-- ---------- Módulo Cursos y participantes ----------
INSERT INTO estandar_competencia (id_estandar, codigo, nombre) VALUES
  (1, 'EC0110.02', 'Asesoría en comercialización de bienes inmuebles'),
  (2, 'EC0903.02', 'Promoción especializada de crédito de vivienda');

INSERT INTO curso (id_curso, id_estandar, nombre) VALUES
  (1, 1, 'Asesor inmobiliario'),
  (2, 2, 'Promotor de crédito de vivienda');

-- El grupo 2 todavía no tiene instructor ni evaluador (NULL): está "planeado".
INSERT INTO grupo (id_grupo, id_curso, id_instructor, id_evaluador, clave, fecha_inicio, fecha_fin, cupo, modalidad, enlace_videoconferencia) VALUES
  (1, 1, 3,    4,    'G-2026-01', '2026-11-03', '2026-11-14', 20, 'presencial', NULL),
  (2, 2, NULL, NULL, 'G-2026-02', '2026-11-17', '2026-11-28', 15, 'en_linea',   'https://meet.ejemplo.com/g-2026-02');

INSERT INTO sesion (id_sesion, id_grupo, fecha, hora_inicio, hora_fin, tema) VALUES
  (1, 1, '2026-11-03', '09:00', '13:00', 'Introducción al estándar'),
  (2, 1, '2026-11-05', '09:00', '13:00', 'Práctica de atención al cliente');

INSERT INTO participante (id_participante, id_usuario, id_curso_interes, telefono, curp, empresa_procedencia, origen_registro) VALUES
  (1, 5, 1, '4771234567', 'PRUE900101MGTAAA01', 'Inmobiliaria Ejemplo', 'autorregistro'),
  (2, 6, 1, '4777654321', 'PRUE910202HGTBBB02', NULL,                   'alta_coordinador');

INSERT INTO documento_participante (id_participante, tipo_documento, nombre_archivo, ruta_archivo) VALUES
  (1, 'ine',            'ine_ana.pdf',   'uploads/participantes/1/ine.pdf'),
  (1, 'ficha_registro', 'ficha_ana.pdf', 'uploads/participantes/1/ficha.pdf');

INSERT INTO inscripcion (id_inscripcion, id_participante, id_grupo) VALUES
  (1, 1, 1),
  (2, 2, 1);

INSERT INTO asistencia (id_inscripcion, id_sesion, asistio) VALUES
  (1, 1, TRUE),
  (2, 1, FALSE);

-- ---------- Módulo Aprendizaje ----------
INSERT INTO material (id_material, id_curso, titulo, tipo, ruta_archivo, url_video, orden) VALUES
  (1, 1, 'Manual del participante', 'manual', 'uploads/materiales/1/manual.pdf', NULL, 1),
  (2, 1, 'Video: primera cita con el cliente', 'video', NULL, 'https://video.ejemplo.com/cita', 2);

INSERT INTO consulta_material (id_participante, id_material) VALUES
  (1, 1);

-- ---------- Módulo Evaluaciones ----------
INSERT INTO evaluacion (id_evaluacion, id_estandar, nombre, tipo_instrumento, calificacion_minima) VALUES
  (1, 1, 'Evaluación EC0110.02', 'guia_observacion', 95.00),
  (2, 2, 'Evaluación EC0903.02', 'cuestionario',     97.00);

-- Ana: intento 1 no aprobado, intento 2 aprobado y competente. Luis: intento pendiente.
INSERT INTO intento_evaluacion (id_intento, id_inscripcion, id_evaluacion, id_evaluador, numero_intento, fecha_aplicacion, calificacion, estatus, dictamen) VALUES
  (1, 1, 1, 4,    1, '2026-11-14', 90.00, 'no_aprobada', 'todavia_no_competente'),
  (2, 1, 1, 4,    2, '2026-11-21', 97.00, 'aprobada',    'competente'),
  (3, 2, 1, NULL, 1, '2026-11-14', NULL,  'pendiente',   NULL);

INSERT INTO evidencia (id_intento, descripcion, ruta_archivo) VALUES
  (2, 'Guía de observación firmada por la evaluadora', 'uploads/evidencias/2/guia.pdf');

-- ---------- Módulo Certificaciones ----------
INSERT INTO tramite_certificacion (id_tramite, id_intento, folio_interno, fecha_solicitud) VALUES
  (1, 2, 'CINDEC-2026-0001', '2026-11-24');

INSERT INTO historial_tramite (id_tramite, estatus, observaciones) VALUES
  (1, 'solicitado', 'Solicitud registrada ante CONOCER');

-- ---------- Verificación: el historial de Ana, uniendo 6 tablas ----------
SELECT u.nombre, u.apellidos, g.clave AS grupo, c.nombre AS curso, e.codigo AS estandar,
       i.numero_intento, i.calificacion, i.estatus, i.dictamen, t.folio_interno, t.estatus AS tramite
FROM usuario u
JOIN participante p          ON p.id_usuario = u.id_usuario
JOIN inscripcion ins         ON ins.id_participante = p.id_participante
JOIN grupo g                 ON g.id_grupo = ins.id_grupo
JOIN curso c                 ON c.id_curso = g.id_curso
JOIN estandar_competencia e  ON e.id_estandar = c.id_estandar
JOIN intento_evaluacion i    ON i.id_inscripcion = ins.id_inscripcion
LEFT JOIN tramite_certificacion t ON t.id_intento = i.id_intento
ORDER BY u.apellidos, i.numero_intento;
