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
