-- =====================================================================
-- CINDEC · Diseño físico · Paso 4: tablas del módulo Certificaciones
-- Servidor: MySQL 8.0 · Base de datos: cindec_db
-- Requiere: 05-modulo-evaluaciones.sql (intento_evaluacion)
-- CONOCER emite el documento oficial; aquí solo se da seguimiento al trámite y se resguarda el PDF.
-- =====================================================================
USE cindec_db;

-- ---------------------------------------------------------------------
-- Tabla: tramite_certificacion
-- Solicitud ante CONOCER para un participante competente (RF-CERT-02, 05, 07).
-- id_intento UNIQUE: un solo trámite por intento (relación 1 : 0..1).
-- Que el intento sea "competente" lo valida el backend.
-- estatus = excepción documentada en la normalización (se actualiza junto con el historial).
-- ---------------------------------------------------------------------
CREATE TABLE tramite_certificacion (
  id_tramite       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_intento       INT UNSIGNED NOT NULL,
  folio_interno    VARCHAR(30)  NOT NULL,
  fecha_solicitud  DATE         NOT NULL,
  estatus          ENUM('solicitado','pagado','en_tramite','emitido') NOT NULL DEFAULT 'solicitado',
  CONSTRAINT pk_tramite_certificacion  PRIMARY KEY (id_tramite),
  CONSTRAINT uq_tramite_intento        UNIQUE (id_intento),
  CONSTRAINT uq_tramite_folio          UNIQUE (folio_interno),
  CONSTRAINT fk_tramite_intento        FOREIGN KEY (id_intento) REFERENCES intento_evaluacion (id_intento)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: historial_tramite
-- Cada cambio de estatus del trámite, con su fecha (RF-CERT-02, 05).
-- ---------------------------------------------------------------------
CREATE TABLE historial_tramite (
  id_historial   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_tramite     INT UNSIGNED NOT NULL,
  estatus        ENUM('solicitado','pagado','en_tramite','emitido') NOT NULL,
  fecha_cambio   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observaciones  TEXT         NULL,
  CONSTRAINT pk_historial_tramite  PRIMARY KEY (id_historial),
  CONSTRAINT fk_historial_tramite  FOREIGN KEY (id_tramite) REFERENCES tramite_certificacion (id_tramite)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: documento_certificacion
-- Documento oficial emitido por CONOCER, resguardado en el sistema (RF-CERT-03, 04, 06).
-- id_tramite UNIQUE: un documento por trámite (relación 1 : 0..1).
-- El nombre del participante y el estándar NO se guardan aquí: se obtienen por las relaciones.
-- ---------------------------------------------------------------------
CREATE TABLE documento_certificacion (
  id_doc_cert            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_tramite             INT UNSIGNED NOT NULL,
  folio_conocer          VARCHAR(50)  NOT NULL,                  -- folio que asigna CONOCER
  tipo_documento         VARCHAR(100) NOT NULL,                  -- p. ej. 'Certificado de competencia laboral'
  fecha_emision          DATE         NOT NULL,
  vigencia               DATE         NULL,                      -- solo si el documento tiene vigencia
  entidad_certificacion  VARCHAR(150) NOT NULL DEFAULT 'CINDEC (ECE516-22)',
  ruta_archivo           VARCHAR(255) NOT NULL,                  -- PDF oficial en uploads/
  CONSTRAINT pk_documento_certificacion  PRIMARY KEY (id_doc_cert),
  CONSTRAINT uq_doc_cert_tramite         UNIQUE (id_tramite),
  CONSTRAINT uq_doc_cert_folio           UNIQUE (folio_conocer),
  CONSTRAINT ck_doc_cert_vigencia        CHECK (vigencia IS NULL OR vigencia >= fecha_emision),
  CONSTRAINT fk_doc_cert_tramite         FOREIGN KEY (id_tramite) REFERENCES tramite_certificacion (id_tramite)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;
