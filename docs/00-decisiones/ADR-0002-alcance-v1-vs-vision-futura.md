# ADR-0002: Alcance de la residencia (V1) frente a la visión de plataforma SaaS de CINDEC

**Status:** Accepted
**Date:** 2026-09-15
**Deciders:** Angel Mauricio Monjaraz Colmenero (residente) — pendiente de comunicar a Juan Alexis García Gómez y al asesor académico Mosiño Juan Francisco

## Context

El levantamiento de requerimientos con CINDEC (respuestas registradas el 2026-09-15, ver `docs/01-requerimientos/requerimientos.md`) reveló que CINDEC tiene una visión de producto considerablemente más grande que el alcance ya aprobado en el anteproyecto: una plataforma SaaS multiempresa con portal propio por empresa cliente, verificación pública de constancias por código QR, notificaciones por WhatsApp, facturación/control de pagos, y aulas virtuales autodidactas.

El anteproyecto de residencia, ya aprobado por los revisores académicos, define explícitamente en su sección de Limitaciones:

- "la implementación de características orientadas a un entorno multiempresa o en la nube quedará considerada como trabajo futuro"
- "El sistema se desarrollará y validará en un entorno local... sin desplegarse en un ambiente de producción durante el periodo de residencia"
- "El proyecto no contempla la integración con plataformas de pago, servicios de terceros o aplicaciones externas que no sean indispensables"

Restricciones adicionales al momento de esta decisión: semana 38 del cronograma; queda 1 semana de la fase de Análisis y la fase de Desarrollo son las semanas 41-46 (8 semanas hasta el fin de Desarrollo, de las cuales solo 41-46 son desarrollo real). Un solo desarrollador, con experiencia web/BD limitada (ver ADR-0001).

## Decision

Se separa el trabajo en dos capas, documentadas por separado:

1. **V1 — Alcance de la residencia** (`docs/01-requerimientos/requerimientos.md`): todo lo que se compromete a construir y defender dentro del periodo de residencia. Es una versión refinada de los requerimientos ya aprobados en el anteproyecto, ahora con el detalle real que dio CINDEC en la entrevista (roles, campos, proceso real de certificación con CONOCER, reportes operativos).
2. **Visión futura** (`docs/01-requerimientos/vision-futura-cindec.md`): todo lo que CINDEC pidió que excede el alcance ya aprobado (multiempresa/SaaS, verificación pública por QR, WhatsApp, pagos/facturación, aulas virtuales autodidactas completas, reportes comerciales). Se documenta con el mismo nivel de detalle que dio CINDEC, para no perder la información — pero etiquetado explícitamente como trabajo futuro, no como compromiso de esta residencia.

Este ADR no cambia ninguna decisión previa — la Limitación de "multiempresa/nube = trabajo futuro" ya estaba en el anteproyecto desde antes de esta entrevista; este documento solo aplica esa limitación ya aprobada a la información nueva.

## Options Considered

### Opción A: Construir todo lo que pidió CINDEC en la entrevista

| Dimensión | Evaluación |
|---|---|
| Alineación con lo ya aprobado | Baja — contradice directamente la sección de Limitaciones ya aprobada por los revisores académicos |
| Riesgo de cronograma | Muy alto — 6 semanas reales de desarrollo, un solo desarrollador con web/BD como su punto más débil |
| Satisfacción de CINDEC a corto plazo | Alta |

**Pros:** satisface por completo la visión de CINDEC de una vez.
**Cons:** requeriría re-tramitar el anteproyecto o arriesgarse a entregar algo distinto a lo comprometido; alto riesgo real de no terminar ni la versión básica.

### Opción B: Ignorar lo que dijo CINDEC y quedarse solo con lo que ya estaba en el anteproyecto

**Pros:** cero riesgo de desviarse del cronograma.
**Cons:** desperdicia información valiosa y real de la entrevista (roles reales, el hallazgo de que CONOCER es quien emite el documento oficial, campos reales de un curso, etc.); no aprovecha que el propio anteproyecto ya promete una arquitectura "modular y escalable... orientada a facilitar futuras ampliaciones".

### Opción C (elegida): V1 acotado al anteproyecto pero informado por la entrevista, + documento de Visión futura

**Pros:** aprovecha toda la información nueva de la entrevista sin comprometerse a construir más de lo ya aprobado; dejar la visión de SaaS documentada demuestra que el residente entendió el panorama completo y diseñó la arquitectura pensando en él, sin arriesgar la entrega; es consistente con la metodología incremental ya comprometida (cada incremento es un módulo validable, no todo el producto de una vez).
**Cons:** requiere una conversación explícita con Juan Alexis para alinear expectativas entre "lo que se entrega en la residencia" y "lo que se documenta como visión a futuro".

## Trade-off Analysis

La opción C es la única que no obliga a elegir entre "quedar bien con CINDEC" y "cumplir lo ya comprometido académicamente" — separa ambas cosas en dos documentos en vez de forzar una sola lista de requerimientos a cumplir las dos funciones a la vez. El riesgo real de la opción C es de comunicación, no técnico: hay que ser explícito con Juan Alexis de que la plataforma SaaS multiempresa es la dirección a la que la arquitectura ya apunta, pero no lo que se entrega al cierre de la residencia (semana 48).

## Consequences

- Se vuelve más fácil: cerrar `requerimientos.md` sin ambigüedad sobre qué construir primero; defender el alcance ante los revisores académicos (coincide con lo ya aprobado); priorizar el tiempo de desarrollo restante.
- Se vuelve más difícil: hay que tener la conversación explícita con Juan Alexis sobre el corte de alcance.
- Habrá que revisar más adelante: si CINDEC insiste en que alguna pieza de la Visión futura (por ejemplo, notificaciones por correo, más simple que WhatsApp) quepa dentro del alcance V1 sin poner en riesgo el cronograma — se evalúa caso por caso, no de entrada.

## Action Items

1. [ ] Compartir con Juan Alexis el corte entre `requerimientos.md` (V1) y `vision-futura-cindec.md`, para alinear expectativas antes de avanzar a Diseño.
2. [ ] Confirmar con el asesor académico si el hallazgo de que CONOCER emite el documento oficial (no CINDEC) amerita algún ajuste en el anteproyecto ya aprobado, o si con el detalle en `requerimientos.md` es suficiente.
3. [x] Registrar en `requerimientos.md` los requerimientos ya resueltos por la entrevista.
4. [x] Documentar en `vision-futura-cindec.md` lo que queda fuera del alcance V1.
