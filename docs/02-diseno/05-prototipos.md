# 05 — Prototipos de pantallas

> Fase: **Diseño del Sistema** · Actividad del cronograma: *Prototipos de interfaz*.
> Base: casos de uso (figuras 7 a 11), RNF-02 (adaptable a móvil) y RNF-11 (navegación clara y consistente).
> Estado: 5.1 y 5.2 **aprobados** (2026-10-21); 5.3 en revisión.

## Contenido del paso

| Parte | Tema | Estado |
|---|---|---|
| 5.1 | Inventario de pantallas | Aprobado |
| 5.2 | Mapa de navegación por rol (figura 16) | Aprobado |
| 5.3 | Guía de estilo (figura 17, [`05-2-guia-de-estilo.md`](05-2-guia-de-estilo.md)) | En revisión |
| 5.4 | Wireframes | Pendiente |
| 5.5 | Mockups | Pendiente |
| 5.6 | Versión móvil | Pendiente |
| 5.7 | Validación con el asesor empresarial | Pendiente |

## Principios de diseño

Pedido del residente: una interfaz **amigable, fácil de entender y no saturada**. Se traduce en estas reglas:

1. **Una tarea por pantalla.**
2. **Un solo botón principal** por pantalla, en azul CINDEC; las demás acciones son discretas.
3. **Menú según el rol:** cada usuario ve solo lo que puede hacer.
4. **Máximo 3 niveles:** menú → lista → detalle.
5. **Formularios largos por pasos** (autorregistro en 3 pasos).
6. **Tablas cortas:** solo columnas esenciales, con buscador y filtro; el resto se ve en el detalle.
7. **Estatus con color y con texto** (nunca solo con color).
8. **Mensajes en lenguaje claro** ("El grupo ya no tiene lugares disponibles", no "Error 409").
9. **Letra legible** (15–16 px) y contraste mínimo 4.5:1 (WCAG AA).

## 5.1 Inventario de pantallas

25 pantallas cubren los 22 casos de uso. Las marcadas con ★ (10) se dibujan como prototipo; las demás siguen el mismo patrón de *lista + formulario* y se construyen igual en Desarrollo.

### Sin sesión

| ID | Pantalla | Qué hace el usuario | CU | ★ |
|---|---|---|---|---|
| P-01 | Inicio de sesión | Escribe correo y contraseña | CU-01 | ★ |
| P-02 | Recuperar contraseña | Pide un enlace por correo y define una contraseña nueva | CU-02 | |
| P-03 | Autorregistro (3 pasos) | Captura sus datos, CURP y sube sus documentos | CU-06 | ★ |

### Todos los roles con sesión

| ID | Pantalla | Qué hace el usuario | CU | ★ |
|---|---|---|---|---|
| P-04 | Panel de inicio | Ve un resumen y accesos según su rol | RNF-11 | ★ |
| P-25 | Verificar certificación por folio | Escribe un folio y ve si el documento es válido | CU-20 | ★ |

### Administrador (además de todo lo del Coordinador)

| ID | Pantalla | Qué hace el usuario | CU | ★ |
|---|---|---|---|---|
| P-05 | Usuarios | Da de alta, edita, asigna rol y activa o desactiva | CU-03 | |

### Coordinador

| ID | Pantalla | Qué hace el usuario | CU | ★ |
|---|---|---|---|---|
| P-06 | Cursos y estándares | Gestiona estándares de competencia y cursos | CU-04 | |
| P-07 | Grupos | Lista de grupos con cupo y estatus; crea grupos | CU-05 | |
| P-08 | Detalle del grupo | Ve datos, sesiones e inscritos; asigna instructor y evaluador | CU-05 | ★ |
| P-09 | Inscribir participante (ventana) | Busca al participante y lo inscribe; ve el aviso si no hay cupo | CU-07, CU-08 | ★ |
| P-10 | Participantes | Busca participantes | CU-10 | |
| P-11 | Expediente e historial | Ve datos, documentos e historial de cursos, evaluaciones y certificaciones | CU-10 | |
| P-12 | Instrumentos de evaluación | Define tipo de instrumento y calificación mínima | CU-14 | |
| P-13 | Trámites | Lista de trámites filtrada por estatus | CU-17 | |
| P-14 | Detalle del trámite | Avanza el estatus, ve el historial y sube el PDF de CONOCER | CU-17, CU-18 | ★ |
| P-15 | Reportes | Elige reporte y periodo; exporta a PDF o Excel | CU-22 | |

### Instructor

| ID | Pantalla | Qué hace el usuario | CU | ★ |
|---|---|---|---|---|
| P-16 | Mis grupos | Ve los grupos que tiene asignados | CU-09 | |
| P-17 | Asistencia por sesión | Marca quién asistió a cada sesión | CU-09 | ★ |
| P-18 | Materiales del curso | Sube manuales, presentaciones, PDF o enlaces de video | CU-12 | |

### Evaluador

| ID | Pantalla | Qué hace el usuario | CU | ★ |
|---|---|---|---|---|
| P-19 | Por evaluar | Ve los grupos y participantes que le toca evaluar | CU-15 | |
| P-20 | Resultado y dictamen | Registra calificación, dictamen y evidencias | CU-15, CU-16 | ★ |

### Participante

| ID | Pantalla | Qué hace el usuario | CU | ★ |
|---|---|---|---|---|
| P-21 | Mis cursos | Ve los grupos en los que está inscrito | CU-13 | |
| P-22 | Materiales del curso | Consulta y descarga materiales | CU-13 | ★ |
| P-23 | Mi historial | Ve sus cursos, evaluaciones y certificaciones | CU-11 | |
| P-24 | Mis certificados | Descarga sus documentos de certificación | CU-19 | |

**Criterio para elegir las 10 ★:** cubren los cinco roles, los dos procesos de los diagramas de secuencia (figuras 14 y 15) y los distintos tipos de pantalla (acceso, formulario por pasos, tablero, detalle, ventana emergente, captura rápida y consulta).

## 5.2 Mapa de navegación

![Figura 16. Mapa de navegación por rol](img/fig16-mapa-navegacion.png)

Cómo funciona:
- **Sin sesión** solo existen tres pantallas: iniciar sesión, recuperar contraseña y autorregistro. Al terminar el autorregistro, el participante regresa al inicio de sesión.
- Al iniciar sesión, todos llegan al **panel de inicio**, que muestra un resumen distinto según el rol (por ejemplo, el coordinador ve grupos en curso y trámites pendientes; el participante ve sus cursos).
- **Menú lateral por rol.** El más largo es el del Coordinador (7 opciones); el del Evaluador tiene 2. El Administrador ve lo mismo que el Coordinador más *Usuarios*, igual que en la herencia de actores de los casos de uso.
- **Verificar certificación por folio** aparece en todos los menús (CU-20 es para todos los roles con sesión).
- **Barra superior** en todas las pantallas con sesión: logo de CINDEC, nombre del usuario, rol y *Cerrar sesión*.
- **En celular** el menú lateral se oculta y se abre con un botón (RNF-02).
