# ANEXO 3 (A3) — Ficha Técnica de Producto y Proceso

## v3 — Código de producto `PADRE_F##-P##` (script v4)

**V3.1 Formato.** Salidas (Descripción › H) y Registros (Ejecución) aceptan el
código de producto del Anexo 1 v19: el código del proceso padre seguido de
`-P##`, por ejemplo `PE.01.01_F18-P01`. Mientras dure la renumeración se acepta
también el formato anterior (`PE.01.01.01_F18`).

**V3.2 Nivel.** Un `PADRE-P##` vale como el nivel de su padre más uno, así que
la exigencia de la regla 4 no cambia: Salidas y Registros piden 3 niveles, o 4
en las facultades de nivel 2. Se admite además un producto colgado directo del
proceso de nivel 0 (`PS.10_F18-P01`), igual que en el Anexo 1. Un `-P##` en
Definición o en Procesos es error: ahí va un proceso.

**V3.3 Cotejo durante la renumeración.** Si el código exacto no está en el
Anexo 1:
1. se traduce con la hoja `EQUIVALENCIAS_CODIGOS` que AutoAnexo1 escribe en el
   Anexo 1 al renumerar (código anterior → código nuevo, siguiendo la cadena
   si una pestaña se renumeró más de una vez);
2. si no figura ahí, se busca un producto con la misma denominación bajo el
   mismo proceso padre.

En ambos casos el resultado es `Sí (código en otro formato)` y la observación
pide consignar el mismo código en ambos anexos.

Medido sobre los Anexos 1 y 3 de noviembre (363 productos con código único en
el Anexo 3): hoy se encuentran 361. Renumerando el Anexo 1, la v3 encontraría
solo 22; la v4 sin la tabla, 68 (muchas celdas del Anexo 3 traen el código sin
denominación); la v4 con la tabla, los mismos 361.

**V3.4 Facultades de nivel 2:** FM, FDCP, FFB, FE, FMV, FCM y FIEE.

## Reglas de validación — v2 (las 20 facultades)

> **Origen.** Directrices escritas en la propia hoja del Anexo 3 (bloque
> `DIRECTRICES`, 7 reglas obligatorias) + estructura real observada en la
> pestaña `2.FDCP`.
>
> **Criterio de autoridad:** cuando las directrices y la hoja real se
> contradicen, manda la **hoja real**; toda desviación queda anotada aquí.
>
> **v2:** las pestañas se detectan solas por su nombre `F##_SIGLA`, se agrega el
> criterio de producto final obligatorio, los hallazgos pasan a cuatro niveles y
> aparece el resumen de las 20 facultades.
>
> Implementación: `apps-script/Anexo3_Revision_v2.gs`.
> Pruebas: `tests/anexo3.test.js`.

---

## 0. Pestañas de facultad

Cada facultad vive en una pestaña llamada **`F##_SIGLA`** (`F01_FM`, `F02_FDCP`,
`F03_FLCH` … `F20_FII`). El script las detecta solas sobre el libro activo: no
hay que nombrar ninguna facultad ni duplicar funciones.

**0.0.1** El **número del nombre manda** sobre el catálogo: es el formulario
`F##` que deben llevar todos los códigos de esa pestaña, y es el orden en que la
facultad aparece en el reporte (F01 → F20), sin importar el orden físico de las
pestañas.

**0.0.2** Una pestaña cuya sigla no esté en el catálogo igual se revisa; se
queda sin nombre completo, no se descarta. Las pestañas que no siguen el formato
(`DASHBOARD`, `CONFIG_A3`…) se ignoran.

**0.0.4 Número de fichas por hoja.** La plantilla trae **16** fichas técnicas,
pero hay facultades cuyos procesos no llegan a 16 y cuya ficha sobrante se
eliminó (la FDCP trabaja con 15). Que falten fichas **no es hallazgo**: el
resumen informa `FICHAS` y `FICHAS ESPERADAS` y lo anota en la columna `NOTAS`,
sin penalizar el avance. El número esperado se declara en
`CONFIG_A3.FICHAS_ESPERADAS` (null para no informarlo).

**0.0.5 Plantillas en blanco.** Una ficha sin nombre, sin código y sin una sola
fila en la descripción es una plantilla que quedó de más, no una ficha a medio
hacer: no se computa ni arrastra el porcentaje, y se informa aparte. No se
reconoce por el conteo de campos completos, porque la plantilla suele venir con
la unidad de elaboración ya escrita.

**0.0.3** `CONFIG_A3.SOURCE_TAB_NAME` vacío = todas. Con texto, filtra por sigla,
código o nombre de pestaña, separando por coma.

---

## 0. Estructura real de una ficha técnica

Cada pestaña de facultad encadena varias fichas técnicas, una debajo de otra.
Los bloques **no están en filas fijas**: cambian de ficha en ficha según cuántos
proveedores, entradas y procesos tenga. Por eso el script no usa desplazamientos
de fila, sino que **localiza cada sección por su etiqueta**.

| Bloque | Se reconoce por |
|---|---|
| Inicio de ficha | fila con la etiqueta `NOMBRE` y, a su derecha, `CODIGO` |
| Definición del Proceso | las etiquetas de sus 8 campos |
| Descripción del Proceso | `DESCRIPCIÓN DEL PROCESO` + fila `PROVEEDORES … BENEFICIARIOS` |
| Ejecución del Proceso | `EJECUCIÓN DEL PROCESO` |
| Formalización del Proceso | `FORMALIZACIÓN DEL PROCESO` + `UNIDAD / CARGO / NOMBRE Y APELLIDOS / FIRMA` |

**0.1** La primera ficha de la pestaña suele venir **sin** el título
`FICHA TÉCNICA DE PRODUCTO Y PROCESO`; por eso el inicio se detecta por la fila
`NOMBRE … CODIGO` y no por el título.

**0.2** El valor de un campo es la **primera celda no vacía a la derecha** de su
etiqueta, saltando las repeticiones de las celdas combinadas. Si lo que aparece
a la derecha es la etiqueta de otro campo, el campo se da por vacío.

**0.3** La etiqueta de recursos viene partida en dos celdas (`RECURSOS` |
`Humanos`) y con nombres que varían entre facultades (`Tecnológicos` /
`Equipos Tecnológicos`, `Informáticos` / `Sistemas Informáticos`). Se admiten
todas las formas.

---

## 1. Campos obligatorios

### 1.1 Definición del Proceso — 8 campos
Nombre · Responsable · Alcance · Vinculación · Objetivo · Código · Tipo · Versión.

El **Código** de esta sección lleva **un solo grupo numérico**
(`PE.XX_FYY` / `PM.XX_FYY` / `PS.XX_FYY`), sin el desagregado de salidas.
Esto vale también para las facultades de nivel 2: la excepción del punto 4 **no**
alcanza a este campo.

### 1.2 Descripción del Proceso — 5 columnas
Proveedores (B) · Entradas (D) · Procesos (F) · Salidas (H) · Beneficiarios (J).
Una columna sin ningún registro se reporta como campo faltante.

**1.2.1 Producto final obligatorio (v2).** Toda ficha debe declarar **al menos
un** producto final en la columna H ("Salidas").

| Caso | Clasificación |
|---|---|
| Columna H sin ninguna celda con contenido | **Crítico** — la ficha no dice qué produce el proceso |
| Columna H con productos escritos pero **sin código** | **Observación** — es un defecto de codificación (regla 5), no una ficha sin producto |

No se computa como un campo más, para no diluirlo en el porcentaje: se cuenta
aparte en las columnas `SIN PRODUCTO` y en la nota de productos sin codificar
del resumen de las 20 facultades.

**1.2.3 Coherencia fila por fila (v2.1).** Revisar cada columna por separado
deja pasar el defecto más frecuente: la columna *tiene* registros —así que
"está completa"— pero a un proveedor no le corresponde ninguna entrada, o a un
proceso ningún producto final. Cada fila con datos aporta **dos criterios** al
avance:

| Situación | Clasificación |
|---|---|
| Proveedor con la entrada vacía | **Incompleto** |
| Entrada con el proveedor vacío | **Incompleto** |
| Proceso con la salida vacía | **Crítico** (regla 5) |
| Salida sin proceso que la genere | **Observación** |

Una fila enteramente vacía es separación de la tabla, no un hueco.

**Celdas combinadas.** La hoja combina verticalmente el proceso sobre varias
filas de salidas —lo habitual en las facultades de nivel 2, donde `PM.01.04`
agrupa a `PM.01.04.01`, `PM.01.04.02`… con productos `PM.01.04.01.01`—.
`getValues()` entrega el valor solo en la esquina del rango combinado y deja el
resto en blanco, así que esas filas parecían no tener proceso. Antes de revisar,
los rangos combinados se expanden en memoria (`getMergedRanges()`), de modo que
un hueco solo se reporta cuando la celda está **realmente** vacía y sin
combinar. La hoja original no se modifica.

**1.2.2 Código y denominación en celdas de varias líneas.** Las celdas de
proveedores, entradas, salidas y beneficiarios traen **un código por línea**, y
la celda contigua **una denominación por línea**. Cada código se empareja con la
denominación de su misma posición. Cuando los conteos no coinciden, el código se
queda **sin** denominación y no participa de la comprobación de consistencia:
antes se le atribuía el texto entero de la celda, lo que hacía aparecer códigos
distintos como si compartieran nombre y generaba inconsistencias falsas.

### 1.3 Ejecución del Proceso — 8 campos
Recursos Humanos · Recursos Físicos · Equipos Tecnológicos · Sistemas
Informáticos · Registros · Riesgos · Indicadores · Controles.

### 1.4 Formalización del Proceso — 2 bloques × 3 campos
`Elaboración` y `Revisión`, cada uno con Unidad, Cargo y Nombre y Apellido.

**La Firma es opcional**: va como fotografía dentro de la celda, de modo que una
celda vacía no se computa como campo faltante. Se informa en el detalle con el
estado `Opcional`.

---

## 2. Codificación por tipo de campo

| Campo | Estructura | Grupos numéricos |
|---|---|---|
| Proveedores (B) | `PR.XX_FYY` | — |
| Entradas (D) | `EN.XX_FYY` | — |
| Beneficiarios (J) | `BE.XX_FYY` | — |
| Definición › Código | `PE\|PM\|PS.XX_FYY` | 1 |
| Descripción › Procesos (F) | `PE\|PM\|PS.XX.YY_FYY` | 2 |
| Descripción › Salidas (H) | `PE\|PM\|PS.XX.YY.ZZ_FYY` | 3 |
| Ejecución › Registros | `PE\|PM\|PS.XX.YY.ZZ_FYY` | 3 |

**2.1** El correlativo `XX` admite de **uno a tres dígitos**: la FDCP llega a
`PR.150_F02` y `EN.238_F02`.

**2.2** El sufijo debe escribirse `_F##` y coincidir con el formulario oficial de
la facultad (`F02` para la FDCP). Un sufijo de otra facultad es error de
codificación, no de formato.

**2.3** Cuando la facultad no tiene formulario oficial declarado, se usa el
sufijo **dominante** de la pestaña.

---

## 3. Las 7 reglas obligatorias de consignación

| # | Regla | Cómo se verifica |
|---|---|---|
| 2 | Proveedores con `PR.XX_FYY`, mismo código ante repetición | Validación de estructura + **Hoja 4** (registro maestro) |
| 3 | Entradas con `EN.XX_FYY`, mismo código ante repetición | Igual que la 2 |
| 4 | Procesos de nivel 1, correlativos, **uno por celda** | Una celda de la columna F con más de un código es hallazgo |
| 5 | Salidas: solo productos finales, con código y denominación del **Anexo 1** | **Hoja 5** (cotejo) |
| 6 | Beneficiarios con `BE.XX_FYY`, mismo código ante repetición | Igual que la 2 |
| 7 | Registros: solo productos parciales del **Anexo 1** | **Hoja 5**; lo que no figure allí se marca como pendiente de incorporar en ambos anexos |

**3.1 Persistencia del código (reglas 2, 3 y 6).** Se detectan los dos defectos
simétricos: un mismo código usado con denominaciones distintas, y una misma
denominación registrada con códigos distintos.

**3.2.0 Pestaña del Anexo 1.** El Anexo 1 se renombró igual que el Anexo 3:
sus pestañas son también `F##_SIGLA`. La localización prueba primero ese formato
y solo después el antiguo (`2. FDCP`). Ojo con el guion bajo: en una expresión
regular es carácter de palabra, así que `\bFDCP\b` **no** casa dentro de
`F02_FDCP`; hay que normalizarlo a espacio antes de comparar. Cuando la pestaña
no aparece, el motivo enumera las pestañas que sí tiene el Anexo 1.

Las denominaciones se comparan ignorando comillas, guiones y puntuación:
`PLAN ESTRATÉGICO "FDCP"` y `PLAN ESTRATEGICO FDCP` son el mismo producto.

**3.2 Cotejo con el Anexo 1 (reglas 5 y 7).** Se distinguen tres desenlaces:
`Sí`, `Sí (denominación distinta)` — con la denominación del Anexo 1
transcrita — y `No`. Si el Anexo 1 no se puede leer, se reporta
`No verificable` con el motivo; **nunca** se afirma que algo falta sin haberlo
comprobado.

---

## 4. Excepción de las facultades de nivel 2

La FDCP trabaja procesos y productos de **nivel 2**, así que su desagregado llega
a un grupo numérico más (`PM.XX.YY.ZZ.AA_FWW`) y en el encabezado de una ficha
pueden **convivir códigos de 2 y de 3 niveles**. Ocurre en una ficha concreta, no
en todas.

**4.1** Para las facultades listadas en `CONFIG_A3.FACULTADES_NIVEL_2` se admite
**un nivel adicional** en Procesos, Salidas y Registros. No es error, y por eso
**no se anota fila por fila**: es lo normal en esas facultades, y repetir la
misma frase en cada código llenaba el detalle de ruido. Se cuenta y se menciona
**una sola vez** por ficha, en el resumen.

**4.2** La excepción **no** alcanza al campo Código de la Definición (punto 1.1),
que sigue exigiendo un solo grupo numérico.

**4.3** Para el resto de facultades, ese nivel de más sí es error de codificación.

---

## 5. Cómputo del avance

- **Campos aplicables** = los de los puntos 1.1 a 1.4, **excluida la Firma**.
- **% de avance de la ficha** = campos completos / campos aplicables.
- **Ficha completa** = sin campos faltantes **y** sin errores de codificación.
- **% de avance global** = campos completos / campos aplicables de todas las
  fichas (promedio ponderado por número de campos, no media de porcentajes).

Los errores de codificación se cuentan **por código defectuoso**, no por celda:
una celda con dos códigos mal escritos suma dos.

---

## 6. Hojas del archivo de salida

Cuatro hojas, escritas en el libro `4_REVISIÓN_INTERNA DE_AVANCES_ACTIVIDADES`
—el mismo de la auditoría del Anexo 1— con el sufijo `_A3` para que convivan con
las `*_A1` sin pisarse. Cada corrida reescribe solo las cuatro del Anexo 3 y no
toca ninguna hoja ajena. Todas abren con `FACULTAD` (sigla) y `NOMBRE`, y las
filas vienen en el orden F01 → F20.

El cotejo contra el Anexo 1 (reglas 5 y 7) ya no tiene hoja propia: sus
hallazgos se vuelcan al `DETALLE_REVISION_A3`, en la sección `Anexo 1` de la ficha
donde aparece cada código.

En `RESUMEN_20_FACULTADES`, `SIN PRODUCTO` cuenta **fichas** con algún proceso
sin producto final; `OTROS CRÍTICOS` cuenta el **resto** de hallazgos críticos
(código de otra facultad, código duplicado, sección ausente). Se separan para
que ninguna fila se cuente dos veces. La hoja cierra con una fila `TOTAL` cuyo
`% AVANCE` es el promedio **ponderado por campos revisados**, no el promedio de
los porcentajes.

| Hoja | Contenido |
|---|---|
| `DETALLE_REVISION_A3` | Una fila por campo revisado: facultad, ficha, sección, campo, **celda**, información, **estado**, observación |
| `RESUMEN_EJECUTIVO_A3` | Una fila por facultad en orden F01 → F20: sigla, facultad, fichas, fichas esperadas, completas, incompletas, sin producto, otros críticos, críticos (total), observaciones, estado, notas y % avance |
| `RESUMEN_FICHAS_A3` | Una fila por ficha: código, % avance, productos finales, campos/celdas faltantes, errores de codificación, **estado**, observaciones y correcciones |
| `REGISTRO_MAESTRO_CODIGOS_A3` | Proveedores, entradas y beneficiarios: facultad, tipo, código, denominación, fichas donde aparece, **estado**, observación |

**6.1 Ubicación de cada hallazgo.** `DETALLE_REVISION_A3` indica dónde está el
dato con una sola columna, `CELDA`, en notación A1 apuntando al **valor**, no a
la etiqueta (`B4`). Cuando el hallazgo no cuelga de una celda concreta —una
columna entera sin registros, una sección que no aparece— se muestra en esa
misma columna el rango de filas que traía el hallazgo, como `Fila 10–11`, para
no perder la ubicación por quedarse con una sola columna.

**6.2 Clasificación de los hallazgos (v3).** `DETALLE_REVISION_A3` y
`REGISTRO_MAESTRO_CODIGOS_A3` traen su propia columna `ESTADO`, con cuatro
valores posibles, y cada fila se pinta además con el color de su estado, para
que la hoja se lea igual impresa en blanco y negro o por quien no distinga los
colores.

| Color | Estado | Cuándo |
|---|---|---|
| Verde | `CONFORME` | Campo completo y codificación correcta (incluida la firma de Formalización, que es opcional) |
| Ámbar | `SIN REGISTRAR` | Campo obligatorio vacío, o dato por verificar contra el Anexo 1 |
| Naranja | `OBSERVADO` | Hay algo escrito pero mal: codificación fuera de estructura, denominación inconsistente, salida duplicada, salida ausente del Anexo 1 |
| Rojo | `CRÍTICO` | Compromete la ficha: sin producto final, código con el formulario de otra facultad, código de ficha duplicado, sección ausente |

Cuando una fila reúne más de una condición manda la más grave. La ficha hereda
el peor estado de sus filas, ignorando la firma (opcional).

Estas dos hojas ya no llevan la columna `CLASIFICACIÓN (color)` que otras hojas
del reporte sí tienen: `ESTADO` hace ese papel, y agregar la otra columna habría
repetido la misma clasificación dos veces.

**6.3 Criterios revisados.** Completitud de la ficha · consistencia de códigos y
denominaciones · códigos duplicados · códigos pertenecientes a otra facultad ·
formalización incompleta · entradas y salidas · productos finales.

**La fuente del Anexo 3 no se comprueba.** La regla 1 de las directrices
(«toda la información en Arial») queda **fuera de alcance** por indicación de la
OGPL: el script no lee las fuentes de la hoja ni reporta nada sobre ellas. La
fuente del archivo de salida (`CONFIG_A3.FUENTE_REPORTE`) es formato del
reporte, no un criterio de revisión.

**6.3.1 Avance general de los dos anexos — script aparte.** El combinado de
`RESUMEN_EJECUTIVO_A1` y `RESUMEN_EJECUTIVO_A3` (50/50) **ya no lo genera este
script**. Vivía aquí hasta que recalcularlo en cada corrida del Anexo 3 —sin
depender de su propia lógica de revisión— empezó a saturarla.

Pasó a `apps-script/ResumenGeneral.gs`, que **solo lee** las dos hojas de
resumen ya escritas por sus auditores (no vuelve a auditar nada) y escribe
`RESUMEN_GENERAL` con el mismo cálculo:

```
% GENERAL = % Anexo 1 × 0,5  +  % Anexo 3 × 0,5
```

- Se dispara con el ítem de menú **Auditoría OGPL › Actualizar resumen
  general**, cada vez que cambie el Anexo 1 o el Anexo 3 — no en automático.
- Los pesos son una **decisión institucional**, no un dato: cada anexo vale lo
  mismo aunque el Anexo 1 evalúe muchas más celdas. Se configuran en
  `CONFIG_GENERAL.PESOS`.
- Las columnas de ambas hojas de origen se buscan **por el nombre del
  encabezado**, no por posición, para que insertar una columna no rompa el
  cruce. `RESUMEN_EJECUTIVO_A3` trae además la columna `CRÍTICOS (TOTAL)`
  —el conteo real de hallazgos críticos por facultad, no solo `OTROS
  CRÍTICOS`— para que el script del resumen general pueda igualar el criterio
  que usaba antes sin tener que adivinarlo desde el texto del estado.
- Si falta el avance de uno de los dos anexos, **no se promedia con cero**: se
  informa el que hay y la nota dice cuál falta. Un cero real sí se promedia.
- La fila `TOTAL` es el promedio **simple** de las facultades que tienen los dos
  anexos: coherente con el 50/50, donde el peso lo fija la decisión y no el
  tamaño de cada hoja.
- Todos los nombres internos de `ResumenGeneral.gs` llevan el sufijo `RG_`,
  para no repetir un nombre que ya use otro archivo del proyecto (Apps Script
  comparte un único ámbito global entre todos los archivos de un mismo
  proyecto).

**6.4 Semáforo de avance por facultad.** En `RESUMEN_20_FACULTADES` la columna
`% AVANCE` lleva formato condicional:

| Tramo | Color | Estado |
|---|---|---|
| 95–100 % | Verde | Satisfactorio |
| 80–94 % | Ámbar | Aceptable |
| 60–79 % | Naranja | En proceso |
| 0–59 % | Rojo | Crítico |

**Un hallazgo crítico impide considerar satisfactoria a la facultad** por alto
que sea el porcentaje: baja como mínimo a *En proceso* y el rótulo dice cuántos
críticos tiene. Un tramo ya bajo no mejora por eso.

---

## 7. Corrida sobre las 20 facultades

`ejecutarRevisionAnexo3` recorre **todas** las pestañas de facultad detectadas y
deja **un solo archivo** con las siete hojas. Lo único que hay que declarar por
facultad es si trabaja a nivel 2 (`CONFIG_A3.FACULTADES_NIVEL_2`).

**7.1 Solo lectura.** El script no escribe nada sobre el Anexo 3: cada pestaña
se lee de dos tirones —`getValues()` para el contenido y `getFontFamilies()`
para la regla 1— y todo lo demás ocurre en memoria. Los hallazgos se registran
únicamente en el archivo de salida.
