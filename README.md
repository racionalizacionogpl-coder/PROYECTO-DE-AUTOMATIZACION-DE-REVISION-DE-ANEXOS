# Automatización de revisión de anexos — OGPL / UNMSM

Auditoría automática de los anexos de inventario de productos y procesos de las
20 facultades, sobre Google Sheets + Google Apps Script.

## Estado

| Anexo | Estado |
|---|---|
| Anexo 1 — Inventario de productos y procesos | en desarrollo |
| Anexo 2 — (migrado al Anexo 1) | fuera de alcance |
| Anexo 3 — Ficha técnica | en desarrollo — 20 facultades |
| Anexo 4 — Indicadores estandarizados | en desarrollo |

## Contenido

```
apps-script/Anexo3_Automatizacion_v2.gs  Herramientas del libro del Anexo 3 (menú ⚙️ Herramientas Anexo 3) — VIGENTE
apps-script/Anexo3_Automatizacion_v1.gs  v1, conservada como referencia
apps-script/AutoAnexo1_v2.gs             Genera los códigos de producto PADRE_F##-P## (va en el Apps Script del Anexo 1)
apps-script/HistorialRevisiones.gs       Historial de avances de los anexos
apps-script/ResumenGeneral.gs            Combina el avance de A1 y A3 (menú "Actualizar resumen general")
apps-script/ExportarJSON.gs              Exportación del tablero a JSON
apps-script/Anexo4_Revision_v2.gs        Revisión del Anexo 4 — VERSIÓN VIGENTE
apps-script/Anexo4_Revision_v1.gs        v1 (plantilla), conservada como referencia
apps-script/Anexo3_Revision_v4.gs        Revisión del Anexo 3 — VERSIÓN VIGENTE
apps-script/Anexo3_Revision_v3.gs        v3, conservada como referencia
apps-script/Anexo3_Revision_v2.gs        v2, conservada como referencia
apps-script/Anexo3_Revision.gs           v1 (piloto FDCP), conservada como referencia
apps-script/Anexo1_Auditoria_v19.gs      Auditor del Anexo 1 — VERSIÓN VIGENTE
apps-script/Anexo1_Auditoria_v18.gs      v18, conservada como referencia
apps-script/Anexo1_Auditoria_v17.gs      v17, conservada como referencia
apps-script/Anexo1_Auditoria_v16.gs      v16, conservada como referencia
apps-script/Anexo1_Auditoria_v15.gs      v15, conservada como referencia
apps-script/Anexo1_Auditoria_v14.gs      v14, conservada como referencia
apps-script/Anexo1_Auditoria_v13.gs      v13, conservada como referencia
apps-script/Anexo1_Auditoria_v12.gs      v12, conservada como referencia
apps-script/Anexo1_Auditoria_v11.gs      v11, conservada como referencia
apps-script/Anexo1_Auditoria_v10.gs      v10, conservada como referencia
apps-script/Anexo1_Auditoria_v9.gs       v9, conservada como referencia
apps-script/Anexo1_Auditoria_v8.gs       v8, conservada como referencia
apps-script/Anexo1_Auditoria_v7.gs       v7, conservada como referencia
apps-script/Anexo1_Auditoria_v6.gs       v6, conservada como referencia
apps-script/Anexo1_Auditoria_v5.gs       v5, conservada como referencia
apps-script/Anexo1_Auditoria_v4.gs       v4, conservada como referencia
apps-script/Anexo1_Auditoria_v3.gs       v3, conservada como referencia
apps-script/Anexo1_Auditoria.gs          v2, conservada como referencia
reglas/ANEXO-3_reglas-v3.md              Reglas vigentes del Anexo 3
reglas/ANEXO-3_reglas-v1.md              v1 (piloto FDCP), conservada como referencia
reglas/ANEXO-1_reglas-v19.md             Reglas vigentes del Anexo 1
reglas/ANEXO-1_reglas-v16.md             Reglas previas
docs/ANALISIS_reglas-vs-codigo.md        Comparación hoja de reglas vs. script
docs/MAPA_DE_SCRIPTS.md                  Qué archivo va en el Apps Script de cada libro
docs/CONTRA_OBSERVACIONES.md             Respuesta a cada contra observación
tests/validadores.test.js                Pruebas de los validadores del Anexo 1 (Node)
tests/anexo3.test.js                     Pruebas de los validadores del Anexo 3 (Node)
tests/anexo4.test.js                     Pruebas de los validadores del Anexo 4 (Node)
tests/resumengeneral.test.js             Pruebas de ResumenGeneral.gs (Node)
tests/historial.test.js                  Pruebas del historial de revisiones (Node)
tests/proyecto.test.js                   Vigila los nombres duplicados entre archivos (Node)
dashboard/dashboard.html                 Dashboard visual de la última corrida
```

## Pruebas

```
node tests/validadores.test.js
node tests/anexo3.test.js
node tests/anexo4.test.js
node tests/historial.test.js
node tests/resumengeneral.test.js
node tests/proyecto.test.js
node tests/autoanexo1.test.js
node tests/anexo3automatizacion.test.js
```

`proyecto.test.js` comprueba que dos archivos del proyecto de Apps Script no
declaren el mismo nombre: en Apps Script todos comparten un único ámbito global,
así que dos `const` iguales rompen el proyecto entero y dos funciones iguales se
pisan en silencio.

Anexo 1: 423 comprobaciones sobre las funciones puras: validadores de las columnas C a I,
localización de pestañas con los 20 títulos reales, jerarquía de profundidad
variable, detección de procesos de Nivel 0 por código embebido o denominación,
regla de mayúsculas, catálogo oficial de facultades y formularios —incluida la
numeración posicional F01–F20 de la relación corregida—, puntuación de las filas
de proceso, el avance general por proceso (no por criterio) y preservación de
las columnas del revisor.

Anexo 3: 317 comprobaciones sobre los validadores de codificación, la partición
de la pestaña en fichas técnicas, la excepción de las facultades de nivel 2, el
registro maestro de códigos, el cotejo con el Anexo 1, la detección automática de
las pestañas `F##_SIGLA`, el producto final obligatorio, el emparejado de código
y denominación por líneas, la coherencia fila por fila de la descripción, los
códigos duplicados, el vocabulario de la columna `ESTADO` (`CONFORME` /
`OBSERVADO` / `SIN REGISTRAR` / `CRÍTICO`), el semáforo de avance por facultad y
la celda mostrada por cada hallazgo (con el rango de filas cuando no hay una
celda exacta).

## Cómo se ejecuta

1. Abrir el Anexo 1 → **Extensiones › Apps Script**
2. Pegar el contenido de `apps-script/Anexo1_Auditoria_v19.gs`
3. Ejecutar `ejecutarAuditoriaAnexo1`, o **Auditoría OGPL › Ejecutar auditoría
   del Anexo 1**, y autorizar los permisos
4. El resultado se escribe en el dashboard, pestañas
   `RESUMEN_EJECUTIVO_A1`, `DETALLADO_PRODUCTOS_A1` y
   `OBSERVACIONES_DE_PROCESO_A1`

La hoja `COBERTURA_PROCESOS_A1` se **renombra** a `OBSERVACIONES_DE_PROCESO_A1`
en la primera corrida de la v5; no se crea una hoja nueva, para que las contra
observaciones ya escritas viajen con ella.

## Anexo 3 — revisión de fichas técnicas

1. Abrir `4_REVISIÓN_INTERNA DE_AVANCES_ACTIVIDADES` → **Extensiones › Apps Script**
2. Agregar un archivo con el contenido de `apps-script/Anexo3_Revision_v4.gs`
   (junto al del Anexo 1, en el mismo proyecto)
3. Revisar el bloque `CONFIG_A3` del inicio (carpeta de salida y Anexo 1 para el
   cotejo). Las pestañas de facultad se detectan solas por su nombre
   `F##_SIGLA`; deje `SOURCE_TAB_NAME` vacío para revisarlas todas, o escriba
   siglas separadas por coma para revisar solo algunas. También puede
   configurarse desde una pestaña `CONFIG_A3` del propio Anexo 3: columna A =
   clave, columna B = valor.
4. Recargar el libro y usar **Auditoría OGPL › Ejecutar revisión del Anexo 3**
   (o ejecutar `ejecutarRevisionAnexo3` desde el editor)

Si alguna facultad no aparece en el reporte, ejecute `listarPestanasA3`: escribe
en el registro (Ver › Registro) cada pestaña y si se reconoce como facultad.
Casi siempre es que su nombre no sigue el formato `F##_SIGLA`.

El reporte se escribe en el mismo libro que usa la auditoría del Anexo 1
(`4_REVISIÓN_INTERNA DE_AVANCES_ACTIVIDADES`), en cuatro hojas:
`DETALLE_REVISION_A3`, `RESUMEN_FICHAS_A3`, `RESUMEN_EJECUTIVO_A3` y
`REGISTRO_MAESTRO_CODIGOS_A3`. Conviven con las `*_A1` sin pisarse: cada corrida
reescribe solo las suyas. Todas abren con la sigla y el nombre de la facultad,
en el orden F01 → F20.

Cada fila va pintada según su estado — **verde** correcta, **ámbar** incompleta o
por verificar, **rojo** con algo que corregir, **gris** campo opcional — y ese
mismo estado se escribe en la columna `ESTADO` o `CLASIFICACIÓN`, de modo que la
hoja se lea igual impresa en blanco y negro.

## Resumen general — Anexo 1 + Anexo 3 combinados

`apps-script/ResumenGeneral.gs` es un script aparte, en el mismo proyecto de
Apps Script que los auditores. **No vuelve a auditar nada**: solo lee
`RESUMEN_EJECUTIVO_A1` y `RESUMEN_EJECUTIVO_A3`, ya escritas por sus respectivos
auditores en el libro de revisión, y combina el avance de cada facultad **50/50**
en una hoja `RESUMEN_GENERAL` — la misma información que antes generaba
`Anexo3_Revision_v3.gs` en cada corrida, pero calculada aparte para no cargar la
revisión del Anexo 3 con una hoja que no depende de su propia lógica.

Se dispara desde el menú **Auditoría OGPL › Actualizar resumen general**, cada
vez que cambie el Anexo 1 o el Anexo 3, o ejecutando `actualizarResumenGeneral`
desde el editor. Todos sus nombres internos llevan el sufijo `RG_`, para no
repetir con ningún otro archivo del proyecto un nombre ya usado (`CONFIG_A1`,
`CONFIG_A3`… ya provocaron ese choque antes).

Los hallazgos se clasifican en cuatro niveles —**Correcto**, **Incompleto**,
**Observación** y **Crítico**— y el resumen de las 20 facultades lleva semáforo
de avance (95–100 verde, 80–94 ámbar, 60–79 naranja, 0–59 rojo). Una facultad
con hallazgos críticos no se considera satisfactoria por alto que sea su
porcentaje.

La FDCP trabaja procesos y productos de nivel 2: el nivel adicional de código se
admite como excepción y se anota, no se marca como error.

## Columna CONTRA OBSERVACIÓN

El revisor puede añadir columnas propias a la derecha de las que genera el
script. **Se conservan entre corridas**: antes de reescribir cada hoja, el
script las lee y las repone reidentificando la fila por su contenido. No hace
falta volver a escribirlas después de cada auditoría.

## Lectura del Anexo 1 desde fuera de Google

`read_file_content` corta cada pestaña en **250 filas**, así que no sirve para
analizar las hojas grandes. La vía correcta es `download_file_content` con
`exportMimeType` de xlsx, que entrega el libro completo; `tools/extraer_xlsx.py`
lo convierte a JSON. Con ella se leen las 4 200 filas del Anexo 1 y las 2 862 de
`DETALLADO_PRODUCTOS_A1`.

## Nota sobre las reglas

La hoja `REGLAS DE AUTOMATIZACIÓN` quedó desactualizada cuando el contenido del
Anexo 2 se migró al Anexo 1 (se insertó la columna `TIPO DE PRODUCTO` y todo el
mapa de columnas se corrió un lugar). **La especificación vigente es
`reglas/ANEXO-1_reglas-v3.md`**; el detalle está en `docs/ANALISIS_reglas-vs-codigo.md`.
