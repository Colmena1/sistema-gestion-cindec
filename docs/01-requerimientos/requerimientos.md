# Documento de requerimientos

**Estado:** Nivel 1 validado con CINDEC (entrevista del 2026-09-15, ver `RespLineamientos 1.txt` en el chat/registro del proyecto). Quedan muy pocos `[VALIDAR]` — el resto de las respuestas fue lo bastante detallado para cerrar la mayoría de las dudas del borrador anterior.

**Importante — alcance:** este documento es el alcance **V1, el que se entrega en la residencia** (coincide con el anteproyecto ya aprobado). CINDEC también describió una visión de producto más grande (plataforma SaaS multiempresa, verificación pública por QR, WhatsApp, pagos, aulas virtuales) — esa parte está documentada aparte en [`vision-futura-cindec.md`](vision-futura-cindec.md) y NO forma parte de estos requerimientos. Ver [`docs/00-decisiones/ADR-0002-alcance-v1-vs-vision-futura.md`](../00-decisiones/ADR-0002-alcance-v1-vs-vision-futura.md) para la justificación de ese corte.

## 0. Contexto del proceso real de CINDEC (resumen de la entrevista)

- CINDEC certifica bajo estándares CONOCER (por ejemplo EC0110.02 — Asesoría en comercialización de bienes inmuebles, EC0903.02 — Promoción especializada de crédito de vivienda, entre otros vigentes).
- El proceso real: la empresa/persona solicita información → se acuerda estándar, participantes, fechas y costo → se registran los participantes → se imparte la capacitación (si aplica) → se evalúa la competencia con los instrumentos/evidencias del estándar CONOCER → se determina competente/no competente → si es competente, **CINDEC solicita y paga la certificación al CONOCER, y es el CONOCER quien la emite** a través de su propio Sistema Integral de Información.
- Este último punto es clave: **CINDEC no genera el documento oficial de certificación** — lo tramita y lo recibe. El sistema debe llevar el seguimiento de ese trámite y resguardar el documento recibido, no fabricar un certificado oficial (ver Módulo Certificaciones, más abajo).
- Las capacitaciones pueden ser presenciales, en línea o mixtas.

## 1. Requerimientos funcionales

### Módulo: Usuarios

- **RF-USR-01:** El sistema debe permitir registrar usuarios con al menos nombre, correo electrónico y contraseña.
- **RF-USR-02:** El sistema debe permitir asignar uno de los siguientes roles a cada usuario:
  - **Administrador general:** control total de la plataforma (usuarios, cursos, certificaciones, reportes).
  - **Coordinador de capacitación:** administra grupos, fechas, participantes, instructores/evaluadores, asistencia y seguimiento operativo.
  - **Instructor:** gestiona materiales, asistencia, actividades y avance de los participantes de sus cursos.
  - **Evaluador:** consulta las evaluaciones que tiene asignadas, registra evidencias y resultados.
  - **Participante:** se registra, consulta sus cursos, materiales, evaluaciones, avance y documentos propios.
  - **Empresa cliente** *(versión acotada en V1)*: consulta el avance, resultados y documentos autorizados de sus propios trabajadores — ver nota de alcance en `vision-futura-cindec.md`.
- **RF-USR-03:** El sistema debe restringir el acceso a las funcionalidades de cada módulo según el rol del usuario autenticado, incluyendo qué puede *consultar* y qué puede *modificar* cada rol (ver tabla de permisos abajo).
- **RF-USR-04:** El sistema debe permitir a un administrador crear, editar y activar/desactivar cuentas de usuario, con auditoría de cambios sobre configuración y registros sensibles.
- **RF-USR-05:** El sistema debe permitir iniciar sesión mediante correo electrónico y contraseña.
- **RF-USR-06:** `[VALIDAR]` La entrevista no especificó si se requiere recuperación de contraseña automática por correo o si el administrador la restablece manualmente — se recomienda implementar recuperación por correo de una vez, ya que el sistema de todas formas necesita enviar correos (ver RF-REP/notificaciones).

**Permisos de consulta y modificación por rol** (según lo confirmado por CINDEC):

| Rol | Consulta | Modifica |
|---|---|---|
| Administrador | Todo el sistema | Toda la configuración y registros, con auditoría |
| Coordinador | Cursos, grupos, participantes, calendario, asistencia, evaluaciones, reportes operativos | Cursos, grupos, horarios, asignaciones, seguimiento operativo |
| Instructor | Cursos asignados, grupos, participantes, materiales, asistencia, avance | Materiales y registros de sus cursos; asistencia y actividades |
| Evaluador | Evaluaciones asignadas, participantes, instrumentos, evidencias, resultados | Datos y resultados de las evaluaciones que tenga asignadas |
| Participante | Sus datos, cursos inscritos, materiales, evaluaciones, resultados, documentos propios | Sus datos personales autorizados, contraseña, preferencias de contacto |
| Empresa cliente | Sus trabajadores, cursos contratados, avances, resultados y documentos autorizados | Ninguna (solo consulta en V1) |

> Los resultados de evaluación y los certificados deben tener controles para evitar modificaciones no autorizadas (ya confirmado por CINDEC como requisito explícito).

### Módulo: Cursos, grupos y participantes

- **RF-CUR-01:** El sistema debe permitir registrar cursos con: nombre/estándar de competencia asociado, modalidad (presencial / en línea / mixta), fechas, cupo, instructor y evaluador asignados.
- **RF-CUR-02:** El sistema debe permitir crear grupos dentro de un curso (varios grupos pueden compartir el mismo curso/estándar en distintas fechas).
- **RF-CUR-03:** El sistema debe permitir el autorregistro de un participante mediante un formulario digital (datos personales, contacto, curso de interés, documentación necesaria) — confirmado explícitamente por CINDEC como necesidad ("se requiere un formulario digital para que el participante pueda registrarse por sí mismo").
- **RF-CUR-04:** El sistema debe permitir que un coordinador asigne participantes a cursos/grupos, controlando el cupo disponible.
- **RF-CUR-05:** El sistema debe permitir registrar instructores y evaluadores, y asignarlos a uno o más cursos/grupos.
- **RF-CUR-06:** El sistema debe permitir consultar, desde un solo lugar, el historial completo de cursos, evaluaciones y certificaciones de un participante.
- **RF-CUR-07:** El sistema debe permitir consultar el historial de cursos impartidos por un instructor y de evaluaciones realizadas por un evaluador.
- **RF-CUR-08:** El sistema debe permitir dar seguimiento al estatus de un curso/grupo (al menos: planeado, en curso, concluido; `[VALIDAR]` si además se requiere un estatus de "cancelado").
- **RF-CUR-09 (modalidad en línea/mixta):** Cuando el curso sea en línea o mixto, el sistema debe permitir registrar un enlace de videoconferencia, calendario y horario asociados al grupo.
- **RF-CUR-10 (asistencia):** El sistema debe permitir registrar la asistencia de los participantes en sesiones presenciales o mixtas.

### Módulo: Aprendizaje

- **RF-APR-01:** El sistema debe permitir cargar y organizar materiales de aprendizaje asociados a un curso: manuales, presentaciones, documentos PDF, ejercicios y videos (o enlaces a video).
- **RF-APR-02:** El sistema debe permitir a los participantes consultar y descargar los materiales del curso en el que están inscritos.
- **RF-APR-03:** El sistema debe permitir consultar, por participante, qué materiales ha revisado (para el indicador de "materiales consultados" pedido por CINDEC).

> Nota de alcance: esto cubre "compartir y organizar materiales". Un aula virtual autodidacta con secuencia de lecciones y avance automático (lo que CINDEC llamó "aulas virtuales") es una experiencia más completa tipo LMS — queda en `vision-futura-cindec.md`.

### Módulo: Evaluaciones

- **RF-EVA-01:** El sistema debe permitir registrar evaluaciones asociadas a un curso/estándar de competencia, incluyendo los instrumentos y evidencias correspondientes al estándar CONOCER aplicable (confirmado: las evaluaciones siguen el proceso autorizado por CONOCER, no son necesariamente de opción múltiple genérica).
- **RF-EVA-02:** El sistema debe permitir a un evaluador registrar evidencias y el resultado de la evaluación de un participante.
- **RF-EVA-03:** El sistema debe distinguir explícitamente entre estos estados (confirmado por CINDEC, son conceptos distintos que no deben confundirse):
  - Capacitación concluida
  - Evaluación aprobada / no aprobada
  - Persona competente / persona todavía en proceso
  - Certificación emitida
- **RF-EVA-04:** `[VALIDAR]` La calificación/criterio mínimo y el número de intentos permitidos dependen del estándar de competencia específico — no se puede fijar un valor único para todo el sistema; se recomienda que el criterio de aprobación se registre por evaluación/estándar, no como una constante global del sistema.
- **RF-EVA-05:** El sistema debe permitir consultar el estatus de evaluación de un participante (pendiente, aprobada, no aprobada) desde su historial.

### Módulo: Certificaciones (trámite y seguimiento — CONOCER emite el documento oficial)

- **RF-CERT-01:** El sistema debe permitir registrar que un participante fue determinado "competente" en un estándar de competencia (resultado de RF-EVA-03).
- **RF-CERT-02:** El sistema debe permitir registrar una solicitud de certificación ante CONOCER para un participante competente, con al menos: fecha de solicitud, estatus del trámite (solicitado / pagado / en trámite / emitido) y folio interno.
- **RF-CERT-03:** El sistema debe permitir adjuntar y resguardar el documento oficial (PDF) que CONOCER entrega una vez emitida la certificación, asociado al participante y al folio.
- **RF-CERT-04:** El sistema debe permitir registrar, del documento recibido, al menos: nombre del participante, curso/estándar de competencia, tipo de documento, fecha de emisión, folio, datos de la Entidad de Certificación, vigencia (cuando aplique).
- **RF-CERT-05:** El sistema debe permitir consultar el historial completo de certificaciones: por participante, por curso, por estatus de trámite, por fechas.
- **RF-CERT-06:** El sistema debe permitir a un participante descargar sus propios documentos de certificación ya emitidos.
- **RF-CERT-07 (verificación — versión V1, interna):** El sistema debe permitir, dentro de la plataforma (usuarios autenticados), consultar el estatus/autenticidad de una certificación por folio.

> La verificación *pública* (código QR en el documento físico, consultable desde internet por cualquier persona sin iniciar sesión) requiere despliegue en producción con acceso público — fuera del alcance V1 por la Limitación de "entorno local, sin producción". Ver `vision-futura-cindec.md`.

### Módulo: Reportes

- **RF-REP-01:** El sistema debe generar los siguientes reportes operativos (todos derivados de datos ya capturados por los módulos anteriores, sin necesitar información adicional):
  - Participantes registrados por periodo
  - Cursos impartidos / cursos activos y concluidos
  - Inscripciones por curso
  - Avance de participantes
  - Asistencia
  - Evaluaciones realizadas (aprobadas / no aprobadas)
  - Personas competentes y no competentes
  - Certificaciones solicitadas / en trámite / emitidas
  - Certificados por empresa (usando la relación simple participante-empresa de RF-USR-02)
  - Historial de certificaciones
  - Reportes por instructor y por evaluador
- **RF-REP-02:** Los reportes deben poder exportarse (al menos PDF o Excel) para enviarse fuera del sistema.

> Fuera de alcance V1: reporte de ingresos por curso/servicio (depende de facturación) y reportes de desempeño/conversión comercial (más cercano a un CRM) — ambos en `vision-futura-cindec.md`.

### Notificaciones (nuevo, dentro de alcance V1)

- **RF-NOT-01:** El sistema debe enviar confirmaciones y recordatorios por correo electrónico (registro exitoso, próxima sesión, evaluación pendiente, certificación emitida).

> Notificaciones por WhatsApp requieren un servicio de terceros de pago — fuera de alcance V1, ver `vision-futura-cindec.md`.

## 2. Requerimientos no funcionales

- **RNF-01:** La aplicación debe ser accesible desde navegadores estándar de escritorio (Chrome, Edge, Firefox), sin requerir instalación adicional. *(ya comprometido en el anteproyecto)*
- **RNF-02:** El sistema se implementará y validará en un entorno local durante el periodo de residencia, sin desplegarse en un ambiente de producción. *(ya comprometido — implica que la verificación pública por QR y el portal empresarial multiempresa quedan fuera de V1)*
- **RNF-03:** El sistema no requiere conexión permanente a internet para su funcionamiento local, salvo el envío de notificaciones por correo (RF-NOT-01), que si se implementa síncrono sí necesita conexión al momento de enviar.
- **RNF-04:** El sistema no incluirá una aplicación móvil nativa en esta primera versión, solo aplicación web. *(ya comprometido)*
- **RNF-05:** El sistema no contempla integración con plataformas de pago ni con servicios de terceros de paga (como WhatsApp Business API) que no sean indispensables para su funcionamiento. *(ya comprometido; confirma que "facturación" y "WhatsApp" pedidos por CINDEC quedan en Visión futura)*
- **RNF-06:** La arquitectura debe diseñarse de forma modular (separación por capas: rutas/controladores/servicios/modelos, y por dominio: usuarios, cursos, evaluaciones, certificaciones) para facilitar su crecimiento hacia la visión de plataforma multiempresa descrita en `vision-futura-cindec.md`, aunque esa implementación quede fuera de esta versión.
- **RNF-07:** El acceso a cada módulo y a cada acción de consulta/modificación debe estar controlado por el rol del usuario autenticado, según la tabla de permisos de la sección de Usuarios.
- **RNF-08:** Los resultados de evaluación y los documentos de certificación deben quedar protegidos contra modificaciones no autorizadas (por ejemplo, solo el evaluador asignado y el administrador pueden editar un resultado ya registrado).

## 3. Casos de uso (nivel alto — se detallan como diagramas UML en la fase de Diseño)

- Un coordinador crea un curso/grupo y asigna instructor y evaluador.
- Un participante se autorregistra mediante el formulario público y queda pendiente de asignación a un curso.
- Un coordinador asigna al participante a un curso/grupo, respetando el cupo.
- Un instructor sube materiales de aprendizaje y pasa lista de asistencia.
- Un evaluador registra evidencias y el resultado (competente / no competente) de un participante.
- Un administrador registra la solicitud de certificación ante CONOCER para un participante competente, y después adjunta el documento oficial cuando CONOCER lo emite.
- Un participante consulta su historial completo (cursos, evaluaciones, certificaciones) y descarga su documento de certificación.
- Una empresa cliente consulta el avance y resultados de sus propios trabajadores (sin ver información de otras empresas).
- Un coordinador o administrador genera un reporte operativo y lo exporta a PDF/Excel.

## Siguiente paso

Este documento queda cerrado para efectos de pasar a `docs/02-diseno/`, salvo los 2-3 puntos marcados `[VALIDAR]` que son de bajo riesgo (recuperación de contraseña, estatus "cancelado" de un curso, criterio de aprobación por estándar) — se pueden resolver sobre la marcha durante el Diseño sin bloquear el arranque de esa fase.
