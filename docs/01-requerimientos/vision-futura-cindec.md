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

## Rol "Empresa cliente" (completo — ya no hay versión acotada en V1)

Inicialmente se había planeado incluir en V1 una versión acotada de este rol (una empresa consultando el avance/resultados de sus propios trabajadores). El 2026-10-01 se decidió sacar el rol completo de V1 por restricción de tiempo de desarrollo: ni la versión acotada ni la completa se implementan durante la residencia. En V1, todo el seguimiento de participantes por empresa lo realiza el personal de CINDEC (coordinador/administrador) a través de los módulos existentes, sin que la empresa tenga acceso propio al sistema.

La visión completa del rol —donde la empresa se auto-registra y administra su propia cuenta, cursos y usuarios sin intervención de CINDEC, incluyendo el acceso de solo consulta a sus propios resultados— queda íntegramente para después, como parte de la visión SaaS.

## Proceso completo de dictamen y portafolio CONOCER (agregado 2026-10-23)

Al revisar los documentos oficiales que proporcionó CINDEC (Manual de Operaciones de ECE/OC M-DGAOSU-03, Cédula de Evaluación, plantilla de Portafolio de Evidencias, Encuesta de satisfacción e informe de una auditoría anual) se identificaron partes del proceso que V1 no cubre. Se decidió no modificar la base de datos durante la residencia (ver `docs/00-decisiones/ADR-0005-evaluacion-sin-condicionar-y-terminologia-conocer.md`) y dejarlas aquí:

- **Grupo de Dictamen:** después del juicio de competencia del evaluador, un grupo impar (mínimo 3: dos expertos en la función y un representante de la ECE) revisa una muestra de portafolios y determina *procedente / no procedente*; solo lo procedente pasa a la solicitud de emisión. Requiere nuevas tablas (sesión de grupo, integrantes, resultado por portafolio).
- **Cédula de Evaluación completa:** mejores prácticas, áreas de oportunidad, reactivos no cubiertos, recomendaciones, incidencias, cédula de acreditación del evaluador y del centro evaluador, y acuse del candidato. V1 solo guarda "observaciones".
- **Portafolio de evidencias tipificado:** ficha de registro, diagnóstico, autorización de digitalización, plan de evaluación, instrumento aplicado, evidencias complementarias, cédula y encuesta, con lista de verificación por candidato (los hallazgos típicos de auditoría son portafolios perdidos, documentos o firmas faltantes y fechas inconsistentes).
- **Encuesta de satisfacción digital** del proceso de evaluación-certificación (se conserva 5 años y se revisa en auditoría).
- **Plazos oficiales con alertas:** solicitud de emisión ≤ 10 días hábiles después del dictamen; pago de la línea de captura ≤ 60 días naturales; envío de certificados por CONOCER ≤ 5 días hábiles después de confirmar el pago.
- **Vigencia del certificado por estándar** (por ejemplo, EC1564: 2 años), para calcularla en lugar de capturarla a mano.
- **Tipo de certificado** (impreso o digital, con o sin fotografía) y **autorización de publicación en el RENAP**.
- **Centros de Evaluación y Evaluadores Independientes externos** acreditados por CINDEC (por ejemplo, mediante convenio ECE-CE), con su propia cédula de acreditación.
- **Candidatos solo de evaluación** con registro propio (sin inscribirse a un grupo de capacitación). En V1 se atienden inscribiéndolos en un grupo sin exigir que concluyan la capacitación (ADR-0005).
