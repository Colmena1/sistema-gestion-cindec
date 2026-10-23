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
- Regenerar y re-entregar `ERS-CINDEC.docx` reflejando el corte del rol "Empresa cliente". (Corrección hecha el 01-oct en v1.1; v1.2 lista el 21-oct.)
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
- ERS actualizada a la versión 1.2 (`docs/01-requerimientos/ERS-CINDEC.docx`): término oficial de CONOCER para el dictamen ("Todavía no competente") e historial de versiones en la portada; sin cambios en los requisitos. Lista para entregarse a los asesores.
- Metodología: se confirma Scrum + modelo incremental. Análisis y Diseño se trabajaron por iteraciones con revisión y aprobación; a partir de Desarrollo, sprints de 1 semana (1-2 módulos por sprint según el cronograma) con planeación, entrega del módulo, revisión con Juan Alexis (Product Owner) y retrospectiva registrada en esta bitácora.
- Reuniones del periodo del 2do reporte (18-sep al 30-oct):
  - 02/10/2026, 12:00-14:00, con Juan Alexis (asesor empresarial): funcionamiento del sistema. Juan Alexis está enterado y de acuerdo con la separación Alcance V1 / Visión futura (se cierra el Action Item de ADR-0002).
  - 07/10/2026, 12:00-13:30, con el asesor docente: modelo E-R, modelo relacional y normalización.
  - 15/10/2026, 10:00-11:30, con Juan Alexis: logotipo y colores de CINDEC; da libertad al residente en el diseño, apegado a la identidad de CINDEC.
- Se decidió usar el MySQL 8.0 local (puerto 3306) en lugar del de XAMPP (MariaDB, 3307); el `.env` del backend se ajusta al iniciar Desarrollo.

**Pendiente:**
- Revisión del residente del diccionario de datos.
- Presentar los prototipos a Juan Alexis cuando tenga disponibilidad (preguntas en `05-prototipos.md`, sección 5.7).
- Reunión con el asesor docente programada para el 29/10/2026.
- Paso 6: entregable Word *Diseño completo del sistema*; 2do reporte parcial del 26 al 30 de octubre.

### Inicio de Desarrollo — Sprint 0 (21 al 25-oct-2026)

**Hecho (21-oct):**
- Plan de la fase de Desarrollo aprobado (`docs/04-desarrollo/plan-de-desarrollo.md`): Sprint 0 de preparación y cuatro sprints semanales (semanas 44 a 47), cierre en la semana 48. Pruebas e integración se recorre a la semana 47 por el aplazamiento; se compensa con pruebas dentro de cada sprint.
- ADR-0004: los scripts SQL son la fuente de verdad del esquema; Sequelize se usa solo como ORM (sin `sync()` ni migraciones).
- Backend reorganizado según ADR-0003: API en `/api/v1`, carpetas `src/modules/<módulo>/`, manejo de errores centralizado (RNF-12), middleware de validación (RNF-09), helmet, morgan y CORS limitado al frontend; `.env.example` apunta al MySQL 8.0 local (3306).

**Hecho (21-oct, cont.):**
- Dependencias instaladas y API verificada: `GET /api/v1/health` responde 200 con `cindec_db` conectada (MySQL 8.0, puerto 3306).

**Hecho (22-oct):**
- Modelos Sequelize de las 20 tablas (`backend/src/models/`), copiados de los scripts SQL: 128 columnas; valores ENUM centralizados en `enums.js` (coinciden con las 10 enumeraciones del diagrama de clases).
- 26 relaciones declaradas en `models/index.js` (una por llave foránea del diseño lógico), con nombres para consultas (`instructor`, `evaluador`, `inscripciones`, etc.).
- El modelo `Usuario` nunca devuelve `contrasena_hash` salvo que se pida explícitamente (solo el login).
- Script `npm run verificar-modelos`: compara cada modelo con su tabla real en MySQL (columnas y nulos).

- Verificación ejecutada contra MySQL: las 20 tablas coinciden con sus modelos (128 columnas, 26 relaciones). Se corrigió el script para considerar que las llaves primarias nunca aceptan nulos.
- Frontend creado con Vite (React, ESLint) e instalados react-router-dom, axios, lucide-react y @fontsource/nunito-sans.
- Base visual de la guía de estilo en `frontend/src/index.css` (colores, tipografía Nunito Sans, espacios, tarjetas, avisos, botones) y estructura de pantalla: menú lateral de 264 px con logo de CINDEC, opciones por rol (figura 16) y, en celular, menú con botón ☰ (RNF-02).
- Cliente HTTP central (`api/cliente.js`) con base `/api/v1`, token JWT y manejo de sesión expirada; proxy de Vite hacia el backend.
- Panel de inicio (P-04) con saludo y comprobación en vivo de la conexión frontend → API → `cindec_db`. Las demás pantallas muestran en qué sprint se construyen.
- Usuario de demostración con selector de rol, temporal hasta el inicio de sesión del Sprint 1.

**Pendiente del Sprint 0:**
- Revisión del residente de la base visual en computadora y celular.

**Retrospectiva Sprint 0:**
- Funcionó: verificar cada paso contra la base de datos real antes de avanzar (el script de modelos detectó al instante una diferencia).
- A mejorar: correr las pruebas en el equipo del residente justo después de cada cambio.

## Semana 43-44 — Sprint 1: Autenticación, y usuarios y roles (iniciado el 22-oct-2026, adelantado)

**Planeación del sprint:** CU-01 Iniciar sesión, CU-02 Recuperar contraseña y CU-03 Gestionar usuarios y roles (RF-USR-01 a 06). Se trabaja en tres partes: (1) inicio de sesión y control de acceso por rol, (2) gestión de usuarios con auditoría, (3) recuperación de contraseña por correo.

**Hecho (22-oct) — Parte 1:**
- Backend: `POST /api/v1/auth/login` (bcrypt + JWT con expiración configurable) y `GET /api/v1/auth/yo`; mensaje único para correo o contraseña incorrectos; cuentas desactivadas sin acceso; registro de `ultimo_acceso`; límite de 10 intentos de login cada 15 minutos por IP.
- Middlewares `autenticar` (valida el token y que la cuenta siga activa en cada petición) y `autorizar(...roles)` (403 si el rol no tiene permiso) — RF-USR-03, RNF-03, RNF-04.
- Regla de contraseñas: mínimo 8 caracteres con letras y números; cifrado bcrypt (RNF-05).
- Scripts `npm run asignar-contrasena` y `npm run contrasenas-prueba` (usuarios ficticios del script 08).
- Frontend: pantalla de inicio de sesión (P-01, mockup M01), sesión real con token, rutas protegidas por rol, menú del rol del usuario y Cerrar sesión. Se retiró el usuario de demostración.
- Corrección: el nombre del rol en la base es "Coordinador de capacitación"; el menú del frontend se alineó con los nombres exactos de la tabla `rol`.
- Ajustes de interfaz pedidos por el residente: menú lateral contraíble a solo íconos en computadora (se recuerda la preferencia) y pantallas más compactas para que el login y el menú quepan sin desplazamiento.

**Hecho (22-oct) — Parte 2: Gestión de usuarios (CU-03, RF-USR-01, 02 y 04):**
- API `/api/v1/usuarios` (solo Administrador general): listar con búsqueda, filtro por rol y estado y paginación; consultar; registrar; editar (datos, rol y contraseña opcional); activar/desactivar. Catálogo `GET /usuarios/roles`.
- Reglas de negocio: correo único; los participantes no se registran desde esta pantalla (requieren CURP y documentos; se registran en el Sprint 2 por autorregistro o desde Participantes) y su rol no se puede cambiar; un administrador no puede desactivarse a sí mismo; siempre debe quedar al menos un administrador activo.
- Auditoría (RNF-07): cada alta, edición (con el detalle de qué cambió, de qué valor a qué valor), cambio de contraseña y activación/desactivación se guarda en la tabla `auditoria` dentro de la misma transacción.
- Pantalla P-05 Usuarios: tabla con buscador, filtros, etiquetas de estatus, ventana para registrar/editar con validación por campo y confirmación para desactivar; en celular la tabla se muestra como tarjetas (RNF-02).
- Componentes reutilizables: `Modal` (ventana emergente) y `EtiquetaEstatus`.
- Sincronización de la sesión entre pestañas del mismo navegador (todas comparten un token): al iniciar o cerrar sesión en una pestaña, las demás se actualizan.

**Hecho (22-oct) — Parte 3: Recuperar contraseña (CU-02 «include» CU-21, RF-USR-06):**
- `POST /api/v1/auth/recuperar`: responde siempre lo mismo (no revela qué correos existen); si la cuenta existe y está activa genera un token aleatorio de un solo uso, guarda solo su hash SHA-256 en `token_recuperacion` con vencimiento de 30 minutos, anula los enlaces anteriores y envía el correo.
- `GET /api/v1/auth/restablecer/validar` y `POST /api/v1/auth/restablecer`: validan el token (vigente, sin usar, cuenta activa), cambian la contraseña con bcrypt, marcan el token como usado y registran el cambio en auditoría, todo en una transacción.
- Límite de 5 solicitudes de recuperación cada 15 minutos por IP.
- Módulo Notificaciones: servicio de correo con Nodemailer y plantilla con la identidad de CINDEC (base de RF-NOT-01). En desarrollo se usa el buzón de prueba Ethereal; para producción basta configurar SMTP en `.env` (variables documentadas en `.env.example`).
- Frontend: pantallas "Recuperar contraseña" y "Definir contraseña nueva" (P-02) y enlace activo en el login.
- Pruebas ejecutadas por el residente (22-oct): solicitud con correo registrado y no registrado (misma respuesta), correo recibido en el buzón de prueba, contraseñas que no coinciden, cambio exitoso e inicio de sesión con la contraseña nueva.

**Revisión del sprint:** Sprint 1 terminado el 22-oct-2026, adelantado respecto al cronograma (semana 44). Se cubren CU-01, CU-02 y CU-03 (RF-USR-01 a 06). Pendiente: mostrar el avance a Juan Alexis (Product Owner) y al asesor docente en la reunión del 29-oct.

**Retrospectiva Sprint 1:**
- Funcionó: dividir el sprint en tres partes probadas por separado; las pruebas del residente detectaron ajustes de interfaz (menú contraíble, tamaño de pantallas, botones de la tabla) que se corrigieron el mismo día.
- A mejorar: verificar siempre que los archivos actualizados lleguen completos al equipo del residente (se detectaron dos copias que no se aplicaron) y usar una ventana de incógnito para probar dos roles a la vez.

## Semana 43 — Sprint 2: Cursos, grupos y participantes (iniciado el 22-oct-2026, adelantado)

**Planeación del sprint:** CU-04 a CU-11 (RF-CUR-01 a 10) en cuatro partes: (1) estándares y cursos, (2) grupos y sesiones, (3) participantes: autorregistro, alta y expediente, (4) inscripción con cupo, asistencia y consultas por rol.

**Hecho (22-oct) — Parte 1: Estándares y cursos (CU-04, RF-CUR-01):**
- API `/api/v1/estandares` y `/api/v1/cursos` (Coordinador y Administrador): listar con búsqueda y filtros, registrar, editar y activar/desactivar, con auditoría.
- Reglas: código de estándar único con formato CONOCER (EC0301, EC0110.02); un curso solo se registra con un estándar activo; no se desactiva un estándar con cursos activos ni un curso con grupos planeados o en curso; no se cambia el estándar de un curso que ya tiene grupos.
- Pantalla P-06 "Cursos y estándares" con dos pestañas (Cursos / Estándares de competencia), conteo de grupos vigentes y de cursos activos.
- Componentes reutilizables nuevos: `Campo`, `Aviso`, `Confirmacion` y los hooks `useDebounce` y `useAvisoTemporal`.

**Hecho (22-oct) — Parte 2: Grupos y sesiones (CU-05, RF-CUR-02, 05, 08 y 09):**
- API `/api/v1/grupos` y `/api/v1/sesiones` (Coordinador y Administrador): lista paginada con filtros, inscritos y lugares libres calculados (el cupo disponible no se guarda, se calcula); detalle con sesiones e inscritos; alta, edición, cambio de estatus; alta, edición y eliminación de sesiones; catálogo de instructores y evaluadores activos. Todo con auditoría.
- Reglas: curso activo; clave única, generada automáticamente si no se escribe (código del estándar + año + consecutivo, p. ej. EC0301-2026-01); instructor y evaluador deben ser usuarios activos con ese rol; enlace de videoconferencia obligatorio en línea o mixta (RF-CUR-09); el cupo no baja de los inscritos; las sesiones caen dentro de las fechas del grupo; no se elimina una sesión con asistencia.
- Ciclo de estatus (RF-CUR-08): planeado → en curso → concluido, o cancelado desde planeado o en curso; para iniciar se requiere instructor y al menos una sesión; un grupo concluido o cancelado ya no se modifica (RNF-10).
- Pantallas P-07 Grupos (lista) y P-08 Detalle del grupo (mockup M08): datos, barra de ocupación, instructor y evaluador ("Sin asignar · Asignar"), sesiones e inscritos con buscador.
- Ajuste: la tabla de Cursos ya no necesita desplazamiento horizontal.

**Hecho (22-oct) — Parte 3: Participantes (CU-06 «include» CU-21, CU-10; RF-CUR-03 y 06):**
- Autorregistro público en tres pasos (P-03, mockup M03): Cuenta · Datos personales · Documentos. Antes de avanzar se verifica que el correo y la CURP no estén registrados; todo se envía junto al final.
- Documentos según el manual de CONOCER: identificación oficial (INE, pasaporte, cédula o cartilla) y fotografía obligatorias; ficha de registro opcional; identificación del tutor obligatoria si la CURP indica que es menor de edad (se calcula con la fecha de nacimiento de la CURP). Fotografía JPG/PNG de 300 KB como máximo, guardada con la CURP como nombre.
- Archivos con multer: PDF, JPG o PNG de hasta 5 MB; se guardan en `backend/uploads/` fuera de lo público (excluido de Git) y solo se descargan por la API con permisos (coordinación o el propio participante). Si algo falla al registrar, se borran los archivos ya escritos y la transacción se revierte.
- Validación de CURP (formato y fecha de nacimiento real) y teléfono a 10 dígitos, en el navegador y en el servidor.
- Correo de confirmación de registro (RF-NOT-01).
- Coordinación: P-10 Participantes (lista con búsqueda por nombre, correo o CURP) y alta de participantes con contraseña inicial; P-11 Expediente con datos editables, documentos (ver y agregar; aviso de documentos pendientes) e historial de cursos. Desde el detalle del grupo se abre el expediente de cada inscrito.
- Todo con auditoría.
- Ajustes tras las pruebas del residente: la fotografía de más de 300 KB se marca al elegirla; se corrigió un desplazamiento horizontal en el paso 3 del registro; mensaje claro cuando el archivo de un documento no existe en el servidor.

**Hecho (22-oct) — Parte 4: Inscripción, asistencia y vistas por rol (CU-07 «include» CU-08, CU-09, CU-11/CU-13 parcial; RF-CUR-04, 06, 07 y 10):**
- Inscripción (P-09, mockups M09 y M09b): búsqueda de participantes por nombre o CURP con aviso de "ya inscrito"; lugares restantes; si no hay cupo, el botón se deshabilita y se ofrecen otros grupos del mismo curso con lugares. Opción de inscripción como refuerzo (RF-EVA-04).
- Validación de cupo con el renglón del grupo bloqueado (SELECT … FOR UPDATE) dentro de la transacción, para que dos inscripciones simultáneas no rebasen el cupo (diagrama de secuencia, figura 14). Si el participante estaba de baja en el grupo, se reactiva (restricción UNIQUE participante-grupo).
- Baja, reactivación y "capacitación concluida" por inscripción (primer estado de RF-EVA-03), con auditoría. Correo de confirmación de inscripción al participante (RF-NOT-01).
- Asistencia por sesión (P-17, mockup M17): selector de sesión, "Asistió / No asistió", observaciones, "Marcar a todos como presentes" y aviso "Falta marcar". Solo en grupos en curso y sesiones que ya ocurrieron; el instructor solo en sus grupos (validado en el servidor).
- Mis grupos (Instructor, P-16): grupos asignados con sesiones y acceso a la asistencia (RF-CUR-07).
- Mis cursos (Participante, P-21): grupos inscritos, sesiones, enlace de videoconferencia, instructor y su asistencia por sesión (RF-CUR-06).
- Pruebas del residente (22-oct): inscripción con búsqueda, aviso de "ya inscrito", grupo lleno con botón deshabilitado, baja que libera el lugar, asistencia con "Falta marcar" y guardado (2 de 2), y "Mis cursos" del participante.
- Hallazgo del residente: en "Mis cursos" de Ana aparecía "Asistió" en una sesión futura del grupo G-2026-01 (planeado). Causa: el script `08-datos-prueba.sql` de la fase de Diseño insertó directamente asistencias, intentos, evidencias y un trámite adelantados para probar las tablas. No es un error del sistema (sus reglas no permiten crear esos registros). Se agregó `docs/02-diseno/sql/10-limpiar-registros-adelantados.sql`, que elimina solo esos registros para que los datos de prueba sean coherentes antes del Sprint 3.
- Script 10 ejecutado por el residente: se eliminaron los registros adelantados y se verificó que "Mis cursos" ya no muestra asistencia en sesiones futuras y que la asistencia de un grupo planeado queda en "Solo consulta".

**Retrospectiva Sprint 2:**
- Funcionó: dividir el sprint en cuatro partes con pruebas del residente en cada una; las pruebas detectaron un problema de datos (registros de prueba adelantados) que se corrigió con un script documentado.
- A mejorar: mantener los datos de prueba coherentes con las reglas del sistema; a partir de ahora, los registros de evaluación y certificación se crean desde el sistema.

## Semana 43 — Sprint 3: Materiales, evaluaciones y certificaciones (iniciado el 22-oct-2026, adelantado)

**Planeación del sprint:** CU-12 a CU-20 (RF-APR-01 a 03, RF-EVA-01 a 05, RF-CERT-01 a 07) en tres partes: (1) materiales, (2) evaluaciones, (3) certificaciones.

**Hecho (22-oct) — Parte 1: Materiales (CU-12, CU-13; RF-APR-01, 02 y 03):**
- API `/api/v1/materiales` y `/api/v1/mis-materiales`: cursos que cada persona puede administrar; lista de materiales por curso con número de consultas; alta de archivo (PDF, Word, PowerPoint, Excel, JPG o PNG, hasta 20 MB) o enlace a video; edición de título, orden y enlace; eliminación solo si nadie lo ha consultado; descarga protegida y apertura de video.
- Reglas: el material pertenece al curso (lo comparten sus grupos); el instructor solo administra los cursos que imparte; el participante solo ve los cursos en los que está inscrito; cada descarga o apertura de video del participante queda en `consulta_material` (primera y última consulta).
- Pantallas: P-18 Materiales del curso (instructor y coordinación; acceso desde Cursos y estándares), P-22 Materiales del participante (mockup M22) con marca "Consultado" y avance por curso; "Ver materiales" desde Mis cursos.
- Indicador "materiales consultados" (RF-APR-03): por material ("consultado por X de Y") y por participante en su expediente ("X de Y" por curso).
- Pruebas del residente: el instructor subió un PDF y un video y vio "consultado por 1 de 2"; la participante consultó ambos (2 de 2); un material ya consultado no se pudo eliminar; una participante dada de baja no ve materiales; un archivo .zip fue rechazado.
- Correcciones tras las pruebas: al descargar un material cuyo archivo no existe se mostraba un error genérico de conexión; ahora se muestra el mensaje real del servidor (también en documentos del expediente). Los avisos de error se pueden cerrar y se limpian al cambiar de curso; el tipo de archivo se valida al elegirlo.

**Hecho (22-oct) — Parte 2: Evaluaciones (CU-14, CU-15, CU-16; RF-EVA-01 a 05):**
- API `/api/v1/evaluaciones` (instrumentos), `/api/v1/por-evaluar`, `/api/v1/intentos` y `/api/v1/evidencias`.
- Instrumentos (P-12, Coordinador): uno o más por estándar, con tipo (guía de observación, lista de cotejo, cuestionario) y calificación mínima propia (RF-EVA-04); no se cambian estándar, tipo ni mínima si ya hay intentos calificados; se desactivan en lugar de borrarse.
- Por evaluar (P-19) y Resultado y dictamen (P-20, mockup M20) para el Evaluador: fecha de aplicación, calificación, dictamen, observaciones y evidencias (PDF, Word, JPG o PNG, hasta 10 MB, o solo descripción).
- Reglas: solo evalúa el evaluador asignado al grupo (coordinación solo consulta); solo se evalúa con "capacitación concluida"; el instrumento debe ser del estándar del curso; aprobada/no aprobada lo calcula el sistema con la mínima; con calificación reprobatoria el dictamen solo puede ser "todavía no competente"; se necesita al menos una evidencia; cada intento es una fila nueva numerada; un solo intento pendiente a la vez; no hay intentos después de "competente"; un resultado guardado ya no se modifica (RNF-06, RNF-10); un intento pendiente se puede cancelar.
- Expediente del participante: nueva sección "Evaluaciones" (RF-EVA-05).
- Pruebas del residente: instrumento EC0301 con mínima 80 (101 rechazado); Ana: intento 1 con 70 (no aprobada, todavía no competente) e intento 2 con 85 (aprobada, competente), sin opción a más intentos; evidencia .zip rechazada; mínima bloqueada por tener resultados; intento de Luis cancelado sin dejar registro.
- Correcciones tras las pruebas: la ventana "Subir evidencia" estaba dentro del formulario del resultado (formularios anidados) y recargaba la página sin subir el archivo; se separaron. Las tablas de Por evaluar e Instrumentos se compactaron para no tener desplazamiento horizontal.

**Hecho (23-oct) — Parte 3: Certificaciones (CU-11, CU-17 a CU-20; RF-CERT-01 a 07):**
- API `/api/v1/tramites`, `/api/v1/mis-certificados`, `/api/v1/mi-historial` y `/api/v1/verificar-folio`.
- Trámites (P-13): lista con pestañas por estatus y conteo, búsqueda por participante, CURP o folio y filtro por fechas (RF-CERT-05); "Iniciar trámite" solo ofrece participantes con dictamen competente sin trámite.
- Detalle del trámite (P-14, mockup M14, figura 15): avance en cuatro pasos, historial con fecha y observaciones, y resguardo del PDF oficial de CONOCER con folio CONOCER, tipo de documento, fecha de emisión y vigencia (RF-CERT-03, 04).
- Reglas: el trámite solo nace de un dictamen competente (422) y uno por intento (409); folio interno consecutivo por año (CINDEC-2026-0001); el estatus avanza solicitado → pagado → en trámite → emitido sin saltos ni regresos y cada cambio queda en el historial en la misma transacción; "emitido" solo al resguardar el PDF (solo PDF, hasta 10 MB; folio CONOCER único; emisión entre la solicitud y hoy; vigencia posterior a la emisión); el aviso por correo al participante se envía después del commit y sin esperar respuesta.
- Verificar folio (P-25, mockup M25, todos los roles con sesión): por folio CONOCER indica si el certificado es válido y vigente o vencido; por folio interno indica el estatus del trámite (RF-CERT-07, versión interna).
- Participante: Mis certificados (P-24) con avance y descarga del PDF propio (RF-CERT-06) y Mi historial (P-23) con cursos, evaluaciones y certificaciones (RF-CUR-06, RF-EVA-05). Expediente del participante: nueva sección "Certificaciones".
- Pruebas del residente: trámite CINDEC-2026-0001 de Ana llevado de Solicitado a Emitido; PDF obligatorio y archivo .jpg rechazado; certificado resguardado y descargado; verificación por folio CONOCER, por folio interno y con un folio inexistente; Ana descargó su certificado y vio su historial completo; "Iniciar trámite" ya no la ofrece.
- Corrección tras las pruebas: al resguardar el certificado, el servidor esperaba la respuesta del buzón de prueba de correo (Ethereal), que no respondió (ETIMEDOUT); el navegador agotó su espera de 15 s y mostró "No se pudo conectar", aunque el certificado sí se guardó. Ahora el correo se envía sin esperar respuesta, como indica la figura 15. También se quita el mensaje de error de cada campo en cuanto se corrige.

**Retrospectiva Sprint 3:**
- Funcionó: seguir los diagramas de secuencia y los mockups (M14, M20, M22, M25) como contrato; las reglas de negocio quedaron en el backend y las pruebas del residente recorrieron el flujo completo de un participante: capacitación → evaluación → certificación.
- A mejorar: no hacer que una pantalla dependa de un servicio externo (correo) para responder; revisar que ningún formulario quede dentro de otro; probar con el ancho de pantalla del residente antes de entregar tablas con muchas columnas.
- Pendiente para el Sprint 4: reportes PDF/Excel (CU-22) y recordatorios por correo (RF-NOT-01); reenvío del aviso de certificado emitido cuando el correo falle.

## Semana 43 — Sprint 4: Reportes y notificaciones (iniciado el 23-oct-2026, adelantado)

**Revisión previa de documentos oficiales (23-oct):** CINDEC proporcionó el Manual de Operaciones de ECE/OC (M-DGAOSU-03), el Manual de identidad gráfica Red CONOCER 2025, la Cédula de Evaluación, las plantillas de Portafolio de evidencias y Encuesta de satisfacción, el estándar EC1564, un convenio ECE-CE, un informe de auditoría anual y logotipos. Hallazgos y decisiones (ADR-0005):
- La evaluación no debe condicionarse a la capacitación (convenio ECE-CE, cláusula A.10; criterio de Libre Acceso). Se ajustó la regla del Sprint 3: el evaluador asignado puede evaluar a cualquier inscrito sin baja de un grupo en curso o concluido.
- Terminología CONOCER: lo que registra el evaluador se muestra como "juicio de competencia"; el Grupo de Dictamen, la cédula completa, el portafolio tipificado, la encuesta de satisfacción y los plazos oficiales se registraron en `vision-futura-cindec.md` para no modificar la base de datos.
- Los reportes oficiales usarán la razón social "Compromiso Compartido, Centro Integral de Desarrollo y Capacitación A.C." (ECE516-22).
- Logotipo Red CONOCER: se sustituyó por el vectorial oficial de Entidad de Certificación y Evaluación (color #611232, interior blanco, tamaño mínimo 1.7 × 3 cm). No se usa el logotipo del Gobierno de Guanajuato (pertenece a otra ECE y el manual no autoriza imagen de dependencias).
- Pruebas del residente: Luis (inscrito, sin capacitación concluida marcada al inicio) aparece con "Evaluar"; las pantallas muestran "Juicio de competencia"; el inicio de sesión muestra el logotipo oficial Red CONOCER; un grupo planeado muestra "Grupo sin iniciar".

**Hecho (23-oct) — Parte 1: Reportes (CU-22; RF-REP-01 y 02):**
- API `/api/v1/reportes` (Coordinador y Administrador): catálogo, vista previa y exportación a PDF (pdfkit) y Excel (exceljs). Dependencias nuevas del backend: `pdfkit` y `exceljs`.
- 11 reportes con filtros de periodo (y curso o estatus cuando aplica): participantes registrados, cursos impartidos, inscripciones por curso, avance de participantes, asistencia por sesión, evaluaciones realizadas, personas competentes y no competentes, certificaciones por estatus, historial de certificaciones, reporte por instructor y por evaluador. Consultas SQL de solo lectura con parámetros.
- Encabezado oficial en PDF y Excel: logotipo de CINDEC en alta resolución, logotipo Red CONOCER (ECE, mínimo 3 cm), razón social y cédula ECE516-22, filtros, fecha y usuario que lo generó, totales; el PDF repite el encabezado de la tabla en cada página y numera "Página X de Y".
- Cada exportación queda en la auditoría (quién, qué reporte, formato y filtros). La fecha "desde" no puede ser posterior a "hasta" (calendario, formulario y servidor).
- Pruebas del residente: vista previa y PDF de "Evaluaciones realizadas" (1 aprobada, 1 no aprobada), Excel de "Avance de participantes", recorrido de los 11 reportes sin errores y validación del periodo.

**Hecho (23-oct) — Parte 2: Notificaciones (CU-21; RF-NOT-01):**
- Avisos que ya existían: registro exitoso, inscripción confirmada, certificado emitido y recuperación de contraseña.
- Nuevos: recordatorio de la próxima sesión (el día anterior, a inscritos e instructor), evaluación pendiente (al participante cuando se inicia su intento y resumen diario al evaluador de lo que tiene sin calificar) y reenvío manual del aviso de certificado emitido.
- Revisión automática cada hora (8:00 a 21:00) y botón "Enviar recordatorios ahora" en Inicio para la coordinación. Para no repetir avisos sin modificar la base de datos (ADR-0004), cada envío se anota en `auditoria` y se consulta antes de volver a enviar.
- Robustez del correo: límites de espera de 10 s; si en desarrollo el buzón Ethereal no responde, cada correo se guarda como página .html en `backend/correos-prueba/` (excluida de Git); también se puede forzar con `CORREO_MODO=archivo`. Con un SMTP real en el `.env` los mismos correos llegan a las bandejas sin cambiar código.
- Pruebas del residente: sesión del 24/10 → la revisión automática avisó a Ana, Luis e Iván (3 correos) y el botón ya no repitió el aviso; al evaluar a Luis se generó su aviso de evaluación pendiente y Elena recibió su resumen; reenvío del aviso de certificado de Ana.
- Corrección tras las pruebas: Ethereal dejó de responder desde la red del residente y cada correo esperaba 10 s; se agregó el modo archivo automático.

**Retrospectiva Sprint 4:**
- Funcionó: revisar los documentos oficiales de CINDEC antes de construir los reportes evitó dos errores de fondo (condicionar la evaluación a la capacitación y usar logotipos no autorizados); un solo "motor" de reportes alimenta la pantalla, el PDF y el Excel, lo que facilitó cubrir los 11 reportes.
- A mejorar: no depender de servicios externos gratuitos (Ethereal) para probar; se resolvió con el modo archivo. Pendiente acordar con CINDEC la cuenta de correo real para producción.
- Estado del sistema: los 22 casos de uso de V1 (CU-01 a CU-22) están implementados y probados en el equipo del residente. Siguiente: pruebas integrales (fase de Pruebas del Gantt), ajustes de la revisión con CINDEC y documentación para el reporte del 2.º parcial.
