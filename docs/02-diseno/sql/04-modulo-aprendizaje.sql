-- =====================================================================
-- CINDEC · Diseño físico · Paso 4: tablas del módulo Aprendizaje
-- Servidor: MySQL 8.0 · Base de datos: cindec_db
-- Requiere: 03-modulo-cursos-participantes.sql (curso, participante)
-- =====================================================================
USE cindec_db;

-- ---------------------------------------------------------------------
-- Tabla: material
-- Manual, presentación, PDF, ejercicio o video de un curso (RF-APR-01, 02).
-- Lleva un archivo (ruta_archivo) o un enlace a video (url_video): al menos uno de los dos.
-- ---------------------------------------------------------------------
CREATE TABLE material (
  id_material   INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  id_curso      INT UNSIGNED      NOT NULL,
  titulo        VARCHAR(200)      NOT NULL,
  tipo          ENUM('manual','presentacion','pdf','ejercicio','video') NOT NULL,
  ruta_archivo  VARCHAR(255)      NULL,
  url_video     VARCHAR(500)      NULL,
  orden         SMALLINT UNSIGNED NOT NULL DEFAULT 1,          -- posición en la lista del curso
  fecha_carga   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_material            PRIMARY KEY (id_material),
  CONSTRAINT ck_material_contenido  CHECK (ruta_archivo IS NOT NULL OR url_video IS NOT NULL),
  CONSTRAINT fk_material_curso      FOREIGN KEY (id_curso) REFERENCES curso (id_curso)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: consulta_material
-- Registro de que un participante abrió o descargó un material (RF-APR-03).
-- Una fila por participante y material; cada nueva consulta actualiza fecha_ultima_consulta.
-- ---------------------------------------------------------------------
CREATE TABLE consulta_material (
  id_consulta             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_participante         INT UNSIGNED NOT NULL,
  id_material             INT UNSIGNED NOT NULL,
  fecha_primera_consulta  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_ultima_consulta   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_consulta_material                 PRIMARY KEY (id_consulta),
  CONSTRAINT uq_consulta_participante_material    UNIQUE (id_participante, id_material),
  CONSTRAINT ck_consulta_fechas                   CHECK (fecha_ultima_consulta >= fecha_primera_consulta),
  CONSTRAINT fk_consulta_participante             FOREIGN KEY (id_participante) REFERENCES participante (id_participante)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_consulta_material                 FOREIGN KEY (id_material) REFERENCES material (id_material)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;
