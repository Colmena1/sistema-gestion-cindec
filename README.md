# Sistema Integral de Gestión de Capacitación y Certificación Digital — CINDEC

Proyecto de residencia profesional (Ing. en Sistemas Computacionales, ITL) de **Angel Mauricio Monjaraz Colmenero** (No. control 20240759) para **CINDEC**. Periodo: agosto-diciembre 2026 (semanas 34-48).

Este repositorio contiene el código y la documentación del sistema descrito en el anteproyecto: gestión de usuarios, cursos y participantes, aprendizaje y evaluaciones, y certificaciones digitales, para CINDEC.

## Estado actual

En construcción — fase de **Análisis del Sistema** (levantamiento de requerimientos). Aún no hay funcionalidades desarrolladas. Ver `docs/bitacora-avance.md` para el detalle semana a semana.

## Stack tecnológico

Ver la justificación completa en [`docs/00-decisiones/ADR-0001-eleccion-stack-tecnologico.md`](docs/00-decisiones/ADR-0001-eleccion-stack-tecnologico.md).

- **Backend:** Node.js + Express (API REST)
- **Base de datos:** MySQL, con Sequelize como ORM y sistema de migraciones
- **Frontend:** React + Vite
- **Autenticación:** JWT + bcrypt
- **Control de versiones:** Git / GitHub

## Estructura del repositorio

```
sistema-gestion-cindec/
├── backend/            # API REST (Node.js + Express + Sequelize)
│   ├── src/
│   │   ├── config/       # configuración (conexión a BD, variables de entorno)
│   │   ├── routes/       # definición de endpoints
│   │   ├── controllers/  # reciben la petición HTTP y devuelven la respuesta
│   │   ├── services/     # lógica de negocio
│   │   ├── models/       # modelos Sequelize (tablas)
│   │   └── middlewares/  # autenticación, validación, manejo de errores
│   └── database/
│       ├── migrations/   # historial versionado de cambios al esquema de BD
│       └── seeders/      # datos de prueba
├── frontend/           # aplicación React (se crea en la fase de Diseño/Desarrollo)
└── docs/                # documentación del proyecto (ver abajo)
```

## Documentación

Cada carpeta de `docs/` corresponde a una fase del cronograma del anteproyecto y se va llenando conforme el proyecto avanza — no se escribe toda junta al final:

| Carpeta | Fase del cronograma | Qué contiene |
|---|---|---|
| `docs/00-decisiones/` | Transversal | ADRs (decisiones técnicas importantes y su justificación) |
| `docs/01-requerimientos/` | Análisis del Sistema (sem. 36-39) | Requerimientos funcionales/no funcionales, casos de uso |
| `docs/02-diseno/` | Diseño del Sistema (sem. 39-41) | Arquitectura, modelo entidad-relación, diagramas UML, prototipos de interfaz |
| `docs/03-pruebas/` | Pruebas e Integración (sem. 46) | Casos de prueba y resultados |
| `docs/bitacora-avance.md` | Todas | Registro semanal de avance, decisiones y pendientes |

El manual técnico y el manual de usuario (entregables finales del anteproyecto) se redactan hacia el final, en la fase de Documentación e Implementación (sem. 46-48), apoyados en todo lo registrado aquí durante el proyecto.

## Cómo levantar el entorno de desarrollo

> Se completa cuando el backend tenga su primer `package.json` con dependencias instaladas.

```bash
cd backend
npm install
cp .env.example .env   # llenar con tus credenciales locales de MySQL
npm run dev
```

## Módulos del sistema

Reflejan 1:1 los alcances y objetivos específicos del anteproyecto:

1. Gestión de usuarios (roles y niveles de acceso)
2. Gestión de cursos y participantes (incluye instructores)
3. Gestión del aprendizaje y evaluaciones
4. Gestión de certificaciones (constancias digitales)
5. Reportes
