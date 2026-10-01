# ADR-0003 — Estilo arquitectónico: monolito modular en tres capas

- **Estado:** Aceptado (aprobado por el residente el 2026-10-01)
- **Fecha:** 2026-10-01
- **Fase:** Diseño del Sistema (semana 40)

## Contexto

El ERS v1.1 define siete módulos funcionales (Usuarios, Cursos/grupos/participantes, Aprendizaje, Evaluaciones, Certificaciones, Reportes, Notificaciones), exige separar presentación, lógica y datos (RNF-16), separar por dominio (RNF-17) y permitir crecer sin reestructurar (RNF-19, RNF-21). Restricciones: un solo desarrollador, entorno local sin producción, y el tiempo de la fase de Desarrollo (semanas 41-46).

## Opciones consideradas

1. **Aplicación tradicional con vistas generadas en el servidor** (Express + plantillas). Más simple al inicio, pero mezcla interfaz y lógica y no deja una API reutilizable para la visión futura.
2. **SPA (React) + API REST en un monolito modular** (Express organizado por módulos).
3. **Microservicios** (un servicio por módulo). Escala por separado, pero exige varios procesos, comunicación entre servicios y despliegue más complejo.

## Decisión

Se elige la **opción 2**: cliente-servidor en tres capas, con frontend SPA en React, una API REST única en Express organizada en módulos por dominio (carpeta `src/modules/<módulo>/` con rutas, controlador, servicio y validadores), modelos Sequelize centralizados y MySQL.

## Consecuencias

- **Positivas:** un solo proceso que instalar y depurar; separación clara de capas y dominios; la API versionada (`/api/v1`) queda lista para otros clientes en el futuro; si algún día se necesitara, un módulo podría extraerse como servicio independiente.
- **Negativas / riesgos:** todos los módulos comparten la misma base de datos y el mismo proceso; un error grave afecta a todo el sistema. Se mitiga con el middleware de manejo de errores y con pruebas por módulo.
- **Acción:** reorganizar `backend/src` a la estructura por módulos al iniciar Desarrollo (semana 41).
