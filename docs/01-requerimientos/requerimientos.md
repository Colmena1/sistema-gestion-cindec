# Documento de requerimientos (borrador)

**Estado:** BORRADOR — construido a partir del anteproyecto ya aprobado (Planteamiento del Problema, Objetivos específicos, Alcances y Alcance técnico). Pendiente de validar con Juan Alexis García Gómez (asesor empresarial CINDEC). Ver `guia-validacion-asesor.md` para las preguntas puntuales que faltan por confirmar.

Cada requerimiento que depende de un dato que el anteproyecto no especifica está marcado como `[VALIDAR]` — no se inventó ningún campo, regla o cifra que no esté ya sustentado en el anteproyecto o en la información pública de CINDEC.

## 1. Requerimientos funcionales

### Módulo: Usuarios

- **RF-USR-01:** El sistema debe permitir registrar usuarios con al menos nombre, correo electrónico y contraseña.
- **RF-USR-02:** El sistema debe permitir asignar un rol a cada usuario, de acuerdo con las funciones que desempeña dentro de la plataforma. `[VALIDAR: catálogo exacto de roles — el anteproyecto habla de "diferentes roles y niveles de acceso" sin listarlos; se asume al menos administrador, instructor y participante por ser los tres actores que aparecen en el resto del anteproyecto]`.
- **RF-USR-03:** El sistema debe restringir el acceso a las funcionalidades de cada módulo según el rol del usuario autenticado.
- **RF-USR-04:** El sistema debe permitir a un administrador crear, editar y activar/desactivar cuentas de usuario.
- **RF-USR-05:** El sistema debe permitir iniciar sesión mediante correo electrónico y contraseña.
- **RF-USR-06:** `[VALIDAR]` ¿Se requiere recuperación de contraseña por correo, o el administrador la restablece manualmente? El anteproyecto no lo especifica.

### Módulo: Cursos y participantes

- **RF-CUR-01:** El sistema debe permitir registrar cursos. `[VALIDAR: campos exactos — por ejemplo nombre del curso, estándar de competencia CONOCER asociado, instructor asignado, fechas de inicio/fin, cupo]`.
- **RF-CUR-02:** El sistema debe permitir registrar participantes e inscribirlos a uno o más cursos.
- **RF-CUR-03:** El sistema debe permitir registrar instructores y asignarlos a uno o más cursos.
- **RF-CUR-04:** El sistema debe permitir consultar, desde un solo lugar, el historial de cursos de un participante — resuelve directamente el problema descrito en el anteproyecto de "sin historial digital accesible".
- **RF-CUR-05:** El sistema debe permitir consultar el historial de cursos impartidos por un instructor.
- **RF-CUR-06:** El sistema debe permitir dar seguimiento al estatus de un curso. `[VALIDAR: estados exactos del ciclo de vida de un curso, p. ej. planeado / en curso / finalizado / cancelado]`.

### Módulo: Aprendizaje y evaluaciones

- **RF-APR-01:** El sistema debe permitir asociar materiales de aprendizaje a un curso. `[VALIDAR: tipo de materiales — documentos PDF, presentaciones, enlaces a video, etc.]`.
- **RF-APR-02:** El sistema debe permitir a los participantes consultar los materiales de aprendizaje del curso en el que están inscritos.
- **RF-APR-03:** El sistema debe permitir crear evaluaciones asociadas a un curso.
- **RF-APR-04:** El sistema debe permitir aplicar evaluaciones a los participantes de un curso. `[VALIDAR: tipo de evaluación — opción múltiple, abierta o mixta; si se resuelve dentro del sistema o solo se captura un resultado obtenido de forma externa]`.
- **RF-APR-05:** El sistema debe permitir consultar los resultados de las evaluaciones de un participante. `[VALIDAR: calificación mínima aprobatoria y si se permite más de un intento]`.

### Módulo: Certificaciones

- **RF-CERT-01:** El sistema debe permitir generar una constancia digital para un participante que haya concluido/aprobado un curso.
- **RF-CERT-02:** El sistema debe permitir consultar el historial de constancias emitidas para un participante.
- **RF-CERT-03:** El sistema debe permitir a un administrador consultar y administrar las constancias generadas por la plataforma.
- **RF-CERT-04:** `[VALIDAR]` ¿Qué información es obligatoria en la constancia según los lineamientos de la acreditación ECE516-22 / estándares CONOCER? (por ejemplo, folio, sello, datos del estándar de competencia, vigencia).
- **RF-CERT-05:** `[VALIDAR]` ¿La constancia se descarga en PDF, se envía automáticamente por correo, o ambas cosas?
- **RF-CERT-06:** `[VALIDAR]` ¿Se requiere algún código o folio de verificación único por constancia?

### Módulo: Reportes

> El anteproyecto no detalla el contenido de este módulo en el texto (solo aparece como actividad de desarrollo en el cronograma: "Desarrollo del módulo de reportes"). Es el módulo con más huecos por confirmar.

- **RF-REP-01:** `[VALIDAR]` El sistema debe generar reportes — falta definir con CINDEC qué reportes son realmente útiles (¿participantes certificados por periodo? ¿cursos impartidos por instructor? ¿estatus general de un curso?).

## 2. Requerimientos no funcionales

- **RNF-01:** La aplicación debe ser accesible desde navegadores estándar de escritorio (Chrome, Edge, Firefox), sin requerir instalación adicional por parte del usuario. *(ya comprometido en el anteproyecto)*
- **RNF-02:** El sistema se implementará y validará en un entorno local durante el periodo de residencia profesional, sin desplegarse en un ambiente de producción. *(ya comprometido)*
- **RNF-03:** El sistema no requiere conexión permanente a internet para su funcionamiento local, salvo que durante el análisis se defina una integración con consultas externas relacionadas con los estándares CONOCER. `[VALIDAR: si esa integración es necesaria o no]`.
- **RNF-04:** El sistema no incluirá una aplicación móvil nativa en esta primera versión, solo aplicación web. *(ya comprometido)*
- **RNF-05:** El sistema no contempla integración con plataformas de pago ni servicios de terceros que no sean indispensables para su funcionamiento. *(ya comprometido)*
- **RNF-06:** La arquitectura debe diseñarse de forma modular para facilitar su crecimiento futuro, aunque el soporte multiempresa o en la nube queda fuera del alcance de esta versión. *(ya comprometido)*
- **RNF-07:** El acceso a cada módulo debe estar controlado por el rol del usuario autenticado.

## 3. Casos de uso (nivel alto — se detallan como diagramas UML en la fase de Diseño)

- Un administrador registra un nuevo curso y asigna un instructor.
- Un administrador inscribe (o el propio participante se inscribe, según se valide) a un participante en un curso.
- Un instructor sube materiales de aprendizaje para su curso.
- Un participante consulta los materiales y presenta una evaluación de su curso.
- Un administrador genera la constancia digital de un participante que aprobó un curso.
- Un administrador consulta el historial completo de un participante (cursos, evaluaciones, constancias) desde un solo lugar.

## Siguiente paso

Revisar `guia-validacion-asesor.md` antes de la reunión con Juan Alexis. Cada `[VALIDAR]` de este documento debe quedar resuelto (o explícitamente pospuesto) antes de pasar a `docs/02-diseno/`.
