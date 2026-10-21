-- =====================================================================
-- Sistema Integral de Gestión de Capacitación y Certificación Digital
-- CINDEC · Diseño físico · Paso 2: crear la base de datos
-- Servidor: MySQL 8.0 (puerto 3306)
-- =====================================================================

-- Crea la base de datos solo si todavía no existe.
-- utf8mb4: guarda cualquier carácter (acentos, ñ, símbolos).
-- utf8mb4_0900_ai_ci: compara sin distinguir acentos ni mayúsculas
--   (al buscar, "jose" encuentra "José").
CREATE DATABASE IF NOT EXISTS cindec_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

-- A partir de aquí, todo se crea dentro de cindec_db.
USE cindec_db;
