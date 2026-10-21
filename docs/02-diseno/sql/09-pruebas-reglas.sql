-- =====================================================================
-- CINDEC · Diseño físico · Paso 7B: pruebas de las reglas
-- Servidor: MySQL 8.0 · Base de datos: cindec_db · Requiere: 08-datos-prueba.sql
-- Ejecutar UNA POR UNA (Ctrl + Enter). Las pruebas 1 a 8 DEBEN FALLAR:
-- el error es la prueba de que la regla funciona. La 9 debe funcionar.
-- =====================================================================
USE cindec_db;

-- 1. UNIQUE: correo repetido.                      Esperado: Error 1062 Duplicate entry
INSERT INTO usuario (id_rol, nombre, apellidos, correo, contrasena_hash)
VALUES (5, 'Otra', 'Ana', 'ana@ejemplo.com', CONCAT('$2b$10$', REPEAT('x', 53)));

-- 2. FOREIGN KEY: rol que no existe.               Esperado: Error 1452 Cannot add or update a child row
INSERT INTO usuario (id_rol, nombre, apellidos, correo, contrasena_hash)
VALUES (99, 'Rol', 'Inexistente', 'rol99@ejemplo.com', CONCAT('$2b$10$', REPEAT('x', 53)));

-- 3. ON DELETE RESTRICT: borrar un rol con usuarios. Esperado: Error 1451 Cannot delete or update a parent row
DELETE FROM rol WHERE id_rol = 5;

-- 4. CHECK: grupo que termina antes de empezar.   Esperado: Error 3819 Check constraint 'ck_grupo_fechas' is violated
INSERT INTO grupo (id_curso, clave, fecha_inicio, fecha_fin, cupo, modalidad)
VALUES (1, 'G-PRUEBA', '2026-12-10', '2026-12-01', 10, 'presencial');

-- 5. CHECK: calificación de 150.                  Esperado: Error 3819 Check constraint 'ck_intento_calificacion' is violated
UPDATE intento_evaluacion SET calificacion = 150, estatus = 'aprobada' WHERE id_intento = 3;

-- 6. CHECK: aprobada sin calificación.            Esperado: Error 3819 Check constraint 'ck_intento_estatus' is violated
UPDATE intento_evaluacion SET estatus = 'aprobada' WHERE id_intento = 3;

-- 7. UNIQUE de dos columnas: inscribir dos veces a Ana en el grupo 1.  Esperado: Error 1062 Duplicate entry
INSERT INTO inscripcion (id_participante, id_grupo) VALUES (1, 1);

-- 8. ENUM: modalidad que no está en la lista.     Esperado: Error 1265 Data truncated for column 'modalidad'
UPDATE grupo SET modalidad = 'virtual' WHERE id_grupo = 2;

-- 9. ON DELETE CASCADE (esta SÍ debe funcionar):
--    se crea un usuario temporal con un token; al borrar el usuario, su token se borra solo.
INSERT INTO usuario (id_usuario, id_rol, nombre, apellidos, correo, contrasena_hash)
VALUES (7, 5, 'Temporal', 'Prueba', 'temporal@ejemplo.com', CONCAT('$2b$10$', REPEAT('x', 53)));
INSERT INTO token_recuperacion (id_usuario, token_hash, fecha_expiracion)
VALUES (7, REPEAT('a', 64), '2026-12-31 23:59:59');
SELECT COUNT(*) AS tokens_antes FROM token_recuperacion WHERE id_usuario = 7;   -- 1
DELETE FROM usuario WHERE id_usuario = 7;
SELECT COUNT(*) AS tokens_despues FROM token_recuperacion WHERE id_usuario = 7; -- 0
