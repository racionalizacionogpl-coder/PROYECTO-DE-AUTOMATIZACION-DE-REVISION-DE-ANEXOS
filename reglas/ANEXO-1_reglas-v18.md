# ANEXO 1 (A1) — Inventario de Productos y Procesos
## Reglas de validación consolidadas — v18

> **Origen.** v1 = hoja `REGLAS DE AUTOMATIZACIÓN` (solo filas de Anexo 1).
> v2 = script `Anexo1_Auditoria.gs`. v3 = consolidación verificada contra la
> estructura real. v4 = incorpora las contra observaciones del revisor. v5 =
> puntúa cada proceso en una fila. v6 = fija el catálogo oficial de facultades.
> v7 = unifica el vocabulario en CONFORME / OBSERVADO. **v8 = cambia el prefijo
> de las observaciones, separa los productos sin registro y abre el bloque de
> procesos en Nivel 0 y subprocesos.**
>
> **v16 = corrige la relación oficial de formularios: la numeración es
> posicional de F01 a F20 (FII F17, FPSIC F18, FIEE F19, FISI F20).**
> **v17 = el avance general (columna S) deja de ponderar por criterios y pasa
> a promediar por proceso: cada uno de los 15 o 16 procesos de Nivel 0
> evaluables pesa lo mismo, tenga 2 productos o 60.**
>
> **Criterio de autoridad:** cuando la hoja de reglas y la hoja real se
> contradicen, manda la **hoja real**. La hoja de reglas v1 quedó desactualizada
> cuando el contenido del Anexo 2 se migró al Anexo 1.

---

## 0. Estructura real de cada pestaña

| Fila | Contenido |
|---|---|
| 1–2 | vacías / marco |
| 3 | Título combinado: `Facultad de <Nombre> - Anexo 1` |
| 4 | Encabezado nivel 1 (`FUENTE` abarca D y E) |
| 5 | Encabezado nivel 2 |
| 6+ | Datos |

**Mapa de columnas (VIGENTE):**

| Col | Encabezado | Contenido |
|---|---|---|
| B | PRODUCTOS | Código + denominación (procesos, subprocesos y productos) |
| C | TIPO DE PRODUCTO | `Final / Salida (...)` o `Parcial / Registro (...)` |
| D | ACCIÓN ESTRATÉGICA | `AE.##.##` / `AE ##.##` + texto |
| E | ACTIVIDAD OPERATIVA | Texto libre |
| F | CLASIFICACIÓN | Regulación · Servicio · Bien |
| G | ATRIBUTOS | Ente rector · Calidad |
| H | VARIABLES DE CALIDAD | 1 o más de las 5 variables |
| I | CRITERIOS DE VALIDACIÓN | 1 o más de los 5 criterios |

**Rango de análisis: B:I (8 columnas).**

---

## 1. Existencia de pestañas — *sin cambios*

Deben existir las 20 pestañas: FM, FDCP, FLCH, FFB, FO, FE, FQIQ, FMV, FCA,
FCB, FCC, FCE, FCF, FCM, FCCSS, FIGMMG, FII, FPSIC, FIEE, FISI.

**1.2 (NUEVA).** La pestaña se identifica por **coincidencia exacta de sigla**,
no por subcadena. `FM` ≠ `FMV`, `FCC` ≠ `FCCSS`, `Medicina` ≠ `Medicina Veterinaria`.

---

## 2. Jerarquía de la columna B — *v4: la profundidad deja de ser fija*

Los tres niveles llevan código, pero **la profundidad no es la misma en todas
las facultades**: la FDCP llega a cinco niveles y la FO resuelve procesos en dos.
Fijar «producto = cuatro segmentos», como hacía la v3, marcaba como sin código
productos perfectamente codificados.

**2.1 Regla de clasificación (reemplaza a la de profundidad fija):**

> Un código es **PROCESO** si otro código de la misma hoja lo tiene como prefijo.
> Un código sin descendientes es un **PRODUCTO**, cualquiera sea su profundidad.
> Un código de un solo nivel (`PE.01`) es siempre proceso, aunque no tenga hijos.

Ejemplos verificados:

| Código | Tiene descendientes | Clasificación |
|---|---|---|
| `PM.01.01.01_F02 DISEÑO Y ACTUALIZACIÓN CURRICULAR` (FDCP) | sí (`PM.01.01.01.01`) | Proceso |
| `PM.01.01.01.01_F02 PLAN CURRICULAR DE PREGRADO` (FDCP) | no | **Producto** |
| `PE.01.02_F01 MODERNIZACIÓN DE LA FACULTAD` (FM) | sí (`PE.01.02.01`) | Proceso |
| `PE.01.01.01_F01 PLAN ESTRATÉGICO APROBADO` (FM) | no | **Producto** |
| `PM.02.01_F05 ARTÍCULOS CIENTÍFICOS PUBLICADOS` (FO) | no | **Producto** |

Esta regla sustituye además a la lista fija `SUBPROCESOS_EXCLUIDOS` y a la
exclusión que pedía la contra observación de la FDCP: los seis subprocesos de
Nivel 2 quedan clasificados como procesos porque tienen descendientes, sin
necesidad de enumerarlos.

**2.2 Formato del código.** Prefijos `PE`, `PM`, `PS`. El sufijo de formato se
acepta escrito de cuatro maneras, todas presentes en los datos: `_F04`, `-F04`,
`.F07` y `_04` (sin la F).

**2.3 Filas que NO son producto:**
- **Catalogaciones** (ver 2.5)
- Todo código con descendientes
- Todo código de un solo nivel
- Cualquier fila cuya denominación coincida con una de las 16 de Nivel 0
- **Denominaciones que abren nombrando un proceso** (ver 2.6)

Ninguna se descarta en silencio: todas se publican en
`OBSERVACIONES_DE_PROCESO_A1` con su observación.

**2.4 Cuando la celda arrastra varios códigos, manda el más superficial.**
Es el que indica el nivel real de la fila. En
`PE.02.01.05_F04 PE.02.01_04 ASEGURAMIENTO DE LA CALIDAD` (FFB) el código válido
es `PE.02.01`: un subproceso, no un producto de cuatro niveles.

**2.5 Catalogaciones — NUEVA en v9.**

`PROCESOS ESTRATÉGICOS`, `PROCESOS MISIONALES` y `PROCESOS DE SOPORTE` encabezan
cada grupo de procesos de Nivel 0. **No son productos ni procesos, y no les
corresponde codificación.**

Se reconocen aunque estén en singular (`PROCESO DE SOPORTE`) y aunque arrastren
un código o un número de formulario suelto (`F06 PROCESOS MISIONALES`). Cuando lo
llevan, la observación pide retirarlo:

> Columna B --> NO LE CORRESPONDE UNA CODIFICACIÓN. «PROCESOS DE SOPORTE» no es
> un producto ni un proceso: es la catalogación que encabeza un grupo de procesos
> de Nivel 0. Retire «PM.03.04.04_F04» y deje solo la denominación.

En el Anexo 1 hay **17 filas** en este caso, repartidas entre FFB, FO, FE, FQIQ,
FMV, FCB, FCE, FCF, FIGMMG y FII.

**2.6 Denominación que nombra un proceso — NUEVA en v9.**

Una denominación que abre con `PROCESO`, `SUBPROCESO` o `SUB PROCESO` **en
singular** nombra un proceso, aunque su código no tenga descendientes:

> Columna B --> CODIFICACIÓN A CORREGIR. «PROCESO DE COBERTURA Y SOPORTE
> PROTOCOLAR» nombra un proceso, no un producto, pero está codificado como
> producto («PS.10.03_F04»).

**Solo en singular.** El plural describe entregables: `PROCESOS DE ADQUISICIÓN
TRAMITADOS` es un producto real de la FO. Los plurales que sí son catalogación
los atrapa antes la regla 2.5.

## 3. Cobertura de los 16 procesos Nivel 0 — *v1 regla 2.1, PENDIENTE de implementar*

| # | Código | Denominación |
|---|---|---|
| 1 | PE.01 | GESTIÓN ESTRATÉGICA |
| 2 | PE.02 | GESTIÓN DE LA CALIDAD Y MEJORA CONTINUA |
| 3 | PE.03 | GESTIÓN DE RELACIONES INTERINSTITUCIONALES |
| 4 | PM.01 | GESTIÓN DE LA FORMACIÓN ACADÉMICA |
| 5 | PM.02 | GESTIÓN DE LA INVESTIGACIÓN |
| 6 | PM.03 | GESTIÓN DE LA RESPONSABILIDAD Y VINCULACIÓN SOCIAL |
| 7 | PS.01 | GESTIÓN DE ADMISIÓN Y MATRÍCULA |
| 8 | PS.02 | GESTIÓN DOCUMENTAL |
| 9 | PS.03 | GESTIÓN DE BIENESTAR INTEGRAL |
| 10 | PS.04 | GESTIÓN DE RECURSOS ECONÓMICOS |
| 11 | PS.05 | GESTIÓN DE RECURSOS HUMANOS |
| 12 | PS.06 | GESTIÓN DE ABASTECIMIENTO Y SERVICIOS |
| 13 | PS.07 | GESTIÓN DE LA TECNOLOGÍA DE LA INFORMACIÓN |
| 14 | PS.08 | GESTIÓN DE ACTIVIDADES PRODUCTIVAS |
| 15 | PS.09 | GESTIÓN DE RECURSOS BIBLIOGRÁFICOS |
| 16 | PS.10 | GESTIÓN DE LA COMUNICACIÓN |

**3.2 (de las directrices del propio Anexo 1).**
`PE.03` y `PS.08` **no aplican a todas las facultades**. Su ausencia se reporta
como *No aplica*, nunca como incumplimiento.

**3.4 Cuándo un proceso de Nivel 0 existe — NUEVA en v15.**

Un proceso existe si la pestaña le registró contenido, tenga o no su fila de
encabezado. Es el mismo criterio de las fichas del Anexo 3: lo que no está no se
cuenta, pero lo que está sí, aunque esté incompleto.

| Situación | Estado | ¿Cuenta? |
|---|---|---|
| Tiene su fila de encabezado | se evalúa sobre los 5 criterios | sí |
| **No la tiene, pero hay códigos que dependen de él** (`PS.08.01`, `PS.08.02.03`…) | **OBSERVADO, 4/5** | **sí** |
| Ni encabezado ni códigos, y es opcional | `NO APLICA` | no |
| Ni encabezado ni códigos, y es obligatorio | `SIN REGISTRAR`, 0/5 | sí |

El segundo caso falla el criterio de **Registro**, que es precisamente lo que le
falta, y la observación lo dice:

> Columna B --> FALTA LA FILA DE ENCABEZADO. La pestaña tiene 32 códigos que
> dependen de PS.08, de modo que el proceso sí se ejecuta, pero no está su fila.
> Registre el encabezado PS.08_F## GESTIÓN DE ACTIVIDADES PRODUCTIVAS delante de
> sus subprocesos y productos.

**Medido sobre el Anexo 1**, tres procesos estaban en ese caso y hasta la v14 no
se contabilizaban: **FFB PS.08** (32 códigos), **FE PS.08** (7) y **FCB PS.06**
(3, obligatorio, que salía como `SIN REGISTRAR`).

**3.3 (NUEVA — v4). Un proceso de Nivel 0 se reconoce por dos vías, y basta una:**

1. **Por denominación**, aunque el código sea otro o esté mal.
2. **Por un código de un nivel embebido en cualquier posición de la celda**, no
   solo al principio.

Varias facultades arrastran dos códigos en la misma celda —el de la posición en
que quedó la fila y el que de verdad le corresponde—, de modo que leer solo el
primero dejaba el proceso invisible:

| Celda real | Proceso que la v3 no veía |
|---|---|
| `PM.03.19_F05 PS.01 GESTIÓN DE ADMISIÓN Y MATRÍCULA` (FO) | PS.01 |
| `PE.01.03.06_F04 PE.02_04 GESTIÓN DE LA CALIDAD Y MEJORA CONTINUA` (FFB) | PE.02 |
| `PM.01.04.07_F07 PM.02.F07 GESTIÓN DE LA INVESTIGACIÓN` (FQIQ) | PM.02 |
| `PS.09_F06 Gestión de Comunicación` (FE) | PS.10 |

Cuando el código y la denominación señalan procesos distintos, **manda la
denominación** y la discrepancia se reporta (ver §7).

---

## 4. Criterios puntuables por producto

8 criterios, 1 punto cada uno.

| # | Col | Criterio | Condición de aprobación |
|---|---|---|---|
| 1 | B | Código | Formato `XX.##.##.##_F##` |
| 2 | C | Tipo de producto | Contiene `Final` o `Parcial` |
| 3 | D | Acción estratégica | Ver 4.3 |
| 4 | E | Actividad operativa | Ver 4.4 |
| 5 | F | Clasificación | = `Regulación` \| `Servicio` \| `Bien` |
| 6 | G | Atributos | = `Ente rector` \| `Calidad` |
| 7 | H | Variables de calidad | Contiene ≥1 de las 5 variables |
| 8 | I | Criterios de validación | Contiene ≥1 de los 5 criterios |

**4.3 Acción estratégica (col D) — REGLA CERRADA, ampliada en v18.**

Formato exigido: **`AE` o `AEI` + numeración de dos niveles + descripción**.
Ejemplos: `AE.02.01 Formación académica de calidad`,
`AEI.01.02 Enseñanza académica en programas de estudio acreditados`.

**[C44] Se acepta `AEI` desde la v18.** Hasta la v17 la sigla del PEI se
rechazaba y se pedía traducirla a la `AE` equivalente. Las facultades ya
registran la Acción Estratégica Institucional con su sigla y su numeración del
PEI, así que `AEI.##.## + descripción` es válida, con las mismas exigencias
que `AE`: dos niveles y texto después del código. Medido sobre el Anexo 1 de
noviembre: 178 celdas `AEI` en 7 facultades (FM, FDCP, FLCH, FFB, FCF, FIGMMG,
FPSIC) pasan de error a válidas, y ninguna otra celda cambia de resultado.
Se aceptan como separador el punto, el espacio o el guion, y como separador
entre código y texto el espacio, los dos puntos o ninguno.

Los dos niveles son `AE.<objetivo>.<acción>`: el primero identifica el objetivo
estratégico del que deriva la acción y el segundo el correlativo de la acción.
Por eso `AE.02` es un registro incompleto — nombra el objetivo, no la acción.

**Siglas rechazadas.** Ninguna de estas es una forma válida de la acción
estratégica, y cada una falla por un motivo distinto:

| Sigla | Filas | Por qué es un error | Corrección |
|---|---|---|---|
| `OE` | 19 | Nivel jerárquico equivocado: es un *Objetivo* Estratégico, no una *Acción*. El objetivo agrupa varias acciones. | Descender al nivel de acción: de `OE.02` → `AE.02.01` + descripción. |
| `AO` / `AOI` | 3 | Contenido en la columna equivocada: identifica una *Actividad Operativa*, que va en la **columna E**. | Trasladar el texto a E y registrar en D la AE o AEI de la que depende. |
| `AS` | 76 | Sigla no reconocida en el planeamiento institucional. Además vienen sin descripción, solo el código. | Reemplazar por la AE correspondiente en formato `AE.##.##` + texto. |
| `AM` | 20 | Igual que `AS`. | Igual que `AS`. |

**Otros incumplimientos de la columna D:**

| Caso | Filas | Motivo |
|---|---|---|
| Vacía | 200 | Todo producto se alinea a una AE. |
| Código sin descripción (`AE.04.02` a secas) | 512 | La regla 3.1 exige código **seguido del texto** de la acción. |
| Marcador de vacío (`NINGUNO`) | 5 | No es una acción estratégica. |

**4.4 Actividad operativa (col E) — v4: se admite `NINGUNO`; v18: código AOI.**

**[C44] Código de la actividad operativa.** Cuando la celda empieza con `AOI`,
se valida el código del POI: `AOI` + **11 dígitos** + descripción, con o sin
guion entre ambos (`AOI00008801072 - GESTIÓN DEL PLANEAMIENTO INSTITUCIONAL Y
PRESUPUESTO`). Es incumplimiento un código con otra cantidad de dígitos o sin
descripción. El texto libre sin código sigue siendo válido. Medido sobre el
Anexo 1 de noviembre: las 326 celdas con `AOI` cumplen el formato.

Contra observación del revisor: *«la regla dice que la columna E solo será texto,
por lo que no viola esa regla»*. Se acepta cualquier texto, incluidos los
marcadores de vacío. Sigue siendo incumplimiento:

- la celda **vacía**;
- un texto de dos caracteres o menos;
- una **Acción Estratégica** registrada aquí por error (corresponde a la columna D).

El criterio estricto de la v3 queda disponible en
`CONFIG_A1.RECHAZAR_NULOS_EN_E`, hoy en `false`.

**Valores de referencia**

- Variables de calidad (H): Tiempo de atención · Cumplimiento de plazos · Claridad · Trato recibido · Facilidad de acceso
- Criterios de validación (I): a) solucionar un problema público · b) funciones sustantivas de la facultad · c) misión, estrategia, objetivos y metas institucionales · d) necesidades de las personas a quienes sirve la facultad · e) desarrollo y fortalecimiento de la facultad

---

## 5. Estados y avance — *reescrita en v7*

**5.1 Tres estados excluyentes, los mismos para productos y para procesos.**

| Estado | En un producto | En un proceso |
|---|---|---|
| **CONFORME** | cumple los 8 criterios | cumple los 5 criterios |
| **OBSERVADO** | se llenó, pero incumple al menos un criterio | incumple al menos un criterio |
| **SIN REGISTRAR** | tiene vacías las columnas C a I | es un Nivel 0 obligatorio que no está en la pestaña |

```
TOTAL = CONFORMES + OBSERVADOS + SIN REGISTRAR
```

Son excluyentes: hasta la v12 los sin registrar se contaban dentro de los
observados y su columna era un desglose. Ahora son una categoría propia, porque
no es lo mismo llenar con errores que no llenar.

Los procesos conservan además `NO APLICA`, que no es un estado de cumplimiento
sino de existencia: no se puntúa ni entra en el denominador del avance. Cuándo
corresponde lo fija la regla 3.4.

**Nota sobre `SUBPROCESOS SIN REGISTRAR`.** La columna existe por simetría con el
bloque de Nivel 0, pero su valor es siempre **0**: un subproceso solo aparece en
la hoja si está registrado en la pestaña. Lo que puede faltar es un proceso de
Nivel 0 obligatorio, porque su lista es fija.

**5.2 Los tres avances.**

**Avance (productos)** y **avance (procesos)** miden lo mismo que en la v8:
**criterios cumplidos**, no filas conformes.

```
Avance (productos)  =  Σ criterios cumplidos por los productos
                       ────────────────────────────────────────
                              nº de productos × 8

Avance (procesos)   =  Σ criterios cumplidos por los procesos
                       ────────────────────────────────────────
                              nº de procesos × 5
```

Los 8 criterios de un producto son las columnas B a I. Los 5 de un proceso son
registro, código único, coherencia código–denominación, sufijo de formulario y
denominación en mayúsculas (regla 9). En el bloque de procesos entran los de
Nivel 0, los subprocesos y las catalogaciones. Quedan fuera los `NO APLICA`
—PE.03 y PS.08 ausentes—, que no se puntúan ni cuentan en el denominador.

**Por qué se mide sobre criterios y no sobre estados.** La fórmula anterior
repartía medio punto a cada parcial; con dos estados eso daría lo mismo a un
producto al que le falta un criterio que a uno enteramente vacío. Medido sobre
criterios, un producto con 7 de 8 aporta 88 % y uno con 1 de 8 aporta 13 %.

**[C42] El avance general cambia de método en la v17: promedia por proceso, no
por criterio.**

Hasta la v16 era la suma de todos los criterios de productos y de procesos,
dividida entre todo lo que había que cumplir. El problema: un producto pesa 8
criterios y una facultad puede tener decenas de ellos, así que el bloque de
productos siempre pesaba mucho más que el de procesos. Resultado real, medido
sobre el Anexo 1: la FM, a la que le faltan **9 de 15** procesos de Nivel 0
obligatorios, salía con **81 %** de avance general, porque sus 62 productos
—bien llenados en su mayoría— diluían la falta casi total del bloque de
procesos. Eso no es razonable: si a una facultad le falta más de la mitad de su
marco de procesos, no puede estar "avanzada".

La regla nueva parte de que **el producto existe porque el proceso lo generó**:
sin el proceso, no hay productos que evaluar, y eso tiene que pesar en el
resultado tanto como si el proceso existiera pero mal llenado.

```
Para cada proceso de Nivel 0 evaluable (obligatorio, o el opcional que sí
está presente; los NO APLICA quedan fuera, igual que en el avance de procesos):

  Si SIN REGISTRAR  →  ese proceso vale 0 % en el promedio
  Si existe         →  vale:
        criterios del proceso + de sus subprocesos + de sus productos
        ─────────────────────────────────────────────────────────────
        5 (proceso) + 5 × nº subprocesos + 8 × nº productos que cuelgan de él

Avance general de la facultad  =  promedio simple de esos valores,
                                   uno por cada proceso evaluable
```

**Cada proceso pesa lo mismo**, tenga 2 productos o 60. Un proceso con 60
productos casi perfectos no vale más que uno con 2; y un proceso ausente vale
0 % exactamente igual, sin importar cuántos productos habría agrupado si
hubiera existido.

**Ejemplo mínimo.** Un proceso con productos al 95 % de sus criterios y otro
proceso completamente ausente: el promedio es (95 + 0) / 2 = **48 %**, no un
número cercano a 95 % diluido por un solo criterio de 5.

**Verificado contra el Anexo 1 real:**

| Facultad | Procesos evaluables | Existentes | Avance general v16 | **Avance general v17** |
|---|---|---|---|---|
| FM | 15 | 6 | 81 % | **35 %** |
| FII | 15 | 3 | 67 % | **16 %** |
| FCCSS | 16 | pocos existentes, mal llenados | 59 % | **5 %** |
| FISI | 15 | pocos existentes, mal llenados | 71 % | **6 %** |
| FDCP | 15 | 15 (todos) | 100 % | 100 % |
| FO | 16 | 16 (todos) | 65 % | 66 % |
| FCB | 16 | 16 (todos) | 78 % | 79 % |

**Cuando la facultad tiene todos sus procesos registrados, el número casi no
cambia** (65↔66, 78↔79): la fórmula nueva solo golpea fuerte cuando faltan
procesos enteros, que es exactamente el caso que corrige. Cuando faltan varios,
el avance general puede caer 40, 50 o hasta 65 puntos frente a la v16.

Las columnas `AVANCE (PRODUCTOS)` y `AVANCE (PROCESOS)` **no cambian**: siguen
siendo el desglose ponderado por criterio de la regla 5.2 original. Solo cambia
la columna `AVANCE GENERAL DEL ANEXO 1`.

**5.3 Estado general de la facultad**

| Estado | Avance |
|---|---|
| CONFORME | 100 % |
| AVANZADO | ≥ 75 % |
| EN DESARROLLO | ≥ 40 % |
| CRÍTICO | < 40 % |

---

## 5.bis Hoja `RESUMEN_EJECUTIVO_A1` — *reestructurada en v8*

| # | Columna | | # | Columna |
|---|---|---|---|---|
| 1 | FACULTAD | | | |
| 2 | NOMBRE | | 10 | TOTAL PROCESOS |
| 3 | TOTAL PRODUCTOS | | | |
| 4 | PRODUCTOS CONFORMES | | 11 | PROCESOS NIVEL 0 CONFORMES |
| 5 | PRODUCTOS OBSERVADOS | | 12 | PROCESOS NIVEL 0 OBSERVADOS |
| 6 | PRODUCTOS SIN REGISTRAR | | 13 | PROCESOS NIVEL 0 SIN REGISTRAR |
| 7 | AVANCE | | 14 | SUBPROCESOS CONFORMES |
| 8 | ESTADO GENERAL | | 15 | SUBPROCESOS OBSERVADOS |
| 9 | DIAGNÓSTICO | | 16 | SUBPROCESOS SIN REGISTRAR |
| | | | 17 | AVANCE |
| | | | 18 | ESTADO GENERAL |
| | | | 19 | DIAGNÓSTICO |
| | | | 20 | CÓDIGO DE LA HOJA |
| | | | 21 | AVANCE GENERAL DEL ANEXO 1 |
| | | | 22 | CONTRAOBSERVACIÓN |

La columna 19 —**la S de la hoja**— lleva el avance general de la facultad, con
la fórmula de la regla 5.2. La 20 no la genera el script: la aporta el rescate
de columnas manuales (regla 8), con el nombre que el revisor le haya puesto.

Los tres bloques —productos, procesos de Nivel 0 y subprocesos— llevan el mismo
desglose por estado: conformes, observados y sin registrar. Las tres categorías
son excluyentes (regla 5.1).

`TOTAL PROCESOS` excluye los `NO APLICA`, que no se puntúan.

---

## 5.ter Leyenda al pie del resumen — *NUEVA en v8*

Debajo de la tabla, separada por una fila en blanco, la hoja cierra con cuatro
bloques de leyenda: **tipos de producto** (Final / Salida y Parcial / Registro,
con su destino en el Anexo 3), **estado de un producto o proceso**, **estado
general de la facultad** y **código de la hoja**.

La leyenda no interfiere con el rescate de columnas manuales: sus filas no
llevan nada en las columnas del revisor, y el rescate descarta toda fila cuyas
celdas manuales estén vacías.

---

## 6. Formato de los procesos — *NUEVA en v4*

**6.1 MAYÚSCULAS (a pedido del revisor).** La denominación de todo proceso
—Nivel 0 y subprocesos— debe escribirse íntegramente en mayúsculas.

Incumplen, entre otras: `PS.09_F06 Gestión de Comunicación` (FE),
`PE.02.01_F05 Aseguramiento de la Calidad` (FO),
`PM.01_F05 Gestión de la Formación Académica` (FO).

La observación indica el texto registrado y el texto corregido.

**6.2 Alcance.** Se evalúa sobre las filas de proceso, que no se puntúan como
productos. Por eso el resultado se publica en la hoja
`OBSERVACIONES_PROCESOS_A1`, no en `DETALLADO_PRODUCTOS_A1`.

**6.3 Sufijo de formulario `_F##`.** Todo código de una pestaña debe llevar el
sufijo del formulario asignado a su facultad.

Se admite escrito de cuatro maneras: `_F04`, `-F04`, `.F07` y `_04` (sin la F).
Tras un punto la `F` es obligatoria; sin ella, el último grupo del propio código
(`PS.10`) se confundiría con un sufijo.

**Relación oficial de la OGPL:**

| Formulario | Sigla | Facultad |
|---|---|---|
| F01 | FM | FACULTAD DE MEDICINA |
| F02 | FDCP | FACULTAD DE DERECHO Y CIENCIA POLÍTICA |
| F03 | FLCH | FACULTAD DE LETRAS Y CIENCIAS HUMANAS |
| F04 | FFB | FACULTAD DE FARMACIA Y BIOQUÍMICA |
| F05 | FO | FACULTAD DE ODONTOLOGÍA |
| F06 | FE | FACULTAD DE EDUCACIÓN |
| F07 | FQIQ | FACULTAD DE QUÍMICA E INGENIERÍA QUÍMICA |
| F08 | FMV | FACULTAD DE MEDICINA VETERINARIA |
| F09 | FCA | FACULTAD DE CIENCIAS ADMINISTRATIVAS |
| F10 | FCB | FACULTAD DE CIENCIAS BIOLÓGICAS |
| F11 | FCC | FACULTAD DE CIENCIAS CONTABLES |
| F12 | FCE | FACULTAD DE CIENCIAS ECONÓMICAS |
| F13 | FCF | FACULTAD DE CIENCIAS FÍSICAS |
| F14 | FCM | FACULTAD DE CIENCIAS MATEMÁTICAS |
| F15 | FCCSS | FACULTAD DE CIENCIAS SOCIALES |
| F16 | FIGMMG | FACULTAD DE INGENIERÍA GEOLÓGICA, MINERA, METALÚRGICA Y GEOGRÁFICA |
| F17 | FII | FACULTAD DE INGENIERÍA INDUSTRIAL |
| F18 | FPSIC | FACULTAD DE PSICOLOGÍA |
| F19 | FIEE | FACULTAD DE INGENIERÍA ELECTRÓNICA Y ELÉCTRICA |
| F20 | FISI | FACULTAD DE INGENIERÍA DE SISTEMAS E INFORMÁTICA |

**Fuente:** relación corregida de la OGPL, sobre la hoja
`CODIFICACION_DE_LAS_FACULTADES` del dashboard, columna E.

**[C41] Corregido en la v16.** La numeración **sí sigue el orden de la
relación**: cada facultad lleva el `F##` de su puesto, de F01 a F20, y el número
coincide con el nombre de su pestaña. Las cuatro últimas cambian respecto de la
v15 — FII `F20 → F17`, FPSIC `F17 → F18`, FIEE `F18 → F19`, FISI `F19 → F20`.
El detalle y el efecto de la corrección están en la regla 10.1.

**6.4 Dos defectos distintos.**

| Defecto | Cómo se reporta |
|---|---|
| La pestaña entera usa el formulario de otra facultad | **Hallazgo de hoja**: una sola vez, en el `DIAGNÓSTICO` del resumen y en la columna `FORMULARIO` |
| Filas sueltas que se apartan del sufijo del resto de la hoja | **Observación por fila**, en el criterio 4 de la hoja de procesos |

La separación evita que una pestaña mal numerada de principio a fin genere
cientos de observaciones idénticas. La comparación por fila se hace siempre
contra el **dominante de la pestaña**; el formulario **oficial** solo interviene
en el hallazgo de hoja y en la corrección sugerida.

**6.5 Estado actual, medido sobre el Anexo 1** — *recalculado en v16*.

Con la relación corregida, **cinco pestañas** llevan el formulario de otra
facultad en toda la hoja, no siete:

| Facultad | Oficial | Usa | Observación |
|---|---|---|---|
| FCF | F13 | **F02** | usa el de FDCP |
| FCCSS | F15 | **F02** | usa el de FDCP |
| FISI | F20 | **F02** | usa el de FDCP |
| FIGMMG | F16 | **F06** | usa el de FE |
| FIEE | F19 | **F17** | usa el de FII; 125 códigos con `_F17` frente a 66 con el suyo |

La FIEE es la única que mezcla: llena la mayoría de su hoja con `_F17`, pero 66
códigos sí llevan `_F19`. No es una hoja copiada de otra facultad, es una hoja
empezada con el número equivocado y corregida a medias.

**Salen de la lista la FII y la FPSIC.** Ambas estaban bien llenadas —`_F17` y
`_F18`, que son los suyos—; las marcaba el catálogo desfasado de la v15, no la
facultad. Se les debe retirar la observación de hoja.

Filas sueltas fuera del dominante: FIGMMG 11, FCC 9, FE 8, FII 7, FCA 5, FFB 2,
FLCH 1, FCB 1, FCCSS 1. Estas no cambian con la v16: se miden contra el
dominante de cada pestaña, no contra el número oficial.

**Aún sin automatizar** (requieren leer el formato de la celda, no su texto):
fuente Roboto, celdas de la columna B sin combinar, color heredado del modelo `PE.01`.

---

## 7. Integridad de la celda de la columna B — *NUEVA en v4*

**7.1 Un solo código por celda.** Se reporta la celda que arrastra dos o más
códigos.

**Cuando uno de los dos códigos es el correcto**, la observación lo dice
explícitamente en vez de limitarse a señalar que hay dos. Para
`PM.03.173_F05 PS.08 GESTIÓN DE ACTIVIDADES PRODUCTIVAS`:

> Col B — CODIFICACIÓN ERRÓNEA. El código que abre la celda, `PM.03.173_F05`, no
> corresponde a esta fila: la denominación «GESTIÓN DE ACTIVIDADES PRODUCTIVAS»
> es la del proceso de Nivel 0 PS.08, y ese código aparece también dentro de la
> misma celda («PS.08»). Debe quedar un único código: `PS.08_F05 GESTIÓN DE
> ACTIVIDADES PRODUCTIVAS`.

**7.3 Códigos de tres dígitos.** Los grupos numéricos admiten hasta tres cifras:
la FO llega a `PM.03.173`.

**7.2 Coherencia código ↔ denominación.** Cuando el código nombra un proceso de
Nivel 0 y la denominación nombra otro, se reporta la discrepancia, se toma la
denominación y se pide corregir el código. Ejemplo: `PS.09_F06 Gestión de
Comunicación` —el código es el de Recursos Bibliográficos y el nombre el de
Comunicación—.

---

## 8. Preservación del trabajo del revisor

Las columnas añadidas a mano a la derecha de las que genera el script
—`CONTRA OBSERVACIÓN` y cualquier otra— **se conservan entre corridas**.

Cada fila se reidentifica por una clave estable de contenido y, como respaldo,
por una clave alterna:

| Hoja | Clave | Respaldo |
|---|---|---|
| `DETALLADO_PRODUCTOS_A1` | facultad + código + nombre del producto | facultad + fila |
| `OBSERVACIONES_DE_PROCESO_A1` | facultad + código del proceso | facultad + denominación |
| `RESUMEN_EJECUTIVO_A1` | facultad | — |

Si el Anexo 1 se corrige y una fila cambia de código y de nombre a la vez, su
contra observación no puede reidentificarse y queda en blanco.

**8.1 (v5) Renombrado de hojas.** `COBERTURA_PROCESOS_A1` y
`OBSERVACIONES_PROCESOS_A1` se renombran a `OBSERVACIONES_DE_PROCESO_A1` en vez
de crearse de nuevo, para que las contra observaciones ya escritas viajen con la
hoja.

**8.2 (v5) Encabezados heredados.** Los encabezados que el script generó en
cualquier versión no se confunden con columnas del revisor, de modo que un
cambio de formato no resucita columnas obsoletas ni pierde las manuales.

---

## 9. Hoja `OBSERVACIONES_DE_PROCESO_A1` — *NUEVA en v5*

Reemplaza a `COBERTURA_PROCESOS_A1` y a `OBSERVACIONES_PROCESOS_A1`, que se
fusionan. **Una fila por proceso, puntuada**: los 16 de Nivel 0 de cada facultad
—estén o no— más cada subproceso registrado.

| Columna | Contenido |
|---|---|
| FACULTAD · CÓDIGO · PROCESO | identificación (el código de Nivel 0 es el del catálogo, para que la clave sea estable) |
| NIVEL | `Nivel 0` o `Subproceso` |
| EXIGENCIA | `Obligatorio`, `Opcional` o `—` |
| FILA | fila del Anexo 1, o `—` si no está registrado |
| ESTADO | `CONFORME` · `OBSERVADO` · `FALTANTE` · `NO APLICA` |
| CUMPLIMIENTO · CRITERIOS | porcentaje y `n/5` |
| OBSERVACIONES Y CORRECCIONES | el detalle, en la misma fila |

**Los 5 criterios:**

| # | Criterio |
|---|---|
| 1 | Registro — el proceso está registrado en la hoja |
| 2 | Código único en la celda |
| 3 | Código coherente con la denominación |
| 4 | Sufijo de formulario consistente con la pestaña |
| 5 | Denominación en MAYÚSCULAS |

**Estados:** `CONFORME` con 5/5; `OBSERVADO` por debajo; `FALTANTE` para un
Nivel 0 obligatorio ausente (0/5); `NO APLICA` para `PE.03` y `PS.08` ausentes,
que no se puntúan.


---

## 9.bis Redacción de las observaciones — *NUEVA en v8*

Toda observación se encabeza con la columna a la que se refiere, en el formato:

```
Columna B --> CODIFICACIÓN ERRÓNEA. El código que abre la celda...
Columna D --> Sigla incorrecta "AEI". La regla 3.1 del Anexo 1 normaliza...
```

Sustituye al formato `Col B — ...` de las versiones anteriores, a pedido del
revisor. Se aplica a las ocho columnas validadas.

**9.bis.0 Una observación por renglón — NUEVA en v10.**

Las observaciones de una misma fila se separan con un **salto de línea** dentro
de la celda, no con `||`. Se ordenan por columna:

1. la **columna B**, que es la que identifica la fila;
2. de la **C a la I**, en el orden de la hoja;
3. la **observación final**, cuando la hay.

Así se lee la fila 57 de la FCB:

```
Columna B --> La celda arrastra 2 códigos ("PE.03.01.05_F10", "PE.03.01.03"). Debe quedar un único código seguido de la denominación.
Columna C --> Tipo de producto vacío. Debe indicarse "Final / Salida" o "Parcial / Registro".
Columna D --> Acción Estratégica vacía. Debe registrarse el código AE.##.## seguido de la descripción de la acción.
Columna E --> Actividad Operativa vacía. Registre la actividad operativa del POI que ejecuta este producto.
Columna F --> Clasificación vacío. Valores admitidos: Regulación · Servicio · Bien.
Columna G --> Atributo institucional vacío. Valores admitidos: Ente rector · Calidad.
Columna H --> Variables de calidad sin registrar. Debe aparecer al menos uno de: …
Columna I --> Criterios de validación sin registrar. Debe aparecer al menos uno de: …
Observación final --> Para las columnas C a I utilice los desplegables de la hoja.
```

El salto solo se ve con el **ajuste de texto** activado, de modo que el script lo
aplica a todo el bloque de datos de las tres hojas y alinea las celdas arriba.
No basta con ajustar la última columna: el resumen lleva sus dos `DIAGNÓSTICO`
en medio de la tabla.

**Las observaciones de corridas anteriores no se convierten solas.** El formato
lo decide quien escribe la celda, de modo que las que quedaron con `||` siguen
así hasta que se vuelva a auditar. Para no tener que reauditar solo por eso, el
menú **Auditoría OGPL** incluye *Convertir observaciones antiguas a renglones*,
que reescribe únicamente las columnas `OBSERVACIONES…` y `DIAGNÓSTICO` de las
tres hojas y deja intactas las del revisor.

**9.bis.1 Cierre de los productos sin registro — NUEVA en v9.** Un producto con
las columnas C a I vacías recibe las ocho observaciones de columna y cierra con:

> Observación final --> Para las columnas C a I utilice los desplegables de la hoja.

El hecho de estar sin registro ya se contabiliza en la columna
`PRODUCTOS SIN REGISTRO` del resumen, de modo que la observación no necesita
encabezarlo.

---

## 10. Catálogo de facultades — *NUEVA en v6, corregida en v16*

### 10.1 Relación oficial de formularios — *corregida en v16*

La OGPL entregó la relación corregida de formularios. **La numeración es
posicional**: cada facultad lleva el `F##` de su puesto en la relación, de F01 a
F20, y ese número coincide con el nombre de su pestaña en el Anexo 1.

| # | Sigla | Formulario | Pestaña | Nombre oficial |
|---|---|---|---|---|
| 1 | FM | **F01** | `F01_FM` | FACULTAD DE MEDICINA |
| 2 | FDCP | **F02** | `F02_FDCP` | FACULTAD DE DERECHO Y CIENCIA POLÍTICA |
| 3 | FLCH | **F03** | `F03_FLCH` | FACULTAD DE LETRAS Y CIENCIAS HUMANAS |
| 4 | FFB | **F04** | `F04_FFB` | FACULTAD DE FARMACIA Y BIOQUÍMICA |
| 5 | FO | **F05** | `F05_FO` | FACULTAD DE ODONTOLOGÍA |
| 6 | FE | **F06** | `F06_FE` | FACULTAD DE EDUCACIÓN |
| 7 | FQIQ | **F07** | `F07_FQIQ` | FACULTAD DE QUÍMICA E INGENIERÍA QUÍMICA |
| 8 | FMV | **F08** | `F08_FMV` | FACULTAD DE MEDICINA VETERINARIA |
| 9 | FCA | **F09** | `F09_FCA` | FACULTAD DE CIENCIAS ADMINISTRATIVAS |
| 10 | FCB | **F10** | `F10_FCB` | FACULTAD DE CIENCIAS BIOLÓGICAS |
| 11 | FCC | **F11** | `F11_FCC` | FACULTAD DE CIENCIAS CONTABLES |
| 12 | FCE | **F12** | `F12_FCE` | FACULTAD DE CIENCIAS ECONÓMICAS |
| 13 | FCF | **F13** | `F13_FCF` | FACULTAD DE CIENCIAS FÍSICAS |
| 14 | FCM | **F14** | `F14_FCM` | FACULTAD DE CIENCIAS MATEMÁTICAS |
| 15 | FCCSS | **F15** | `F15_FCCSS` | FACULTAD DE CIENCIAS SOCIALES |
| 16 | FIGMMG | **F16** | `F16_FIGMMG` | FACULTAD DE INGENIERÍA GEOLÓGICA, MINERA, METALÚRGICA Y GEOGRÁFICA |
| 17 | FII | **F17** ← *era F20* | `F17_FII` | FACULTAD DE INGENIERÍA INDUSTRIAL |
| 18 | FPSIC | **F18** ← *era F17* | `F18_FPSIC` | FACULTAD DE PSICOLOGÍA |
| 19 | FIEE | **F19** ← *era F18* | `F19_FIEE` | FACULTAD DE INGENIERÍA ELECTRÓNICA Y ELÉCTRICA |
| 20 | FISI | **F20** ← *era F19* | `F20_FISI` | FACULTAD DE INGENIERÍA DE SISTEMAS E INFORMÁTICA |

La v6 había recogido las cuatro últimas rotadas, sobre una relación preliminar
en la que la numeración **no** era posicional. Queda corregido: F17 → F20 sigue
el orden de la relación.

### 10.2 Efecto de la corrección sobre el diagnóstico

El catálogo no cambia cómo se marca cada fila. La regla 6.4 compara el sufijo de
una fila contra **el que usa mayoritariamente su propia pestaña**, no contra el
número oficial, así que las observaciones fila a fila son las mismas.

Lo que cambia es la columna `FORMULARIO` del resumen y la nota **FORMULARIO
AJENO** del diagnóstico de procesos, que sí comparan contra el número oficial.
Medido sobre las 3 668 filas del Anexo 1:

| Facultad | Oficial v15 | Oficial v16 | Sufijo que usa la pestaña | Antes | Ahora |
|---|---|---|---|---|---|
| FCF | F13 | F13 | `_F02` (88 códigos) | ajeno | ajeno |
| FCCSS | F15 | F15 | `_F02` (112) | ajeno | ajeno |
| FIGMMG | F16 | F16 | `_F06` (50) | ajeno | ajeno |
| **FII** | F20 | **F17** | `_F17` (34) | ajeno | **correcto** |
| **FPSIC** | F17 | **F18** | `_F18` (326) | ajeno | **correcto** |
| FIEE | F18 | **F19** | `_F17` (125, frente a 66 con `_F19`) | ajeno | ajeno |
| FISI | F19 | **F20** | `_F02` (90) | ajeno | ajeno |

**Las pestañas marcadas bajan de siete a cinco.** La FII y la FPSIC estaban bien
llenadas desde el principio: las marcaba el catálogo, no la facultad. La FIEE y
la FISI siguen marcadas, pero ahora el mensaje les exige el número correcto
—`_F19` y `_F20`—; antes se les reclamaba `_F18` y `_F19`, que tampoco eran los
suyos.

### 10.3 Nombres oficiales y títulos de pestaña

El nombre oficial es el que se publica en el resumen. **No siempre coincide con
el título de la pestaña**, así que la localización de la hoja sigue apoyándose en
la sigla y en alias que recogen el título tal como está escrito hoy:

| Sigla | Nombre oficial | Título de la pestaña |
|---|---|---|
| FIEE | FACULTAD DE INGENIERÍA ELECTRÓNICA Y ELÉCTRICA | «Ingeniería Eléctrica Electrónica» — palabras invertidas |
| FCA | FACULTAD DE CIENCIAS ADMINISTRATIVAS | «Ciencias Administrativa» — singular |
| FCF | FACULTAD DE CIENCIAS FÍSICAS | «Ciencias Fisicas» — sin tilde |
| FFB | FACULTAD DE FARMACIA Y BIOQUÍMICA | «Farmacia y Bioquimica» — sin tilde |
| FO | FACULTAD DE ODONTOLOGÍA | «Odontologia» — sin tilde |

Las tildes no son problema —la comparación las ignora—, pero el orden de las
palabras y el número gramatical sí, y por eso se conservan los alias.

La columna `FORMULARIO` del resumen muestra el número oficial y, entre
paréntesis, el que realmente usa la pestaña cuando no coinciden — por ejemplo
`F19 (la hoja usa F17)` para la FIEE. Cuando coinciden muestra el número a
secas.


---

## 11. Hoja `dashboard` — *retirada en v14*

El tablero que la v11 creaba dentro del libro queda sin efecto: el script ya no
lo genera ni lo mantiene. Una hoja `dashboard` que haya quedado de una corrida
anterior debe borrarse a mano; el script no la toca.

**Lo que sí se conserva** es el orden de las hojas de detalle, que se introdujo
para poder anclar los enlaces del tablero pero es útil por sí solo: por facultad
y, dentro de cada una, primero los conformes, después los observados y al final
los sin registrar; a igualdad de estado, por su número de fila en el Anexo 1. En
la hoja de procesos se agrupa además por nivel —Nivel 0, subprocesos y
catalogaciones—.

El orden original del Anexo 1 se conserva en la columna `FILA` de ambas hojas y
puede recuperarse ordenando por ella.

Las hojas que el script mantiene son tres: `RESUMEN_EJECUTIVO_A1`,
`DETALLADO_PRODUCTOS_A1` y `OBSERVACIONES_DE_PROCESO_A1`.


---

## 12. Fila de totales del resumen — *NUEVA en v15, avance general corregido en v17*

`RESUMEN_EJECUTIVO_A1` cierra con una fila **TOTAL**, debajo de las 20
facultades, con la misma estructura de columnas.

**Los recuentos se suman.** El avance de productos y el de procesos **se
recalculan ponderados por criterios evaluados**, con la misma fórmula de la
regla 5.2 aplicada al conjunto:

```
Avance total (productos o procesos)  =  Σ criterios cumplidos de las 20 facultades
                                         ───────────────────────────────────────────
                                         Σ criterios que había que cumplir en las 20
```

Ahí sí conviene ponderar por criterio y no promediar los 20 porcentajes:
promediarlos daría el mismo peso a la FII, con 30 productos, que a la FO, con
283, y una facultad pequeña y floja hundiría el total tanto como una grande.

**[C42] El avance general es distinto, y se corrige en la v17.** Cada facultad
ya trae su avance general normalizado a 0-100 en el mismo sentido para las
20: "cuánto de su propio marco de 15 o 16 procesos completó" (regla 5.2). Por
eso el total **sí es el promedio simple de esos 20 valores**:

```
Avance general total  =  Σ avance general de las 20 facultades
                         ────────────────────────────────────────
                                            20
```

Ponderar este total por criterios de producto o de proceso —como se hacía
hasta la v16— reintroduce exactamente el sesgo que la v17 corrige a nivel de
facultad: una facultad grande y bien llenada (muchos productos, muchos
criterios) volvería a tapar a las que les faltan procesos enteros, solo que
ahora en el número que resume a toda la universidad en vez de en el de una
sola facultad.

Sobre los datos de la última corrida, el promedio simple de los 20 avances
generales da **64 %**; con el método ponderado de la v16 daba **84 %**. Los 20
puntos de diferencia son la magnitud real del problema que motivó la v17: media
universidad tiene procesos de Nivel 0 completos sin registrar, y un total
ponderado por producto lo escondía.