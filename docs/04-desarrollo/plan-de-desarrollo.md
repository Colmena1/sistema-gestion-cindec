# Plan de la fase de Desarrollo del Sistema

- **Aprobado por el residente:** 21-oct-2026 (semana 43)
- **Metodología:** Scrum + modelo incremental (sprints de 1 semana; ver `docs/bitacora-avance.md`)
- **Base:** ERS v1.2 (34 RF, 21 RNF), *Diseño completo del sistema* (`docs/02-diseno/`), ADR-0001, ADR-0003 y ADR-0004

## 1. Situación del calendario

La fase de Diseño concluyó el 21-oct-2026 (semana 43). Las actividades de Desarrollo programadas en las semanas 41 a 43 quedaron **aplazadas** y se atienden a partir de la semana 44, como se registra en las observaciones del diagrama de Gantt. La ventana disponible para Desarrollo es del 26-oct al 15-nov-2026 (3 semanas para 7 módulos), seguida de Pruebas, Documentación e Implementación (semanas 46-48).

Medidas para cumplir:

1. **Pruebas continuas:** cada módulo se prueba dentro de su propio sprint (API con Supertest y revisión manual). La semana de Pruebas e Integración se dedica a integrar, probar el flujo completo y corregir, no a probar desde cero.
2. **Prioridad dentro de cada módulo:** primero lo indispensable para el flujo principal (registro → inscripción → evaluación → certificación); lo complementario después. Ejemplos ya permitidos por la ERS: RF-REP-02 pide exportar "al menos PDF o Excel"; en RF-NOT-01 se cubren primero las confirmaciones y después los recordatorios.

## 2. Qué se construye

| Capa | Contenido |
|---|---|
| Presentación | SPA en React + Vite con las 25 pantallas de los prototipos, menú por rol (5 roles) y la guía de estilo de CINDEC |
| Lógica de negocio | API REST en Express (`/api/v1`), monolito modular: auth, usuarios, cursos, aprendizaje, evaluaciones, certificaciones, reportes, notificaciones |
| Datos | MySQL 8.0 `cindec_db` (ya construida con los scripts de `docs/02-diseno/sql/`); Sequelize solo como ORM sobre esas tablas (ADR-0004) |

## 3. Herramientas

| Propósito | Herramienta |
|---|---|
| Servidor y API | Node.js (LTS) + Express 4 |
| Acceso a datos | Sequelize 6 + mysql2 |
| Autenticación | jsonwebtoken (JWT) + bcryptjs |
| Validación en servidor (RNF-09) | express-validator |
| Seguridad de cabeceras y registro de peticiones | helmet, morgan |
| Carga de archivos | multer (carpeta `uploads/` fuera de lo público) |
| Correo (RF-NOT, RF-USR-06) | nodemailer; Mailtrap/Ethereal en desarrollo |
| Reportes exportables (RF-REP-02) | pdfkit y/o exceljs |
| Frontend | React + Vite, React Router, Axios, lucide-react |
| Pruebas | Jest + Supertest (API); Thunder Client / Postman (manual) |
| Entorno | VS Code, Git + GitHub (`Colmena1/sistema-gestion-cindec`), MySQL Workbench |

## 4. Procedimiento por módulo

1. **Modelo:** definir en Sequelize las tablas del módulo según el diccionario de datos.
2. **Servicio:** reglas de negocio (cupo, roles de instructor/evaluador, trámite solo con dictamen "competente", etc.). Solo los servicios acceden a la base de datos (RNF-16).
3. **Validadores, controlador y rutas:** validación de entrada (RNF-09) y autorización por rol (RF-USR-03).
4. **Prueba de la API:** manual con Thunder Client y automática con Supertest.
5. **Pantallas en React** a partir de los mockups.
6. **Cierre del sprint:** commit y push, revisión con Juan Alexis (Product Owner), retrospectiva en la bitácora y actualización del Gantt.

## 5. Plan de sprints

| Sprint | Fechas | Entregable | Actividades del Gantt |
|---|---|---|---|
| 0 – Preparación | 21 al 25-oct (sem. 43) | Backend reorganizado por módulos, manejo de errores, conexión a `cindec_db`, modelos Sequelize de las 20 tablas, proyecto React con la base visual de la guía de estilo | Preparación técnica |
| 1 | 26-oct al 1-nov (sem. 44) | Autenticación (login JWT, recuperación de contraseña) y Usuarios/roles (alta, edición, activar/desactivar, autorización por rol, auditoría) — RF-USR-01 a 06 | Desarrollo 1 y 2 |
| 2 | 2 al 8-nov (sem. 45) | Cursos, grupos y sesiones; participantes (autorregistro en 3 pasos, documentos, inscripción con control de cupo); instructores y evaluadores; asistencia; historiales — RF-CUR-01 a 10 | Desarrollo 3, 4 y 5 |
| 3 | 9 al 15-nov (sem. 46) | Materiales de aprendizaje; evaluaciones (intentos, evidencias, dictamen); certificaciones (trámite e historial) — RF-APR, RF-EVA, RF-CERT | Desarrollo 6, 7 y 8 |
| 4 | 16 al 22-nov (sem. 47) | Reportes con exportación; notificaciones por correo; integración y pruebas funcionales del flujo completo — RF-REP, RF-NOT | Desarrollo 9 y 10; Pruebas e integración |
| Cierre | 23 al 29-nov (sem. 48) | Implementación en entorno local de CINDEC, manual técnico y de usuario (iniciados desde la sem. 46), entrega | Documentación e implementación |

**Desviación respecto al Gantt:** Pruebas e integración se recorre una semana (de la 46 a la 47) como consecuencia del aplazamiento de Desarrollo; se compensa con las pruebas continuas por sprint.

## 6. Hitos de seguimiento

- 29-oct-2026: reunión con el asesor docente — demostración del inicio de sesión (Sprint 1 en curso).
- 26 al 30-oct-2026: 2.º reporte parcial (Diseño concluido; Desarrollo iniciado).
- 3 y 4-dic-2026: reporte final.
