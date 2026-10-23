# ADR-0005 — La evaluación no se condiciona a la capacitación y terminología CONOCER

- **Estado:** Aceptado
- **Fecha:** 2026-10-23
- **Fase:** Desarrollo del Sistema (inicio del Sprint 4, semana 43)

## Contexto

En el Sprint 3 el sistema solo permitía evaluar a quien tenía la inscripción en "capacitación concluida". Al revisar los documentos oficiales que proporcionó CINDEC se encontró que:

1. El **Convenio de Colaboración ECE-CE** (cláusula A.10) establece que "por ningún motivo" se debe condicionar la capacitación a un proceso de evaluación: el candidato decide si se capacita o no. La **Encuesta de satisfacción** y el **Manual de Operaciones M-DGAOSU-03** preguntan expresamente al candidato si fue condicionado a tomar un curso, y la auditoría anual revisa el criterio rector de **Libre Acceso** (Manual 4.10.1).
2. En el proceso CONOCER, el evaluador emite un **juicio de competencia** (Cédula de Evaluación) y después un **Grupo de Dictamen** lo ratifica como *procedente / no procedente*. El sistema llamaba "dictamen" a lo que captura el evaluador.
3. El nombre legal de CINDEC es **Compromiso Compartido, Centro Integral de Desarrollo y Capacitación A.C.** (ECE516-22); el logotipo usa la frase "Centro Integral de Desarrollo y Evaluación de Competencia Laboral".

## Decisión

- **Evaluación sin condicionar:** el evaluador asignado puede evaluar a cualquier participante **inscrito sin baja** en un grupo **en curso o concluido**, haya o no concluido la capacitación. "Capacitación concluida" se conserva como estado informativo del historial (RF-EVA-03 sigue distinguiendo los estados, pero no los encadena). Un candidato que solo quiere evaluarse se inscribe en un grupo y se evalúa sin marcar la capacitación.
- **Terminología:** en las pantallas y mensajes, lo que registra el evaluador se llama **"juicio de competencia"** (competente / todavía no competente). La columna `intento_evaluacion.dictamen` **no cambia** (ADR-0004: no se modifica el esquema en V1). El Grupo de Dictamen queda en `vision-futura-cindec.md`.
- **Nombre en reportes:** los reportes oficiales (PDF/Excel del Sprint 4) usan la **razón social** "Compromiso Compartido, Centro Integral de Desarrollo y Capacitación A.C." con la cédula ECE516-22.
- **Identidad gráfica:** se usa el logotipo vectorial oficial de la Red CONOCER para **Entidad de Certificación y Evaluación** (el de "Centro de Evaluación" no corresponde a CINDEC), con su color institucional (#611232), interior en blanco y a no menos de 1.7 × 3 cm (Manual de identidad Red CONOCER 2025, 6.2 y 6.4). No se usa el logotipo del CONOCER ni el del Gobierno del Estado de Guanajuato (el manual, 4.6, no autoriza la imagen institucional de Secretarías u otras dependencias).

## Consecuencias

- **Positivas:** el sistema respeta el criterio de Libre Acceso que se audita; el vocabulario coincide con los formatos oficiales que usa CINDEC; sin cambios en la base de datos.
- **Negativas:** un candidato solo de evaluación debe registrarse en un grupo; el ciclo completo de dictamen, cédula y portafolio queda pendiente para la visión futura.
