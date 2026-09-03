# Guía de validación de requerimientos con el asesor empresarial

Preguntas para la reunión con Juan Alexis García Gómez, organizadas por módulo. El objetivo es resolver cada punto `[VALIDAR]` de `requerimientos.md`. Llévate este archivo (impreso o en pantalla) y anota las respuestas directamente aquí o en `requerimientos.md`.

Consejo: para cada módulo, antes de preguntar por el sistema nuevo, pregunta primero cómo lo hacen HOY (aunque sea manual) — eso evita diseñar algo que no calza con su operación real.

## 0. Documentos y ejemplos a solicitar

No solo preguntar — pedirle que te comparta (foto, PDF o el archivo original, lo que tenga a la mano) estos artefactos reales. Un ejemplo real vale más que la descripción de memoria, y evita que se te pase un campo que sí usan siempre:

- Una constancia/certificado ya emitido (aunque le tache los datos personales si le incomoda).
- El archivo de Excel (o formato físico) donde hoy registran participantes.
- Un ejemplo de evaluación que apliquen actualmente, si tienen alguna estandarizada.
- Algún reporte que hayan tenido que armar manualmente para un cliente o para CONOCER.
- Su manual de identidad o logo en alta resolución, si quieren que el sistema lo lleve (ver punto 4).

## 1. General / transversal

- ¿Quién más, además de ti, usaría el sistema día a día? (para confirmar el catálogo real de roles: administrador, instructor, participante, ¿alguno más?)
- ¿Hay algo de la acreditación ECE516-22 / los lineamientos de CONOCER que el sistema deba respetar sí o sí (formatos, plazos, información obligatoria)?
- De los 4 módulos principales (Usuarios, Cursos y Participantes, Aprendizaje y Evaluaciones, Certificaciones), ¿cuál te resolvería el dolor más urgente si tuviera que priorizarse primero?

## 2. Módulo: Usuarios

- ¿Qué roles necesitas realmente? (¿administrador, instructor, participante — falta alguno?)
- ¿Cada rol necesita ver/hacer cosas distintas, o algunos roles comparten los mismos permisos?
- Si alguien olvida su contraseña, ¿prefieres que se la restablezcas tú manualmente, o que el sistema tenga una opción de "recuperar contraseña" por correo?

## 3. Módulo: Cursos y participantes

- Cuando registras un curso hoy (aunque sea en Excel), ¿qué datos capturas? (nombre, estándar CONOCER, fechas, instructor, cupo, ¿algo más?)
- ¿Un curso tiene un cupo máximo de participantes?
- ¿Qué estados pasa un curso en su ciclo de vida? (por ejemplo: planeado → en curso → finalizado — ¿se cancelan cursos alguna vez?)
- ¿Los participantes se inscriben ellos mismos, o siempre los inscribe alguien de CINDEC?
- ¿Un mismo participante puede tomar varios cursos a la vez o en distintos periodos? (para confirmar que el historial por participante es relevante, como ya asume el anteproyecto)

## 4. Módulo: Aprendizaje y evaluaciones

- Los materiales de aprendizaje que usan hoy, ¿en qué formato están? (PDF, presentaciones, videos, ligas externas)
- ¿Las evaluaciones son de opción múltiple, abiertas, o una mezcla?
- ¿Las evaluaciones se resuelven en algún sistema/formulario, o se aplican de forma presencial/física y solo se captura el resultado?
- ¿Cuál es la calificación mínima para aprobar?
- ¿Se permite repetir una evaluación si no se aprueba? ¿Cuántas veces?

## 5. Módulo: Certificaciones

- ¿Qué información lleva obligatoriamente una constancia hoy? (idealmente, muéstrame un ejemplo de una constancia que ya hayan emitido)
- ¿La constancia debe llevar algún folio o código de verificación único?
- Una vez generada la constancia, ¿cómo se la hacen llegar al participante? (¿descarga directa, envío por correo, ambas?)
- ¿Hay un periodo de vigencia para las certificaciones, o son permanentes?

## 6. Módulo: Reportes

> Este es el módulo con menos información en el anteproyecto — es el que más se beneficia de esta plática.

- Cuando necesitas armar un reporte hoy (para un cliente, para ustedes mismos, o para CONOCER), ¿qué reporte es el que más pides o el que más trabajo te cuesta armar?
- ¿Necesitas reportes por participante, por curso, por instructor, por periodo de tiempo, o combinaciones?
- ¿Alguno de esos reportes lo necesitas poder exportar (PDF, Excel) para enviarlo a alguien fuera del sistema?

## 7. Datos operativos para dimensionar el sistema

No para prometer un número de rendimiento (el alcance sigue siendo un prototipo local), sino para que el diseño de la base de datos y de las pantallas no se quede corto ni sea exagerado para lo que realmente manejan:

- Aproximadamente, ¿cuántos cursos manejan al mes o al año, y cuántos participantes por curso? (una cifra aproximada, no exacta — solo para no diseñar pensando en 10 cuando manejan 500, o al revés)
- ¿Cuántas personas usarían el sistema al mismo tiempo? (probablemente pocas, dado que es un equipo pequeño — pero confirmarlo)
- ¿En qué equipo se instalaría el sistema al terminar la residencia? (¿la computadora de alguien en particular, un equipo dedicado, algo que aún no tienen?) — el anteproyecto dice "entorno local (equipo o servidor local)" sin especificar cuál; no cambia el desarrollo, pero sí ayuda a anticipar la fase de implementación (semana 48).

## 8. Protección de datos personales

El sistema va a manejar datos personales de participantes (nombre, y posiblemente correo, teléfono o CURP). En México esto puede estar sujeto a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares — vale la pena preguntar, no asumir:

- ¿CINDEC ya tiene un aviso de privacidad para los datos que recolecta de sus participantes?
- ¿Hay algún dato personal que NO se deba capturar o mostrar libremente en el sistema (por ejemplo, restringir quién ve datos de contacto completos)?

> Esto es una pregunta a validar con el asesor, no una asesoría legal — si CINDEC no tiene claridad sobre esto, se puede anotar como riesgo/limitación del proyecto en vez de bloquear el desarrollo.

## 9. Identidad institucional

- ¿Quieren que el sistema lleve el logo y/o los colores institucionales de CINDEC, o una interfaz genérica es suficiente para esta primera versión?

## 10. Cadencia de seguimiento del proyecto

Como el anteproyecto ya define Scrum + modelo incremental como metodología, vale la pena acordar esto desde ahora en vez de improvisarlo después:

- ¿Cada cuánto le gustaría a Juan Alexis ver avances del sistema? (¿semanal, quincenal, al cierre de cada módulo?)
- ¿Prefiere una demo del sistema funcionando, un reporte escrito, o ambos?

## 11. Priorización de módulos (MoSCoW)

El cronograma es fijo (Desarrollo concentrado en semanas 41-46), así que conviene saber desde ahora qué es innegociable y qué se puede recortar si el tiempo aprieta. Llenar esta tabla con Juan Alexis:

| Módulo / funcionalidad | Must have (indispensable) | Should have (importante, no bloquea) | Could have (deseable si hay tiempo) | Won't have (fuera de esta versión) |
|---|---|---|---|---|
| Gestión de usuarios | | | | |
| Gestión de cursos y participantes | | | | |
| Gestión del aprendizaje y evaluaciones | | | | |
| Gestión de certificaciones | | | | |
| Reportes | | | | |

---

## Registro de respuestas

> Llenar durante o después de la reunión. Una vez lleno, regresar a `requerimientos.md` y quitar las etiquetas `[VALIDAR]` ya resueltas.

**Fecha de la reunión:**

**Respuestas:**

- (pendiente)
