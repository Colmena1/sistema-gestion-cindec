# Documento de requerimientos

**Estado:** Nivel 1 validado con CINDEC

**Importante — alcance:** este documento es el alcance **V1, el que se entrega en la residencia**

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
- **RF-USR-03:** El sistema debe restringir el acceso a las funcionalidades de cada módulo según el rol del usuario autenticado, incluyendo qué puede *consultar* y qué puede *modificar* cada rol (ver tabla de permisos abajo).
- **RF-USR-04:** El sistema debe permitir a un administrador crear, editar y activar/desactivar cuentas de usuario, con auditoría de cambios sobre configuración y registros sensibles.
- **RF-USR-05:** El sistema debe permitir iniciar sesión mediante correo electrónico y contraseña.
- **RF-USR-06:** El sistema debe permitir la recuperación de contraseña mediante un enlace enviado por correo electrónico

> **Nota de alcance (corregido 2026-10-01):** El rol "Empresa cliente" se retira por completo de V1 por restricción de tiempo de desarrollo — no se implementa ni siquiera en su versión acotada de solo consulta. V1 queda con cinco roles: Administrador general, Coordinador de capacitación, Instructor, Evaluador y Participante. Todo el seguimiento de participantes por empresa lo realiza el personal de CINDEC a través de los módulos existentes. El rol completo (acotado y completo) se traslada íntegramente a `vision-futura-cindec.md`.




### Módulo: Cursos, grupos y participantes

- **RF-CUR-01:** El sistema debe permitir registrar cursos con: nombre/estándar de competencia asociado, modalidad (presencial / en línea / mixta), fechas, cupo, instructor y evaluador asignados.
- **RF-CUR-02:** El sistema debe permitir crear grupos dentro de un curso (varios grupos pueden compartir el mismo curso/estándar en distintas fechas).
- **RF-CUR-03:** El sistema debe permitir el autorregistro de un participante mediante un formulario digital (datos personales, contacto, curso de interés, documentación necesaria) — confirmado explícitamente por CINDEC como necesidad ("se requiere un formulario digital para que el participante pueda registrarse por sí mismo").
- **RF-CUR-04:** El sistema debe permitir que un coordinador asigne participantes a cursos/grupos, controlando el cupo disponible.
- **RF-CUR-05:** El sistema debe permitir registrar instructores y evaluadores, y asignarlos a uno o más cursos/grupos.
- **RF-CUR-06:** El sistema debe permitir consultar, desde un solo lugar, el historial completo de cursos, evaluaciones y certificaciones de un participante.
- **RF-CUR-07:** El sistema debe permitir consultar el historial de cursos impartidos por un instructor y de evaluaciones realizadas por un evaluador.
- **RF-CUR-08:** El sistema debe permitir dar seguimiento al estatus de un curso/grupo (al menos: planeado, en curso, concluido;) 
- **RF-CUR-09 (modalidad en línea/mixta):** Cuando el curso sea en línea o mixto, el sistema debe permitir registrar un enlace de videoconferencia, calendario y horario asociados al grupo.
- **RF-CUR-10 (asistencia):** El sistema debe permitir registrar la asistencia de los participantes en sesiones presenciales o mixtas.

### Módulo: Aprendizaje

- **RF-APR-01:** El sistema debe permitir cargar y organizar materiales de aprendizaje asociados a un curso: manuales, presentaciones, documentos PDF, ejercicios y videos (o enlaces a video).
- **RF-APR-02:** El sistema debe permitir a los participantes consultar y descargar los materiales del curso en el que están inscritos.
- **RF-APR-03:** El sistema debe permitir consultar, por participante, qué materiales ha revisado (para el indicador de "materiales consultados" pedido por CINDEC).


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
  - Historial de certificaciones
  - Reportes por instructor y por evaluador
- **RF-REP-02:** Los reportes deben poder exportarse (al menos PDF o Excel) para enviarse fuera del sistema.


### Notificaciones (nuevo, dentro de alcance V1)

- **RF-NOT-01:** El sistema debe enviar confirmaciones y recordatorios por correo electrónico (registro exitoso, próxima sesión, evaluación pendiente, certificación emitida).



## 2. Requerimientos no funcionales
Requerimientos no funcionales
Compatibilidad

RNF-01: El sistema deberá ser accesible mediante navegadores web de escritorio modernos, incluyendo Google Chrome, Microsoft Edge y Mozilla Firefox, sin requerir la instalación de software adicional por parte del usuario.

RNF-02: La interfaz deberá adaptarse a diferentes resoluciones de pantalla para permitir su utilización desde equipos de escritorio y dispositivos móviles mediante navegador web.

Seguridad

RNF-03: El sistema deberá controlar el acceso a módulos y funcionalidades mediante autenticación y autorización basada en el rol del usuario.

RNF-04: El sistema deberá restringir las operaciones de consulta, creación, modificación y eliminación de información de acuerdo con los permisos establecidos para cada rol.

RNF-05: Las contraseñas de los usuarios deberán almacenarse utilizando mecanismos de protección que eviten su almacenamiento en texto plano.

RNF-06: El sistema deberá proteger los resultados de evaluación y los documentos de certificación contra modificaciones realizadas por usuarios no autorizados.

RNF-07: El sistema deberá registrar las operaciones relevantes realizadas sobre información sensible, identificando al usuario que realizó la operación y la fecha correspondiente.

Integridad de la información

RNF-08: El sistema deberá mantener la integridad de la información relacionada con participantes, cursos, evaluaciones y certificaciones durante las operaciones de registro y modificación.

RNF-09: El sistema deberá validar los datos ingresados en los formularios antes de almacenarlos en la base de datos.

RNF-10: El sistema deberá evitar la eliminación o modificación accidental de información asociada a procesos de evaluación y certificación mediante mecanismos de control de acceso y validación.

Usabilidad

RNF-11: La interfaz del sistema deberá presentar una estructura de navegación clara y consistente entre los diferentes módulos.

RNF-12: El sistema deberá proporcionar mensajes comprensibles al usuario cuando una operación sea completada correctamente o cuando se produzca un error de validación.

RNF-13: Las funciones disponibles para cada tipo de usuario deberán presentarse de acuerdo con su rol y permisos correspondientes.

Rendimiento

RNF-14: El sistema deberá proporcionar tiempos de respuesta adecuados para las operaciones habituales de consulta, registro y actualización de información bajo las condiciones de operación definidas para la V1.

RNF-15: El sistema deberá gestionar las consultas de información sin generar cargas innecesarias sobre la base de datos.

Mantenibilidad

RNF-16: La arquitectura del sistema deberá estar organizada de forma modular, separando las responsabilidades de presentación, lógica de negocio y acceso a datos.

RNF-17: Los módulos del sistema deberán mantener una separación lógica por dominio funcional, incluyendo al menos usuarios, cursos, aprendizaje, evaluaciones y certificaciones.

RNF-18: El código fuente deberá mantenerse organizado y documentado para facilitar futuras modificaciones y mantenimiento.

Escalabilidad

RNF-19: La arquitectura del sistema deberá permitir incorporar nuevos módulos y funcionalidades sin requerir una reestructuración completa del sistema.

RNF-20: La estructura de la base de datos deberá permitir el crecimiento de registros de usuarios, participantes, cursos, evaluaciones y certificaciones.

RNF-21: El diseño del sistema deberá considerar la posibilidad de incorporar posteriormente funcionalidades para la gestión de múltiples empresas.

## 3. Casos de uso (nivel alto — se detallan como diagramas UML en la fase de Diseño)

- Un coordinador crea un curso/grupo y asigna instructor y evaluador.
- Un participante se autorregistra mediante el formulario público y queda pendiente de asignación a un curso.
- Un coordinador asigna al participante a un curso/grupo, respetando el cupo.
- Un instructor sube materiales de aprendizaje y pasa lista de asistencia.
- Un evaluador registra evidencias y el resultado (competente / no competente) de un participante.
- Un administrador registra la solicitud de certificación ante CONOCER para un participante competente, y después adjunta el documento oficial cuando CONOCER lo emite.
- Un participante consulta su historial completo (cursos, evaluaciones, certificaciones) y descarga su documento de certificación.
- Un coordinador o administrador genera un reporte operativo y lo exporta a PDF/Excel.

