# ADR-0004 — Acceso a datos: Sequelize sobre el esquema SQL existente

- **Estado:** Aceptado
- **Fecha:** 2026-10-21
- **Fase:** Desarrollo del Sistema (Sprint 0, semana 43)

## Contexto

ADR-0001 eligió Sequelize "como ORM y sistema de migraciones". Durante el Diseño, la base de datos `cindec_db` se construyó y probó directamente en MySQL 8.0 con nueve scripts SQL (`docs/02-diseno/sql/`), que incluyen restricciones CHECK, ENUM, UNIQUE compuestos, índices y la política de borrado documentada. Recrear ese esquema con migraciones de Sequelize duplicaría el trabajo y podría perder restricciones que Sequelize no genera igual (por ejemplo, los CHECK).

## Decisión

- Los **scripts SQL de `docs/02-diseno/sql/` son la fuente de verdad del esquema.**
- Sequelize se usa solo como **ORM**: los modelos describen las tablas existentes (`freezeTableName`, sin `timestamps` automáticos) y **nunca se ejecuta `sequelize.sync()`**.
- Las carpetas `backend/database/migrations` y `seeders` no se usan en V1. Cualquier cambio de esquema se agrega como un nuevo script SQL numerado y se refleja en el diccionario de datos.

## Consecuencias

- **Positivas:** se conservan intactas las reglas de integridad ya probadas; la base de datos sigue protegiendo los datos aunque falle una validación del backend.
- **Negativas:** los modelos deben mantenerse a mano en sincronía con los scripts; se mitiga con el diccionario de datos y con una prueba que verifica la conexión y las tablas al iniciar.
