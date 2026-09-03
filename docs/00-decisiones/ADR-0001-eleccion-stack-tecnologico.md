# ADR-0001: Elección del stack tecnológico

**Status:** Accepted
**Date:** 2026-09-03
**Deciders:** Angel Mauricio Monjaraz Colmenero (residente) — pendiente de comunicar a Juan Alexis García Gómez (asesor empresarial CINDEC) y al asesor académico Mosiño Juan Francisco

## Context

El anteproyecto de residencia "Desarrollo de un Sistema Integral de Gestión de Capacitación y Certificación Digital para CINDEC" dejó el motor de base de datos y el lenguaje/framework "sujetos a confirmarse durante la fase de Diseño del Sistema" (sección "Alcance técnico de implementación"). Antes de iniciar el levantamiento de requerimientos (semana 36 del cronograma) se necesita fijar el stack para poder preparar el entorno de trabajo y no perder tiempo de desarrollo más adelante.

Restricciones del proyecto:
- Un solo desarrollador (el residente), sin equipo de soporte.
- Ventana de tiempo fija: semanas 34-48 de 2026 (17-ago al 29-nov-2026), con el módulo de Desarrollo concentrado en semanas 41-46.
- El sistema se implementará y validará en un **entorno local** durante la residencia (no hay despliegue a producción en este alcance), pero la arquitectura debe quedar preparada para escalar después (multiempresa / nube quedan como trabajo futuro, según la sección de Limitaciones del anteproyecto).
- Debe ser una aplicación web accesible desde navegador estándar, con base de datos relacional.
- El residente conoce bien Java, C/C++ y Python, tiene nociones de JavaScript, y su experiencia previa en bases de datos es sobre todo con MySQL. Su experiencia específica en desarrollo web (frontend/backend) es limitada.
- Prioridad explícita del residente: que el stack elegido también aporte a su perfil profesional (tecnologías con demanda real en el mercado laboral), no solo que sea "lo más fácil".
- Los seis módulos funcionales ya están definidos en el anteproyecto: Usuarios (roles y accesos), Cursos y Participantes (incluye instructores), Aprendizaje y Evaluaciones, Certificaciones, además de Reportes (visto en el cronograma).

## Decision

Se adopta el siguiente stack:

- **Backend:** Node.js (LTS) + Express — API REST.
- **ORM / acceso a datos:** Sequelize (con `mysql2` como driver), usando su sistema de migraciones para versionar el esquema de la base de datos junto con el código.
- **Base de datos:** MySQL — coincide con lo que el residente ya conoce de sus materias de Bases de Datos, cumple el requisito de "motor de base de datos relacional" del anteproyecto.
- **Frontend:** React (con Vite como bundler) — SPA que consume la API REST del backend.
- **Autenticación:** JWT (JSON Web Tokens) + bcrypt para el hash de contraseñas, para soportar el módulo de gestión de usuarios con roles y niveles de acceso.
- **Control de versiones:** Git, con repositorio en GitHub (el residente ya cuenta con cuenta activa).

## Options Considered

### Opción A: Node.js + Express + React + MySQL (elegida)

| Dimensión | Evaluación |
|---|---|
| Complejidad para alguien nuevo en web | Media-baja: JavaScript en todo el stack, menos conceptos distintos que aprender a la vez |
| Costo | Nulo (todo open source, corre en local) |
| Escalabilidad | Alta: API REST desacoplada del frontend, fácil de contenerizar o mover a la nube después |
| Demanda laboral (México y remoto) | Muy alta: es de los stacks full-stack más solicitados en vacantes junior/trainee |
| Afinidad con lo que ya sabe el residente | Media: refuerza JavaScript, que ya conoce un poco; MySQL ya lo conoce bien |
| Documentación y comunidad en español | Muy amplia |

**Pros:** un solo lenguaje (JavaScript) en frontend y backend reduce la carga cognitiva de aprender dos ecosistemas nuevos al mismo tiempo; Express es minimalista y fácil de razonar; enorme cantidad de tutoriales y foros en español; perfil muy solicitado en el mercado.
**Cons:** el residente tiene que reforzar JavaScript moderno (async/await, módulos) además del framework; Express por sí solo da poca estructura (hay que imponer disciplina de carpetas, lo cual ya se resuelve con la estructura de este repositorio).

### Opción B: Java + Spring Boot + MySQL

| Dimensión | Evaluación |
|---|---|
| Complejidad para alguien nuevo en web | Alta: Spring Boot añade inyección de dependencias, anotaciones, Maven/Gradle y JPA/Hibernate — varios conceptos nuevos simultáneos |
| Costo | Nulo |
| Escalabilidad | Muy alta (estándar de facto en sistemas empresariales) |
| Demanda laboral | Alta, sobre todo en empresas grandes/bancos en México |
| Afinidad con lo que ya sabe el residente | Alta en el lenguaje (Java es su lenguaje más fuerte), baja en el framework web |
| Documentación y comunidad en español | Amplia, aunque más orientada a nivel intermedio/avanzado |

**Pros:** aprovecha el lenguaje que el residente ya domina mejor; muy valorado en vacantes de backend "serias".
**Cons:** la combinación Spring + JPA + Maven tiene una curva de aprendizaje pronunciada para alguien que declara que web es justo su área más débil, con riesgo real de atrasarse frente al cronograma fijo (Desarrollo concentrado en solo 5-6 semanas).

### Opción C: PHP (Laravel) + MySQL

| Dimensión | Evaluación |
|---|---|
| Complejidad para alguien nuevo en web | Media |
| Costo | Nulo |
| Escalabilidad | Media-alta |
| Demanda laboral | Media (menor que las otras dos opciones en vacantes nuevas, aunque sigue siendo muy usado) |
| Afinidad con lo que ya sabe el residente | Baja: no reportó experiencia previa en PHP |
| Documentación y comunidad en español | Amplia |

**Pros:** Laravel da mucha estructura de fábrica (migraciones, ORM Eloquent, autenticación ya integrada).
**Cons:** introduce un lenguaje nuevo (PHP) sin ninguna base previa reportada por el residente, y su demanda relativa en el mercado es menor que Node.js o Java para nuevas contrataciones.

## Trade-off Analysis

El criterio decisivo fue el que el propio residente marcó como prioridad: que el stack sirva también para su perfil profesional, sin sacrificar la viabilidad de terminar dentro del cronograma fijo de la residencia. Java+Spring es el más fuerte en "peso" para el mercado empresarial, pero su curva de aprendizaje es la más alta justo en el área (desarrollo web) donde el residente reportó menos experiencia — el riesgo de no llegar a tiempo a la fase de Pruebas (semana 46) es real. PHP+Laravel resuelve la curva de aprendizaje pero no aprovecha ningún conocimiento previo del residente y tiene menor demanda relativa que las otras dos opciones.

Node.js + Express + React logra el mejor balance: es también un stack con alta demanda laboral, reduce a un solo lenguaje (JavaScript) todo lo que hay que aprender de cero, y aprovecha el conocimiento ya existente en MySQL. Java queda como una opción totalmente válida a reconsiderar si, ya iniciado el proyecto, el residente decide que prefiere invertir el tiempo extra en profundizar Spring Boot en vez de JavaScript — pero como decisión por defecto, Node.js/Express/React minimiza el riesgo de no terminar a tiempo.

## Consequences

- Se vuelve más fácil: levantar el entorno de desarrollo (un solo runtime, Node.js, para todo); compartir tipos y validaciones de datos en el futuro si se usara TypeScript; encontrar ejemplos y ayuda en español para dudas puntuales.
- Se vuelve más difícil: el "peso curricular" de Java no se capitaliza directamente en este proyecto (aunque sigue siendo relevante para otras materias/exámenes).
- Habrá que revisar más adelante: si el volumen de datos o la complejidad de las reglas de negocio de CONOCER crecen mucho, evaluar introducir TypeScript en el backend para mayor robustez (no es necesario para el alcance actual).

## Action Items

1. [x] Crear la estructura de carpetas del repositorio (backend/frontend/docs/database).
2. [x] Inicializar `package.json` del backend con las dependencias base (Express, Sequelize, mysql2, dotenv, cors, jsonwebtoken, bcryptjs).
3. [ ] Confirmar con el asesor empresarial (Juan Alexis) que no hay una preferencia/restricción de CINDEC sobre el stack (por ejemplo, si ya tienen hosting contratado con requisitos específicos).
4. [ ] Instalar MySQL localmente (o usar XAMPP/MySQL Workbench si ya están instalados) y crear la base de datos vacía del proyecto.
5. [ ] Iniciar el levantamiento de requerimientos (semana 36-37 del cronograma) en `docs/01-requerimientos/`.
