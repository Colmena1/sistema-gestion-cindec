-- =====================================================================
-- CINDEC · Diseño físico · Paso 4: tablas del módulo Usuarios
-- Servidor: MySQL 8.0 · Base de datos: cindec_db
-- Orden: primero las tablas "padre" (rol) y después las que dependen de ellas.
-- =====================================================================
USE cindec_db;

-- ---------------------------------------------------------------------
-- Tabla: rol
-- Catálogo de los 5 roles de V1 (RF-USR-02).
-- ---------------------------------------------------------------------
CREATE TABLE rol (
  id_rol       INT UNSIGNED NOT NULL AUTO_INCREMENT,  -- identificador, lo numera MySQL
  nombre       VARCHAR(50)  NOT NULL,                 -- p. ej. 'Administrador general'
  descripcion  TEXT         NULL,                     -- opcional
  CONSTRAINT pk_rol         PRIMARY KEY (id_rol),
  CONSTRAINT uq_rol_nombre  UNIQUE (nombre)           -- no puede haber dos roles con el mismo nombre
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: usuario
-- Toda persona que entra al sistema (RF-USR-01, 04, 05). Un rol por usuario.
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
  id_usuario       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_rol           INT UNSIGNED NOT NULL,                       -- FK: mismo tipo que rol.id_rol
  nombre           VARCHAR(100) NOT NULL,
  apellidos        VARCHAR(100) NOT NULL,
  correo           VARCHAR(254) NOT NULL,                       -- 254 = largo máximo de un correo
  contrasena_hash  CHAR(60)     NOT NULL,                       -- hash de bcrypt: siempre 60 caracteres
  activo           BOOLEAN      NOT NULL DEFAULT TRUE,          -- se desactiva en vez de borrar
  fecha_registro   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso    DATETIME     NULL,                           -- vacío hasta su primer inicio de sesión
  CONSTRAINT pk_usuario         PRIMARY KEY (id_usuario),
  CONSTRAINT uq_usuario_correo  UNIQUE (correo),
  CONSTRAINT fk_usuario_rol     FOREIGN KEY (id_rol) REFERENCES rol (id_rol)
    ON DELETE RESTRICT                                          -- no se borra un rol que tenga usuarios
    ON UPDATE CASCADE                                           -- si cambiara el id del rol, se actualiza aquí
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: token_recuperacion
-- Enlace de un solo uso para restablecer la contraseña (RF-USR-06).
-- Es un dato temporal: si se borra el usuario, sus tokens se borran con él (CASCADE).
-- ---------------------------------------------------------------------
CREATE TABLE token_recuperacion (
  id_token          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario        INT UNSIGNED NOT NULL,
  token_hash        CHAR(64)     NOT NULL,                      -- hash SHA-256 del token: 64 caracteres
  fecha_expiracion  DATETIME     NOT NULL,
  usado             BOOLEAN      NOT NULL DEFAULT FALSE,
  CONSTRAINT pk_token_recuperacion  PRIMARY KEY (id_token),
  CONSTRAINT uq_token_hash          UNIQUE (token_hash),        -- el backend busca el token por su hash
  CONSTRAINT fk_token_usuario       FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: auditoria
-- Bitácora de operaciones sensibles: quién, cuándo, qué y sobre qué registro (RNF-07).
-- entidad_afectada + id_registro_afectado NO llevan FK a propósito: pueden apuntar a cualquier tabla.
-- ---------------------------------------------------------------------
CREATE TABLE auditoria (
  id_auditoria          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario            INT UNSIGNED NOT NULL,
  fecha_hora            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accion                VARCHAR(50)  NOT NULL,                  -- p. ej. 'crear', 'modificar', 'desactivar'
  entidad_afectada      VARCHAR(64)  NOT NULL,                  -- nombre de la tabla (64 = máximo en MySQL)
  id_registro_afectado  INT UNSIGNED NOT NULL,
  detalle               TEXT         NULL,
  CONSTRAINT pk_auditoria          PRIMARY KEY (id_auditoria),
  CONSTRAINT fk_auditoria_usuario  FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;
