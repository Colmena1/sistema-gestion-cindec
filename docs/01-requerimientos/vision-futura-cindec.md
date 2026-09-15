# Visión futura de CINDEC (fuera del alcance de la residencia)

> Este documento NO es un compromiso de esta residencia. Registra, con el mismo nivel de detalle que dio CINDEC en la entrevista de requerimientos (2026-09-15), la visión de producto a la que la arquitectura del sistema debe quedar abierta a crecer — tal como ya dice la sección "Limitaciones" del anteproyecto aprobado: *"la implementación de características orientadas a un entorno multiempresa o en la nube quedará considerada como trabajo futuro"*. Ver `docs/00-decisiones/ADR-0002-alcance-v1-vs-vision-futura.md` para la justificación completa de este corte.

## Plataforma SaaS multiempresa

CINDEC visualiza el sistema evolucionando hacia una plataforma que otras empresas (sus clientes) puedan usar directamente:

- Cada empresa cliente tendría su propio espacio de administración, con acceso independiente y controlado, sin visualizar información de otras empresas (aislamiento de datos por empresa / multi-tenancy real).
- Cada empresa podría administrar de forma autónoma: registro de sus trabajadores, inscripción a cursos, creación de grupos, consulta de avances, control de asistencia, seguimiento de evaluaciones, consulta de resultados autorizados, descarga de constancias/certificados, y reportes de capacitación de su personal.
- CINDEC conservaría el control de los procesos de certificación en todo momento; cada empresa solo administraría su propia información.

## Portal empresarial (módulo dedicado)

Un módulo propio, separado de la administración interna de CINDEC, para que las empresas clientes operen de forma self-service (alta de su propia cuenta, sus propios usuarios, sin intervención de CINDEC).

## Verificación pública de constancias

- Verificador digital accesible desde internet (no solo desde dentro del sistema), donde cualquier persona pueda introducir un folio o escanear un código QR impreso en la constancia y confirmar si el documento es auténtico y vigente.
- Requiere que una parte del sistema esté desplegada en un ambiente de producción con acceso público — justo lo que las Limitaciones del anteproyecto excluyen para el periodo de residencia.
- Nota técnica para cuando se retome: la V1 ya deja el terreno preparado — cada certificación registrada tiene folio único, solo falta exponer una página de consulta públicamente en un hosting real.

## Notificaciones por WhatsApp

Automatizar confirmaciones y recordatorios por WhatsApp, además de correo electrónico. Requiere contratar una API de terceros (por ejemplo, WhatsApp Business API vía un proveedor), lo cual entra en conflicto con la Limitación de "no integraciones con servicios de terceros que no sean indispensables". Las notificaciones por correo electrónico sí son viables dentro del alcance V1 (no dependen de un servicio de pago de terceros para funcionar a nivel básico) — ver `requerimientos.md`.

## Facturación y control de pagos

Gestionar cobros, ingresos por curso/servicio y reportes financieros dentro del propio sistema. Explícitamente fuera de alcance según la Limitación "no contempla integración con plataformas de pago".

## Aulas virtuales autodidactas

Ir más allá de "consultar y descargar materiales de un curso" (que sí está en el alcance V1) hacia una experiencia de aprendizaje autoguiado: secuencia de lecciones, seguimiento automático de progreso por contenido, posiblemente evaluaciones automatizadas dentro de un entorno tipo LMS completo.

## Reportes comerciales y financieros

- Reporte de ingresos por curso o servicio (depende de que exista el módulo de facturación).
- Reportes de desempeño y conversión comercial (más cercano a un CRM que a un sistema de gestión de capacitación/certificación).

## Rol "Empresa cliente" en su forma completa

En V1 se incluye una versión acotada de este rol: una empresa puede ver el avance/resultados de sus propios trabajadores, filtrado por una relación simple participante-empresa (ver `requerimientos.md`, RF-USR-02). La versión completa —donde la empresa se auto-registra y administra su propia cuenta, cursos y usuarios sin intervención de CINDEC— es parte de la visión SaaS y queda para después.
