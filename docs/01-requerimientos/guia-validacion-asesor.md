# Guía de validación de requerimientos con el asesor empresarial

Preguntas para la reunión con Juan Alexis García Gómez, organizadas por módulo. El objetivo es resolver cada punto `[VALIDAR]` de `requerimientos.md`. Llévate este archivo (impreso o en pantalla) y anota las respuestas directamente aquí o en `requerimientos.md`.

Consejo: para cada módulo, antes de preguntar por el sistema nuevo, pregunta primero cómo lo hacen HOY (aunque sea manual) — eso evita diseñar algo que no calza con su operación real.

## General / transversal

- ¿Quién más, además de ti, usaría el sistema día a día? (para confirmar el catálogo real de roles: administrador, instructor, participante, ¿alguno más?)
- ¿Hay algo de la acreditación ECE516-22 / los lineamientos de CONOCER que el sistema deba respetar sí o sí (formatos, plazos, información obligatoria)?
- De los 4 módulos principales (Usuarios, Cursos y Participantes, Aprendizaje y Evaluaciones, Certificaciones), ¿cuál te resolvería el dolor más urgente si tuviera que priorizarse primero?

## Módulo: Usuarios

- ¿Qué roles necesitas realmente? (¿administrador, instructor, participante — falta alguno?)
- ¿Cada rol necesita ver/hacer cosas distintas, o algunos roles comparten los mismos permisos?
- Si alguien olvida su contraseña, ¿prefieres que se la restablezcas tú manualmente, o que el sistema tenga una opción de "recuperar contraseña" por correo?

## Módulo: Cursos y participantes

- Cuando registras un curso hoy (aunque sea en Excel), ¿qué datos capturas? (nombre, estándar CONOCER, fechas, instructor, cupo, ¿algo más?)
- ¿Un curso tiene un cupo máximo de participantes?
- ¿Qué estados pasa un curso en su ciclo de vida? (por ejemplo: planeado → en curso → finalizado — ¿se cancelan cursos alguna vez?)
- ¿Los participantes se inscriben ellos mismos, o siempre los inscribe alguien de CINDEC?
- ¿Un mismo participante puede tomar varios cursos a la vez o en distintos periodos? (para confirmar que el historial por participante es relevante, como ya asume el anteproyecto)

## Módulo: Aprendizaje y evaluaciones

- Los materiales de aprendizaje que usan hoy, ¿en qué formato están? (PDF, presentaciones, videos, ligas externas)
- ¿Las evaluaciones son de opción múltiple, abiertas, o una mezcla?
- ¿Las evaluaciones se resuelven en algún sistema/formulario, o se aplican de forma presencial/física y solo se captura el resultado?
- ¿Cuál es la calificación mínima para aprobar?
- ¿Se permite repetir una evaluación si no se aprueba? ¿Cuántas veces?

## Módulo: Certificaciones

- ¿Qué información lleva obligatoriamente una constancia hoy? (idealmente, muéstrame un ejemplo de una constancia que ya hayan emitido)
- ¿La constancia debe llevar algún folio o código de verificación único?
- Una vez generada la constancia, ¿cómo se la hacen llegar al participante? (¿descarga directa, envío por correo, ambas?)
- ¿Hay un periodo de vigencia para las certificaciones, o son permanentes?

## Módulo: Reportes

> Este es el módulo con menos información en el anteproyecto — es el que más se beneficia de esta plática.

- Cuando necesitas armar un reporte hoy (para un cliente, para ustedes mismos, o para CONOCER), ¿qué reporte es el que más pides o el que más trabajo te cuesta armar?
- ¿Necesitas reportes por participante, por curso, por instructor, por periodo de tiempo, o combinaciones?
- ¿Alguno de esos reportes lo necesitas poder exportar (PDF, Excel) para enviarlo a alguien fuera del sistema?

---

## Registro de respuestas

> Llenar durante o después de la reunión. Una vez lleno, regresar a `requerimientos.md` y quitar las etiquetas `[VALIDAR]` ya resueltas.

**Fecha de la reunión:**

**Respuestas:**

- (pendiente)
