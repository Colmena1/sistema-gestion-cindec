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

