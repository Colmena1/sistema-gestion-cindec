-- =====================================================================
-- CINDEC · Diseño físico · Paso 4: tablas del módulo Evaluaciones
-- Servidor: MySQL 8.0 · Base de datos: cindec_db
-- Requiere: 02 (usuario), 03 (estandar_competencia, inscripcion)
-- =====================================================================
USE cindec_db;

-- ---------------------------------------------------------------------
-- Tabla: evaluacion
-- Instrumento de evaluación de un estándar, con su calificación mínima (RF-EVA-01, 04).
-- Tipos de instrumento: Manual del participante CONOCER, pp. 53-54.
-- ---------------------------------------------------------------------
CREATE TABLE evaluacion (
  id_evaluacion        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  id_estandar          INT UNSIGNED  NOT NULL,
  nombre               VARCHAR(150)  NOT NULL,
  descripcion          TEXT          NULL,
  tipo_instrumento     ENUM('guia_observacion','lista_cotejo','cuestionario') NOT NULL,
  calificacion_minima  DECIMAL(5,2)  NOT NULL,                  -- p. ej. 95.00 (depende del estándar)
  activa               BOOLEAN       NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_evaluacion          PRIMARY KEY (id_evaluacion),
  CONSTRAINT ck_evaluacion_minima   CHECK (calificacion_minima BETWEEN 0 AND 100),
  CONSTRAINT fk_evaluacion_estandar FOREIGN KEY (id_estandar) REFERENCES estandar_competencia (id_estandar)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: intento_evaluacion
-- Cada vez que un participante presenta una evaluación (RF-EVA-02 a 05, RF-CERT-01).
-- Un reintento es una fila NUEVA: nunca se sobrescribe un intento anterior.
-- estatus = excepción documentada en la normalización (se guarda el resultado del día).
-- ---------------------------------------------------------------------
CREATE TABLE intento_evaluacion (
  id_intento        INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  id_inscripcion    INT UNSIGNED      NOT NULL,
  id_evaluacion     INT UNSIGNED      NOT NULL,
  id_evaluador      INT UNSIGNED      NULL,                     -- vacío mientras está "pendiente"
  numero_intento    SMALLINT UNSIGNED NOT NULL,                 -- 1, 2, 3...
  fecha_aplicacion  DATE              NOT NULL,
  calificacion      DECIMAL(5,2)      NULL,                     -- vacía mientras está "pendiente"
  estatus           ENUM('pendiente','aprobada','no_aprobada') NOT NULL DEFAULT 'pendiente',
  dictamen          ENUM('competente','todavia_no_competente') NULL,   -- término oficial CONOCER
  observaciones     TEXT              NULL,
  CONSTRAINT pk_intento_evaluacion  PRIMARY KEY (id_intento),
  CONSTRAINT uq_intento_numero      UNIQUE (id_inscripcion, id_evaluacion, numero_intento),
  CONSTRAINT ck_intento_numero      CHECK (numero_intento >= 1),
  CONSTRAINT ck_intento_calificacion CHECK (calificacion BETWEEN 0 AND 100),
  -- pendiente <=> sin calificación
  CONSTRAINT ck_intento_estatus     CHECK ((estatus = 'pendiente' AND calificacion IS NULL)
                                        OR (estatus <> 'pendiente' AND calificacion IS NOT NULL)),
  -- no hay dictamen sin haber evaluado
  CONSTRAINT ck_intento_dictamen    CHECK (dictamen IS NULL OR estatus <> 'pendiente'),
  CONSTRAINT fk_intento_inscripcion FOREIGN KEY (id_inscripcion) REFERENCES inscripcion (id_inscripcion)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_intento_evaluacion  FOREIGN KEY (id_evaluacion) REFERENCES evaluacion (id_evaluacion)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_intento_evaluador   FOREIGN KEY (id_evaluador) REFERENCES usuario (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: evidencia
-- Archivo o descripción que respalda un intento (RF-EVA-02). Al menos uno de los dos.
-- ---------------------------------------------------------------------
CREATE TABLE evidencia (
  id_evidencia  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_intento    INT UNSIGNED NOT NULL,
  descripcion   TEXT         NULL,
  ruta_archivo  VARCHAR(255) NULL,
  fecha_carga   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_evidencia           PRIMARY KEY (id_evidencia),
  CONSTRAINT ck_evidencia_contenido CHECK (descripcion IS NOT NULL OR ruta_archivo IS NOT NULL),
  CONSTRAINT fk_evidencia_intento   FOREIGN KEY (id_intento) REFERENCES intento_evaluacion (id_intento)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;
