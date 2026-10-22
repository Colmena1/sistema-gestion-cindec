# Sistema Integral de Gestión de Capacitación y Certificación Digital — CINDEC

Proyecto de residencia profesional (Ing. en Sistemas Computacionales, ITL) de **Angel Mauricio Monjaraz Colmenero** (No. control 20240759) para **CINDEC**. Periodo: agosto-diciembre 2026 (semanas 34-48).

Este repositorio contiene el código y la documentación del sistema descrito en el anteproyecto: gestión de usuarios, cursos y participantes, aprendizaje y evaluaciones, y certificaciones digitales, para CINDEC.

## Estado actual

En construcción — fase de **Desarrollo del Sistema** (Sprint 0: preparación técnica). Análisis y Diseño concluidos. Plan de la fase en [`docs/04-desarrollo/plan-de-desarrollo.md`](docs/04-desarrollo/plan-de-desarrollo.md); detalle semana a semana en `docs/bitacora-avance.md`.

## Stack tecnológico

Ver la justificación completa en [`docs/00-decisiones/ADR-0001-eleccion-stack-tecnologico.md`](docs/00-decisiones/ADR-0001-eleccion-stack-tecnologico.md).

- **Backend:** Node.js + Express (API REST)
- **Base de datos:** MySQL 8.0, con Sequelize como ORM sobre el esquema creado por scripts SQL (ADR-0004)
- **Frontend:** React + Vite
- **Autenticación:** JWT + bcrypt
- **Control de versiones:** Git / GitHub

## Estructura del repositorio

```
sistema-gestion-cindec/
├── backend/              # API REST (Node.js + Express + Sequelize), base /api/v1
│   ├── src/
│   │   ├── config/         # conexión a la BD
│   │   ├── models/         # modelos Sequelize de las 20 tablas
│   │   ├── modules/        # un módulo por dominio: rutas, controlador, servicio y validadores
│   │   │   ├── auth/  usuarios/  cursos/  aprendizaje/
│   │   │   └── evaluaciones/  certificaciones/  reportes/  notificaciones/
│   │   ├── middlewares/    # autenticación, autorización, validación, errores
│   │   ├── routes/         # punto de montaje de las rutas de cada módulo
│   │   └── utils/          # utilidades comunes (AppError, asyncHandler)
│   └── database/           # ver README: el esquema vive en docs/02-diseno/sql/
├── frontend/             # aplicación React + Vite
└── docs/                 # documentación del proyecto (ver abajo)
```

## Documentación

Cada carpeta de `docs/` corresponde a una fase del cronograma del anteproyecto y se va llenando conforme el proyecto avanza — no se escribe toda junta al final:

| Carpeta | Fase del cronograma | Qué contiene |
|---|---|---|
| `docs/00-decisiones/` | Transversal | ADRs (decisiones técnicas importantes y su justificación) |
| `docs/01-requerimientos/` | Análisis del Sistema (sem. 36-39) | Requerimientos funcionales/no funcionales, casos de uso |
| `docs/02-diseno/` | Diseño del Sistema (sem. 39-41) | Arquitectura, modelo entidad-relación, diagramas UML, prototipos de interfaz |
| `docs/04-desarrollo/` | Desarrollo del Sistema (sem. 43-47) | Plan de sprints y notas técnicas del desarrollo |
| `docs/03-pruebas/` | Pruebas e Integración (sem. 46) | Casos de prueba y resultados |
| `docs/bitacora-avance.md` | Todas | Registro semanal de avance, decisiones y pendientes |

El manual técnico y el manual de usuario (entregables finales del anteproyecto) se redactan hacia el final, en la fase de Documentación e Implementación (sem. 46-48), apoyados en todo lo registrado aquí durante el proyecto.

## Cómo levantar el entorno de desarrollo

Requisitos: Node.js LTS, MySQL Server 8.0 con la base `cindec_db` creada con los scripts de `docs/02-diseno/sql/` (01 a 08).

```bash
cd backend
npm install
copy .env.example .env   # en Windows; llenar DB_PASSWORD y JWT_SECRET
npm run dev
```

Prueba: abrir `http://localhost:4000/api/v1/health` → debe responder `"baseDeDatos": "conectada"`.

## Módulos del sistema

Reflejan 1:1 los alcances y objetivos específicos del anteproyecto:

1. Gestión de usuarios (roles y niveles de acceso)
2. Gestión de cursos y participantes (incluye instructores)
3. Gestión del aprendizaje y evaluaciones
4. Gestión de certificaciones (constancias digitales)
5. Reportes
