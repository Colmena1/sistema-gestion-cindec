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
