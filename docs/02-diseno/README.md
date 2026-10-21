# Diseño del Sistema

Corresponde a las actividades "Diseño de la arquitectura", "Diseño de la base de datos", "Modelo entidad-relación", "Diagramas UML" y "Prototipos de interfaces" del cronograma (semanas 39-41). Se llena una vez cerrado `docs/01-requerimientos/`, no antes.

Contenido esperado (entregable "Diseño completo del sistema" del Gantt):

- Diagrama de arquitectura del sistema.
- Modelo entidad-relación (y diccionario de datos).
- Diagramas UML (casos de uso, clases).
- Prototipos/mockups de las interfaces principales.

## Avance

| # | Actividad del cronograma | Documento | Estado |
|---|---|---|---|
| 1 | Diseño de la arquitectura del sistema | [`01-arquitectura.md`](01-arquitectura.md) · [ADR-0003](../00-decisiones/ADR-0003-estilo-arquitectonico.md) | Aprobado (2026-10-01) |
| 2 | Modelo entidad-relación | [`02-modelo-entidad-relacion.md`](02-modelo-entidad-relacion.md) | Aprobado (2026-10-01) |
| 3 | Diseño de la base de datos (lógico, normalización, físico y diccionario de datos) | [`03-diseno-logico.md`](03-diseno-logico.md) · [`03-2-normalizacion.md`](03-2-normalizacion.md) · [`03-3-diccionario-de-datos.md`](03-3-diccionario-de-datos.md) · scripts en [`sql/`](sql/) | Lógico y normalización aprobados; diseño físico construido y probado en MySQL 8.0 (en revisión) |
| 4 | Diagramas UML | [`04-uml-casos-de-uso.md`](04-uml-casos-de-uso.md), [`04-2-uml-clases.md`](04-2-uml-clases.md), [`04-3-uml-secuencia.md`](04-3-uml-secuencia.md) | Aprobado (2026-10-21) |
| 5 | Prototipos de interfaces | [`05-prototipos.md`](05-prototipos.md), [`05-2-guia-de-estilo.md`](05-2-guia-de-estilo.md) | Aprobado por el residente (2026-10-21); falta revisión del asesor empresarial |
| 6 | Entregable: Diseño completo del sistema | — | Pendiente |

Las imágenes de los diagramas están en `img/`; sus fuentes editables (HTML) en `img/fuentes/`.

