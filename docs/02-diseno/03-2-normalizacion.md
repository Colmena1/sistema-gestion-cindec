# 03 — Diseño de la base de datos · Parte 2: normalización

> Fase: **Diseño del Sistema** · Actividad del cronograma: *Diseño de la base de datos*.
> Base: diseño lógico (`03-diseno-logico.md`, figura 5).
> Estado: **aprobado por el residente** (2026-10-15). Los cambios de la sección 6 ya se aplicaron al modelo E-R y al diseño lógico. Versión visual tabla por tabla: `Normalizacion-BD-CINDEC.xlsx` (carpeta del proyecto).

## 1. Resultado

Las 20 tablas cumplen la **primera, segunda y tercera forma normal** con dos ajustes y dos excepciones documentadas:

- **Ajustes:** se eliminan dos columnas redundantes, `GRUPO.horario` y `PARTICIPANTE.fecha_registro`.
- **Excepciones:** se conservan dos columnas que se podrían calcular, `INTENTO_EVALUACION.estatus` y `TRAMITE_CERTIFICACION.estatus`. Las dos están justificadas por historial y por rendimiento.

## 2. Las tres formas normales (criterio usado)

| Forma normal | Regla | Qué se revisó en cada tabla |
|---|---|---|
| **1FN** | Cada columna guarda un solo valor (atómico), no hay grupos repetidos y la tabla tiene llave primaria. | Que no haya listas dentro de una celda ni columnas tipo `documento1`, `documento2`. |
| **2FN** | Cumple 1FN y ninguna columna depende solo de **una parte** de una llave compuesta. | Las llaves compuestas candidatas (los pares UNIQUE de las tablas intermedias). |
| **3FN** | Cumple 2FN y ninguna columna depende de **otra columna que no es llave** (dependencia transitiva). Incluye los datos que se pueden calcular a partir de otros. | Datos repetidos entre tablas y datos derivables. |

## 3. Primera forma normal (1FN)

**Cumplen las 20 tablas.**

- Todas tienen llave primaria propia (`id_…`, entera y autoincremental).
- No hay columnas con listas. Los casos que podían tenerlas ya se resolvieron como tablas aparte:
  - Varios documentos por participante → DOCUMENTO_PARTICIPANTE.
  - Varias sesiones por grupo → SESION.
  - Varios intentos por evaluación → INTENTO_EVALUACION.
  - Varios cambios de estatus por trámite → HISTORIAL_TRAMITE.
- Las columnas con valores de un catálogo cerrado (`modalidad`, `estatus`, `tipo_documento`, `tipo_instrumento`, `dictamen`) guardan **un solo valor** cada una.

## 4. Segunda forma normal (2FN)

**Cumplen las 20 tablas.**

Todas las llaves primarias son de una sola columna, así que no puede haber dependencias parciales respecto a la llave primaria. Se revisaron además las llaves compuestas **candidatas** (las restricciones UNIQUE):

| Tabla | Llave candidata | Columnas que no son llave | ¿Dependen de la llave completa? |
|---|---|---|---|
| INSCRIPCION | (id_participante, id_grupo) | fecha_inscripcion, estatus, es_refuerzo | Sí: describen la inscripción de *esa* persona en *ese* grupo. |
| ASISTENCIA | (id_inscripcion, id_sesion) | asistio, observaciones | Sí: la asistencia de *esa* inscripción en *esa* sesión. |
| CONSULTA_MATERIAL | (id_participante, id_material) | fecha_primera_consulta, fecha_ultima_consulta | Sí. |
| INTENTO_EVALUACION | (id_inscripcion, id_evaluacion, numero_intento) | fecha_aplicacion, calificacion, estatus, dictamen, observaciones, id_evaluador | Sí: cada valor es de *ese* intento. |

## 5. Tercera forma normal (3FN)

### 5.1 Revisión tabla por tabla

| Tabla | Resultado | Nota |
|---|---|---|
| ROL, ESTANDAR_COMPETENCIA, CURSO, MATERIAL, SESION, EVIDENCIA, TOKEN_RECUPERACION, DOCUMENTO_PARTICIPANTE, CONSULTA_MATERIAL, ASISTENCIA, EVALUACION, HISTORIAL_TRAMITE | Cumple | Cada columna describe solo a su propia fila. |
| USUARIO | Cumple | |
| PARTICIPANTE | **Ajuste** | `fecha_registro` repite `USUARIO.fecha_registro` (ver 5.2). |
| GRUPO | **Ajuste** | `horario` repite lo que ya guarda SESION (ver 5.2). El cupo disponible no se guarda: se calcula (`cupo − inscripciones activas`). |
| INSCRIPCION | Cumple | Su `estatus` (inscrito / capacitación concluida / baja) es personal y **no** se deriva del estatus del grupo: alguien puede darse de baja de un grupo que sí concluyó. |
| INTENTO_EVALUACION | **Excepción** | `estatus` se puede calcular (ver 5.3). |
| TRAMITE_CERTIFICACION | **Excepción** | `estatus` se puede calcular (ver 5.3). |
| DOCUMENTO_CERTIFICACION | Cumple | El nombre del participante y el estándar **no** se guardan aquí; se obtienen por las relaciones (decisión 7 del E-R). |
| AUDITORIA | Cumple | `entidad_afectada` + `id_registro_afectado` apuntan a cualquier tabla y por eso no llevan llave foránea. Es intencional: es una bitácora y no una relación. |

### 5.2 Ajustes: columnas que se eliminan

| Columna | Problema | Solución |
|---|---|---|
| `PARTICIPANTE.fecha_registro` | Repite `USUARIO.fecha_registro`, porque la cuenta y la ficha se crean en el mismo momento. Si una se corrige y la otra no, quedan dos fechas distintas para el mismo registro (anomalía de actualización). | Se elimina. El reporte "participantes registrados por periodo" (RF-REP-01) usa `USUARIO.fecha_registro`. |
| `GRUPO.horario` | Repite el calendario y el horario que ya guarda SESION (fecha, hora_inicio, hora_fin), que es lo que pide RF-CUR-09. Si cambia una sesión y no el texto del grupo, se contradicen. | Se elimina. El horario del grupo se muestra a partir de sus sesiones. |

### 5.3 Excepciones documentadas: columnas que se conservan aunque se puedan calcular

| Columna | Se podría calcular con… | Por qué se conserva |
|---|---|---|
| `INTENTO_EVALUACION.estatus` (pendiente / aprobada / no aprobada) | `calificacion` comparada contra `EVALUACION.calificacion_minima` | **Historial.** Si CINDEC cambia después el mínimo de una evaluación, un estatus calculado cambiaría el resultado de intentos ya presentados. Guardarlo deja el resultado tal como se dio ese día, y RNF-06 pide proteger los resultados contra cambios. Además, "pendiente" no se puede calcular de una calificación vacía con la misma regla. |
| `TRAMITE_CERTIFICACION.estatus` (solicitado / pagado / en trámite / emitido) | El último registro de HISTORIAL_TRAMITE | **Rendimiento y simplicidad.** Los reportes y las búsquedas por estatus (RF-CERT-05, RF-REP-01) se resuelven con una consulta directa, sin buscar el último cambio de cada trámite (RNF-15). |

**Cómo se evita la inconsistencia en las dos excepciones:** solo el servicio del backend escribe esas columnas.
- El servicio de evaluaciones calcula el estatus del intento al registrar la calificación.
- El servicio de certificaciones actualiza `TRAMITE_CERTIFICACION.estatus` e inserta en HISTORIAL_TRAMITE **en la misma transacción**: se guardan las dos cosas o ninguna.

## 6. Cambios que provoca en documentos anteriores

Aplicado el 2026-10-15:
- Se quitan `PARTICIPANTE.fecha_registro` y `GRUPO.horario` del modelo E-R (`02-modelo-entidad-relacion.md`, figura 4) y del diseño lógico (figura 5).
- No cambia ninguna llave foránea; siguen siendo 20 tablas y 26 llaves foráneas.

## 7. Siguiente parte

**Diseño físico:** tipos de dato MySQL de cada columna, índices y diccionario de datos.
