-- =====================================================================
-- CINDEC · Diseño físico · Paso 4: tablas del módulo Cursos, grupos y participantes
-- Servidor: MySQL 8.0 · Base de datos: cindec_db
-- Requiere: 02-modulo-usuarios.sql (las FK a usuario)
-- Orden: estandar_competencia → curso → grupo → sesion → participante
--        → documento_participante → inscripcion → asistencia
-- =====================================================================
USE cindec_db;

-- ---------------------------------------------------------------------
-- Tabla: estandar_competencia
-- Estándares de CONOCER que CINDEC evalúa (p. ej. EC0110.02).
-- ---------------------------------------------------------------------
CREATE TABLE estandar_competencia (
  id_estandar  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo       VARCHAR(20)  NOT NULL,                  -- p. ej. 'EC0110.02'
  nombre       VARCHAR(255) NOT NULL,                  -- los nombres oficiales son largos
  descripcion  TEXT         NULL,
  activo       BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_estandar_competencia  PRIMARY KEY (id_estandar),
  CONSTRAINT uq_estandar_codigo       UNIQUE (codigo)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: curso
-- Plantilla: QUÉ se enseña. Sin fechas ni cupo (eso es del grupo). RF-CUR-01.
-- ---------------------------------------------------------------------
CREATE TABLE curso (
  id_curso     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_estandar  INT UNSIGNED NOT NULL,                  -- un curso se basa en un estándar
  nombre       VARCHAR(150) NOT NULL,
  descripcion  TEXT         NULL,
  activo       BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_curso           PRIMARY KEY (id_curso),
  CONSTRAINT fk_curso_estandar  FOREIGN KEY (id_estandar) REFERENCES estandar_competencia (id_estandar)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: grupo
-- Oferta concreta de un curso: CUÁNDO, CON QUIÉN y con qué CUPO (RF-CUR-02, 05, 08, 09).
-- El cupo disponible NO se guarda: se calcula (cupo - inscripciones activas).
-- El horario NO se guarda: se obtiene de las sesiones (normalización).
-- ---------------------------------------------------------------------
CREATE TABLE grupo (
  id_grupo                 INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  id_curso                 INT UNSIGNED      NOT NULL,
  id_instructor            INT UNSIGNED      NULL,                -- vacío mientras el grupo está "planeado"
  id_evaluador             INT UNSIGNED      NULL,                -- igual
  clave                    VARCHAR(20)       NOT NULL,            -- p. ej. 'G-2026-01'
  fecha_inicio             DATE              NOT NULL,
  fecha_fin                DATE              NOT NULL,
  cupo                     SMALLINT UNSIGNED NOT NULL,
  modalidad                ENUM('presencial','en_linea','mixta') NOT NULL,
  estatus                  ENUM('planeado','en_curso','concluido','cancelado') NOT NULL DEFAULT 'planeado',
  enlace_videoconferencia  VARCHAR(500)      NULL,                -- solo en línea / mixta
  CONSTRAINT pk_grupo             PRIMARY KEY (id_grupo),
  CONSTRAINT uq_grupo_clave       UNIQUE (clave),
  CONSTRAINT ck_grupo_fechas      CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT ck_grupo_cupo        CHECK (cupo > 0),
  CONSTRAINT fk_grupo_curso       FOREIGN KEY (id_curso)      REFERENCES curso (id_curso)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_grupo_instructor  FOREIGN KEY (id_instructor) REFERENCES usuario (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_grupo_evaluador   FOREIGN KEY (id_evaluador)  REFERENCES usuario (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: sesion
-- Cada clase programada de un grupo: base de la asistencia y del horario (RF-CUR-09, 10).
-- ---------------------------------------------------------------------
CREATE TABLE sesion (
  id_sesion    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_grupo     INT UNSIGNED NOT NULL,
  fecha        DATE         NOT NULL,
  hora_inicio  TIME         NOT NULL,
  hora_fin     TIME         NOT NULL,
  tema         VARCHAR(200) NULL,
  CONSTRAINT pk_sesion        PRIMARY KEY (id_sesion),
  CONSTRAINT ck_sesion_horas  CHECK (hora_fin > hora_inicio),
  CONSTRAINT fk_sesion_grupo  FOREIGN KEY (id_grupo) REFERENCES grupo (id_grupo)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: participante
-- Ficha del alumno: datos que solo tiene un usuario con rol Participante (RF-CUR-03).
-- id_usuario es UNIQUE: una cuenta tiene como máximo una ficha (relación 1 : 0..1).
-- ---------------------------------------------------------------------
CREATE TABLE participante (
  id_participante      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario           INT UNSIGNED NOT NULL,
  id_curso_interes     INT UNSIGNED NULL,                      -- curso elegido al registrarse (opcional)
  telefono             VARCHAR(15)  NOT NULL,
  curp                 CHAR(18)     NOT NULL,                  -- la CURP siempre mide 18 caracteres
  empresa_procedencia  VARCHAR(150) NULL,                      -- "información laboral" de la ficha CONOCER (opcional)
  origen_registro      ENUM('autorregistro','alta_coordinador') NOT NULL,
  CONSTRAINT pk_participante          PRIMARY KEY (id_participante),
  CONSTRAINT uq_participante_usuario  UNIQUE (id_usuario),
  CONSTRAINT uq_participante_curp     UNIQUE (curp),
  CONSTRAINT ck_participante_curp     CHECK (CHAR_LENGTH(curp) = 18),
  CONSTRAINT fk_participante_usuario  FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_participante_curso    FOREIGN KEY (id_curso_interes) REFERENCES curso (id_curso)
    ON DELETE SET NULL ON UPDATE CASCADE                       -- si el curso desaparece, solo se vacía este dato
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: documento_participante
-- Documentos que entrega el participante (Manual del participante CONOCER, pp. 35-36).
-- El archivo vive en la carpeta uploads/; aquí solo se guarda su ruta.
-- ---------------------------------------------------------------------
CREATE TABLE documento_participante (
  id_documento     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_participante  INT UNSIGNED NOT NULL,
  tipo_documento   ENUM('ine','cartilla_militar','cedula_profesional','pasaporte',
                        'fotografia','ficha_registro','identificacion_tutor') NOT NULL,
  nombre_archivo   VARCHAR(255) NOT NULL,                      -- nombre original, p. ej. 'ine_juan.pdf'
  ruta_archivo     VARCHAR(255) NOT NULL,                      -- dónde quedó guardado en el servidor
  fecha_carga      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_documento_participante  PRIMARY KEY (id_documento),
  CONSTRAINT fk_documento_participante  FOREIGN KEY (id_participante) REFERENCES participante (id_participante)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: inscripcion
-- Un participante dentro de un grupo: resuelve la relación muchos-a-muchos (RF-CUR-04, 06).
-- UNIQUE (id_participante, id_grupo): nadie se inscribe dos veces al mismo grupo.
-- El control de CUPO lo hace el backend (una FK o un CHECK no pueden contar filas).
-- ---------------------------------------------------------------------
CREATE TABLE inscripcion (
  id_inscripcion     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_participante    INT UNSIGNED NOT NULL,
  id_grupo           INT UNSIGNED NOT NULL,
  fecha_inscripcion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estatus            ENUM('inscrito','capacitacion_concluida','baja') NOT NULL DEFAULT 'inscrito',
  es_refuerzo        BOOLEAN      NOT NULL DEFAULT FALSE,           -- recursa el curso como refuerzo (RF-EVA-04)
  CONSTRAINT pk_inscripcion                PRIMARY KEY (id_inscripcion),
  CONSTRAINT uq_inscripcion_participante_grupo  UNIQUE (id_participante, id_grupo),
  CONSTRAINT fk_inscripcion_participante   FOREIGN KEY (id_participante) REFERENCES participante (id_participante)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_inscripcion_grupo          FOREIGN KEY (id_grupo) REFERENCES grupo (id_grupo)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: asistencia
-- Si un inscrito asistió o no a una sesión (RF-CUR-10).
-- UNIQUE (id_inscripcion, id_sesion): una sola marca de asistencia por persona y sesión.
-- Que la sesión sea del mismo grupo de la inscripción lo valida el backend.
-- ---------------------------------------------------------------------
CREATE TABLE asistencia (
  id_asistencia   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_inscripcion  INT UNSIGNED NOT NULL,
  id_sesion       INT UNSIGNED NOT NULL,
  asistio         BOOLEAN      NOT NULL,
  observaciones   TEXT         NULL,
  CONSTRAINT pk_asistencia                  PRIMARY KEY (id_asistencia),
  CONSTRAINT uq_asistencia_inscripcion_sesion  UNIQUE (id_inscripcion, id_sesion),
  CONSTRAINT fk_asistencia_inscripcion      FOREIGN KEY (id_inscripcion) REFERENCES inscripcion (id_inscripcion)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_asistencia_sesion           FOREIGN KEY (id_sesion) REFERENCES sesion (id_sesion)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;
