# Bitácora de avance del proyecto

Registro semanal, alineado a las semanas del cronograma (Gantt) del anteproyecto. Un bloque por semana: qué se hizo, qué se decidió, qué quedó pendiente. Se llena al final de cada semana o sprint, no de golpe al final del proyecto — esto es lo que después alimenta el Manual Técnico y el Informe Final.

Formato sugerido por entrada:

```
## Semana N (fecha inicio – fecha fin) — Fase: <fase del Gantt>

**Hecho:**
- ...

**Decisiones tomadas:**
- ...

**Pendiente / bloqueos:**
- ...

**Próxima semana:**
- ...
```

---

## Semana 36 (31-ago al 6-sep-2026) — Fase: Planeación del Proyecto → Análisis del Sistema

**Hecho:**
- Se definió y documentó el stack tecnológico del proyecto (ver `docs/00-decisiones/ADR-0001-eleccion-stack-tecnologico.md`).
- Se creó la estructura base del repositorio (`backend/`, `frontend/`, `docs/`).

**Decisiones tomadas:**
- Stack: Node.js + Express + React + MySQL (Sequelize como ORM), JWT para autenticación.
- El repositorio vive dentro de la carpeta del anteproyecto en OneDrive, como subcarpeta `sistema-gestion-cindec/`.

**Pendiente / bloqueos:**
- Inicializar Git y subir el repositorio a GitHub.
- Instalar/verificar MySQL en el equipo de desarrollo.
- Iniciar el levantamiento de requerimientos con el asesor empresarial (Juan Alexis).

**Próxima semana:**
- Levantamiento de requerimientos funcionales y no funcionales (`docs/01-requerimientos/`).

## Semana 38 (14-sep al 20-sep-2026) — Fase: Análisis del Sistema

**Hecho:**
- Entrevista de levantamiento de requerimientos realizada con CINDEC (cuestionario de 32 puntos), con respuestas muy completas.
- `requerimientos.md` reescrito y prácticamente cerrado con la información real (roles, campos de curso, proceso de evaluación/certificación, reportes).
- Hallazgo importante: CONOCER —no CINDEC— emite el documento oficial de certificación; CINDEC solo tramita y paga. El módulo de Certificaciones se redefinió como seguimiento de trámite + resguardo del documento, no como generador de constancias.

**Decisiones tomadas:**
- ADR-0002: se separa el alcance en "V1" (lo que se entrega en la residencia, `requerimientos.md`) y "Visión futura" (`vision-futura-cindec.md`) — CINDEC pidió una plataforma SaaS multiempresa completa (portal por empresa, verificación pública QR, WhatsApp, pagos, aulas virtuales) que excede la Limitación ya aprobada de "multiempresa/nube = trabajo futuro" y no es viable con el tiempo de desarrollo restante (8 semanas hasta fin de Desarrollo, semana 46).
- Se agregó notificaciones por correo (RF-NOT-01) al alcance V1; WhatsApp queda en Visión futura por depender de un servicio de terceros de pago.

**Pendiente / bloqueos:**
- Comunicar a Juan Alexis el corte de alcance V1 vs Visión futura antes de avanzar a Diseño (Action Item de ADR-0002).
- Resolver los 2-3 `[VALIDAR]` de bajo riesgo que quedaron en `requerimientos.md`.
- Confirmar con el asesor académico si el hallazgo de CONOCER como emisor amerita algún ajuste en el anteproyecto ya aprobado.

**Próxima semana:**
- Cerrar Análisis (semana 39) y arrancar `docs/02-diseno/`: arquitectura, modelo entidad-relación, diagramas UML, prototipos.

## Semana 40 (28-sep al 4-oct-2026) — Fase: Análisis del Sistema

**Hecho:**
- Se construyó el ERS (Especificación de Requisitos de Software, formato IEEE 830) en `docs/01-requerimientos/ERS-CINDEC.docx`, consolidando `requerimientos.md`, el anteproyecto y `vision-futura-cindec.md`.
- Reunión con el asesor académico para validar el hallazgo de CONOCER como emisor del certificado y el formato de entregables.

**Decisiones tomadas:**
- Se retira por completo el rol "Empresa cliente" de V1 (ni siquiera la versión acotada de solo consulta) por restricción de tiempo de desarrollo. V1 queda con cinco roles. El rol completo se traslada íntegramente a `vision-futura-cindec.md`. Se actualizaron `requerimientos.md` (RF-USR-02, RF-REP-01, casos de uso) y el ERS en consecuencia.

**Pendiente / bloqueos:**
- Regenerar y re-entregar `ERS-CINDEC.docx` reflejando el corte del rol "Empresa cliente".
- Comunicar a Juan Alexis el corte de alcance V1 vs Visión futura (Action Item de ADR-0002, sigue abierto).
- Confirmar con el asesor académico si el hallazgo de CONOCER como emisor amerita algún ajuste en el anteproyecto ya aprobado (Action Item de ADR-0002, sigue abierto).

**Arranque de la fase de Diseño del Sistema (2026-10-01):**
- Paso 1 de 6 — Diseño de la arquitectura del sistema: terminado y aprobado (`docs/02-diseno/01-arquitectura.md`). Cliente-servidor en tres capas (React SPA → API REST Express → MySQL + almacenamiento de archivos), componentes transversales (autenticación JWT, autorización por rol, validación, auditoría, manejo de errores), convenciones de la API, diagrama de despliegue local y trazabilidad RNF → decisión. 3 figuras en `docs/02-diseno/img/`.
- ADR-0003: se adopta un monolito modular (carpetas por módulo en `backend/src/modules/`), descartando vistas en servidor y microservicios. La reorganización de carpetas se aplica al iniciar Desarrollo (semana 41).

- Paso 2 de 6 — Modelo entidad-relación: terminado y aprobado (`docs/02-diseno/02-modelo-entidad-relacion.md`, figura 4). 20 entidades, 24 relaciones; los 4 estados de RF-EVA-03 quedan en atributos distintos; el instrumento de evaluación pertenece al estándar.
- Decisiones del residente: se mantiene un rol por usuario (RF-USR-02) y un estándar por curso (RF-CUR-01), como dice el ERS.
- Paso 3 iniciado: diseño lógico con 26 llaves foráneas (`03-diseno-logico.md`, figura 5), en revisión.

**Pendiente (nuevo):**
- Preguntar a Juan Alexis en qué equipo se instalará la versión local para validación y qué cuenta de correo se usará para el SMTP.

**Próxima semana:**
- Continuar Diseño: modelo entidad-relación, diseño de BD y diccionario de datos, diagramas UML, prototipos.

## Semana 42 (12-oct al 18-oct-2026) — Fase: Diseño del Sistema

**Hecho:**
- Se resolvieron los puntos [VALIDAR] del modelo E-R con el *Manual del participante — Red de prestadores de servicios* de CONOCER entregado por CINDEC (`otros/CINDEC, Formatos.pdf`): CURP (única por participante), empresa de procedencia (opcional, "información laboral" de la ficha de registro), catálogo de documentos del participante, tipos de instrumento (guía de observación, lista de cotejo, cuestionario) y término oficial del dictamen ("Todavía no competente").
- Se corrigió `02-modelo-entidad-relacion.md`: el commit anterior había guardado por error la versión borrador del documento.
- Paso 3, parte lógica (`03-diseno-logico.md`, figura 5): aprobada por el residente.
- Paso 3, normalización (`03-2-normalizacion.md`): aprobada. Las 20 tablas cumplen 1FN, 2FN y 3FN; se eliminaron `PARTICIPANTE.fecha_registro` y `GRUPO.horario` (redundantes) y se documentaron dos excepciones: el estatus de INTENTO_EVALUACION y el de TRAMITE_CERTIFICACION. Figuras 4 y 5 actualizadas. Versión visual en `Normalizacion-BD-CINDEC.xlsx`.

**Pendiente:**
- Decidir si se registra el consentimiento para el RENAP (lo pide la ficha de registro de CONOCER); no se agregó al modelo.

**Próxima semana:**
- Paso 3: normalización y diseño físico (tipos de dato, índices, diccionario de datos).

## Semana 43 (19-oct al 25-oct-2026) — Fase: Diseño del Sistema

**Hecho:**
- Paso 3, diseño físico: la base de datos `cindec_db` se construyó en MySQL 8.0.42 (MySQL Workbench) con 9 scripts en `docs/02-diseno/sql/`: creación de la base (utf8mb4, InnoDB), las 20 tablas por módulo con sus 26 llaves foráneas, UNIQUE, CHECK y ENUM, 5 índices adicionales, datos de prueba ficticios y pruebas de reglas.
- Pruebas: 8 operaciones inválidas fueron rechazadas por la propia base de datos (duplicados, FK inexistente, borrado con RESTRICT, CHECK de fechas/calificación/estatus, ENUM) y se comprobó el ON DELETE CASCADE de `token_recuperacion` (RNF-08, RNF-10).
- Diagrama físico generado con Reverse Engineer de Workbench (`img/fig6-diagrama-fisico.png`, modelo `cindec_db.mwb`) y diccionario de datos (`03-3-diccionario-de-datos.md` y `Diccionario-de-datos-cindec_db.xlsx`).
- Evidencia de la construcción de la base de datos en Word (`Evidencia-construccion-BD-cindec_db.docx`, 53 figuras y referencias APA).
- Paso 4, casos de uso: 22 casos de uso y 5 diagramas, uno por módulo (`04-uml-casos-de-uso.md`, figuras 7 a 11), aprobados por el residente.
- Paso 4, diagrama de clases: 20 clases del dominio con atributos, operaciones, asociaciones y composiciones, más 10 enumeraciones que coinciden con los ENUM de la base de datos (`04-2-uml-clases.md`, figuras 12 y 13), aprobado por el residente.
- Paso 4, diagramas de secuencia (`04-3-uml-secuencia.md`, figuras 14 y 15): inscripción con control de cupo (CU-07 + CU-08) y trámite de certificación con notificación (CU-17 + CU-18 + CU-21), recorriendo las capas de la arquitectura.
- Paso 4 cerrado: casos de uso, clases y secuencia aprobados.
- Paso 5, prototipos: inventario de 25 pantallas y mapa de navegación por rol (figura 16); guía de estilo con la identidad de CINDEC (logo y colores entregados por el residente, Nunito Sans, voz de usted; figura 17 y Sistema de diseño CINDEC); 10 wireframes, 11 mockups (incluida la variante sin cupo) y 4 pantallas en el navegador del celular (RNF-02). Imágenes en `docs/02-diseno/img/prototipos/`.
- Se decidió el autorregistro en tres pasos: Cuenta · Datos personales · Documentos.
- Se decidió usar el MySQL 8.0 local (puerto 3306) en lugar del de XAMPP (MariaDB, 3307); el `.env` del backend se ajusta al iniciar Desarrollo.

**Pendiente:**
- Revisión del residente del diccionario de datos.
- Revisión de los prototipos con Juan Alexis (preguntas en `05-prototipos.md`, sección 5.7).
- Paso 6: entregable Word *Diseño completo del sistema*; 2do reporte parcial del 26 al 30 de octubre.

