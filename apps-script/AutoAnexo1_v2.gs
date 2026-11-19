/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  AUTOMATIZACIÓN DEL ANEXO 1 — CODIFICACIÓN DE PRODUCTOS
 *  Oficina de Racionalización — OGPL (UNMSM)
 *
 *  VERSIÓN 2 — productos con sufijo -P##
 *  ─────────────────────────────────────────────────────────────────────────────
 *   El producto deja de llevar un tramo numérico más que su proceso (que lo
 *   hacía parecer un nivel 3 o 4) y pasa a llevar el código de su padre
 *   seguido de -P##:
 *
 *     PE.01_F18               proceso (nivel 0)
 *     PE.01.01_F18            subproceso (nivel 1)
 *     PE.01.01_F18-P01        producto 1 de ese subproceso
 *     PE.01.01_F18-P02        producto 2
 *     PE.01.01.01_F18         nivel 2, si existe
 *     PE.01.01.01_F18-P01     su producto 1
 *
 *   El contador vuelve a P01 con cada padre nuevo. El padre es el último
 *   proceso visto, del nivel que sea.
 *
 *  Cómo distingue un producto de un proceso
 *  ─────────────────────────────────────────────────────────────────────────────
 *   Mandan los DATOS; el COLOR de la columna B solo decide cuando no los hay.
 *
 *     · Datos de producto = "Final" o "Parcial" en la columna C, o cualquier
 *       valor en las columnas D a I. (La columna C sola no basta: los
 *       encabezados de proceso traen ahí la nota de la plantilla "(No combinar
 *       las celdas…)".)
 *
 *     con datos, celda blanca o resaltada        → producto
 *     con datos, color de PROCESO de la plantilla → CONFLICTO: no se toca
 *     sin datos, con código y con color          → proceso / subproceso
 *     sin datos, con código y blanca             → producto aún sin llenar
 *     sin datos y sin código                     → nota: no se toca
 *
 *   El color no sirve para reconocer productos: en el Anexo 1 hay cientos de
 *   productos resaltados en amarillo, verde, rojo o celeste durante la
 *   revisión. Solo los colores de COLORES_DE_PROCESO marcan un encabezado.
 *
 *  Este archivo va en el Apps Script del propio ANEXO 1 (Extensiones › Apps
 *  Script desde ese libro), no en el de 4_REVISIÓN_INTERNA: trabaja sobre la
 *  pestaña activa del libro en que está.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const CONFIG_AUTO_A1 = {
  FILA_INICIO: 5,
  COL_B: 2,
  COLUMNAS: 8,                       // B..I
  DIGITOS_PRODUCTO: 2,               // P01 … P99
  CATALOGACIONES: ['PROCESOS MISIONALES', 'PROCESOS MISIONAL', 'PROCESOS DE SOPORTE',
                   'PROCESOS ESTRATÉGICOS', 'PROCESOS ESTRATEGICOS'],
  FONDOS_BLANCOS: ['#ffffff', '#fff', 'white', ''],
  /**
   * Fondos que la plantilla usa en los encabezados de proceso: azul de nivel 0,
   * celeste de nivel 1, gris de nivel 2 y las variantes de FCB y FIEE. Medido
   * sobre el Anexo 1: estas celdas son casi siempre encabezados sin datos.
   * Un producto con datos y uno de estos fondos se reporta como conflicto.
   */
  COLORES_DE_PROCESO: ['#3d85c6', '#c9daf8', '#efefef', '#f3f3f3',
                       '#2e75b6', '#bdd7ee', '#e2ecff']
};

/** Código de proceso al inicio de la celda: PE|PM|PS + tramos. */
const REGEX_PROCESO_AUTO = /^\s*((?:PE|PM|PS)(?:\.\d{1,3})+)/i;

/** Código de proceso con su sufijo, si lo trae: "PE.01_F02", "PE.01-F02", "PE.01.F02". */
const REGEX_PROCESO_CON_SUFIJO_AUTO = /^\s*((?:PE|PM|PS)(?:\.\d{1,3})+)(?:\s*[_\-.]\s*F?\d{1,2}(?!\d))?/i;

/**
 * Código viejo o nuevo al inicio de una celda de producto, para borrarlo antes
 * de escribir el nuevo: "PE.01.01.03_F18 ", "PE.01.01_F18-P03 ", "PE.01.01.03 ".
 */
const REGEX_CODIGO_PRODUCTO_AUTO =
  /^\s*(?:PE|PM|PS)(?:\.\d{1,3})+(?:\s*[_\-.]\s*F?\d{1,2})?(?:\s*-\s*P\d{1,3})?\s*[-–:.]?\s*/i;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙️ Automatización Anexo 1')
    .addItem('Generar códigos de productos (hoja actual)', 'generarCodigosHojaActual')
    .addItem('Convertir columna B a mayúsculas', 'convertirMayusculasColumnaB')
    .addToUi();
}

/**
 * Sufijo de formulario a partir del nombre de la pestaña. Solo se acepta el
 * formato oficial F##_SIGLA: con "Copia de 11. FCC" el primer número no es
 * fiable y no se renumera nada.
 */
function sufijoDePestanaAuto_(nombre) {
  const m = (nombre || '').toString().trim().match(/^F(\d{2})_/i);
  return m ? '_F' + m[1] : null;
}

function esCatalogacionAuto_(texto) {
  const t = texto.toUpperCase().replace(/\s+/g, ' ').trim();
  return CONFIG_AUTO_A1.CATALOGACIONES.some(function (c) { return t.indexOf(c) === 0; });
}

/** "Final"/"Parcial" en C, o cualquier valor en D..I. */
function tieneDatosDeProductoAuto_(fila) {
  const c = (fila[1] || '').toString().toUpperCase();
  if (c.indexOf('FINAL') !== -1 || c.indexOf('PARCIAL') !== -1) return true;
  for (let k = 2; k < fila.length; k++) {
    if ((fila[k] || '').toString().trim() !== '') return true;
  }
  return false;
}

function esFondoBlancoAuto_(color) {
  return CONFIG_AUTO_A1.FONDOS_BLANCOS.indexOf((color || '').toString().toLowerCase()) !== -1;
}

function codigoDeProductoAuto_(padre, sufijo, n) {
  let num = String(n);
  while (num.length < CONFIG_AUTO_A1.DIGITOS_PRODUCTO) num = '0' + num;
  return padre + sufijo + '-P' + num;
}

/**
 * Lógica pura, sin tocar la hoja: recibe los valores de B..I y los fondos de
 * B, y devuelve la nueva columna B y el informe.
 */
function calcularCodigosAuto_(filas, fondos, sufijo, filaInicio) {
  const nuevaB = filas.map(function (f) { return [f[0]]; });
  const informe = { procesos: 0, productos: 0, cambiadas: 0, conflictos: [], sinPadre: [],
                    procesosSinCodigo: [], notas: [], padreDistinto: [] };

  let padre = null;
  let contador = 0;

  for (let i = 0; i < filas.length; i++) {
    const original = (filas[i][0] || '').toString();
    const texto = original.trim();
    const filaHoja = filaInicio + i;
    if (!texto || esCatalogacionAuto_(texto)) continue;

    const conDatos = tieneDatosDeProductoAuto_(filas[i]);
    const fondo = (fondos[i][0] || '').toString().toLowerCase();
    const conColor = !esFondoBlancoAuto_(fondo);
    const m = texto.match(REGEX_PROCESO_AUTO);

    if (conDatos && CONFIG_AUTO_A1.COLORES_DE_PROCESO.indexOf(fondo) !== -1) {
      informe.conflictos.push(filaHoja);
      continue;
    }

    if (!conDatos && !m) {
      // Sin datos y sin código: nota suelta o encabezado sin codificar.
      (conColor ? informe.procesosSinCodigo : informe.notas).push(filaHoja);
      continue;
    }

    if (!conDatos && conColor) {
      padre = m[1].toUpperCase();
      contador = 0;
      informe.procesos++;
      // Solo se corrige el sufijo del proceso; su código y su texto se respetan.
      const nuevo = texto.replace(REGEX_PROCESO_CON_SUFIJO_AUTO, '$1' + sufijo);
      if (nuevo !== original) { nuevaB[i][0] = nuevo; informe.cambiadas++; }
      continue;
    }

    // Producto
    if (!padre) { informe.sinPadre.push(filaHoja); continue; }
    contador++;
    // Si traía un código que no cuelga del proceso que tiene encima, puede que
    // falte un encabezado o que un producto esté pintado como proceso: se
    // numera por posición, pero se avisa para revisarlo.
    if (m) {
      const viejo = m[1].toUpperCase();
      if (viejo !== padre && viejo.indexOf(padre + '.') !== 0) {
        informe.padreDistinto.push(filaHoja + ' (' + viejo + ' → ' + padre + ')');
      }
    }
    const denominacion = texto.replace(REGEX_CODIGO_PRODUCTO_AUTO, '').trim().toUpperCase();
    const nuevo = codigoDeProductoAuto_(padre, sufijo, contador) + ' ' + denominacion;
    informe.productos++;
    if (nuevo !== original) { nuevaB[i][0] = nuevo; informe.cambiadas++; }
  }
  return { columnaB: nuevaB, informe: informe };
}

function generarCodigosHojaActual() {
  const ui = SpreadsheetApp.getUi();
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const nombre = hoja.getName();
  const sufijo = sufijoDePestanaAuto_(nombre);

  if (!sufijo) {
    ui.alert('La pestaña "' + nombre + '" no tiene el formato F##_SIGLA (por ejemplo F18_FPSIC).\n' +
             'No se renumeró nada, para no aplicar un sufijo equivocado.');
    return;
  }

  const ultima = hoja.getLastRow();
  if (ultima < CONFIG_AUTO_A1.FILA_INICIO) {
    ui.alert('No hay datos para procesar en esta hoja.');
    return;
  }
  const n = ultima - CONFIG_AUTO_A1.FILA_INICIO + 1;

  const respuesta = ui.alert(
    'Renumerar productos de ' + nombre,
    'Se reescribirán los códigos de la columna B con el formato PADRE' + sufijo + '-P01, -P02…\n' +
    'Si algo sale mal, se recupera con Ctrl+Z o Archivo › Historial de versiones.\n\n¿Continuar?',
    ui.ButtonSet.YES_NO);
  if (respuesta !== ui.Button.YES) return;

  const datos = hoja.getRange(CONFIG_AUTO_A1.FILA_INICIO, CONFIG_AUTO_A1.COL_B, n, CONFIG_AUTO_A1.COLUMNAS)
                    .getValues();
  const rangoB = hoja.getRange(CONFIG_AUTO_A1.FILA_INICIO, CONFIG_AUTO_A1.COL_B, n, 1);
  const r = calcularCodigosAuto_(datos, rangoB.getBackgrounds(), sufijo, CONFIG_AUTO_A1.FILA_INICIO);

  rangoB.setValues(r.columnaB);

  const inf = r.informe;
  let msg = '✅ ' + nombre + ' — sufijo ' + sufijo + '\n\n' +
            inf.procesos + ' procesos / subprocesos\n' +
            inf.productos + ' productos numerados\n' +
            inf.cambiadas + ' celdas modificadas';
  if (inf.conflictos.length) {
    msg += '\n\n⚠️ Sin tocar — la celda tiene el color de un encabezado de proceso pero datos de producto ' +
           '(revísalas y corrige el color o los datos): filas ' + inf.conflictos.join(', ');
  }
  if (inf.sinPadre.length) {
    msg += '\n\n⚠️ Productos sin proceso antes de ellos (no se numeraron): filas ' +
           inf.sinPadre.join(', ');
  }
  if (inf.procesosSinCodigo.length) {
    msg += '\n\n⚠️ Filas con color de proceso pero sin código PE/PM/PS: filas ' +
           inf.procesosSinCodigo.join(', ');
  }
  if (inf.padreDistinto.length) {
    msg += '\n\n⚠️ Revisar — el código anterior no colgaba del proceso que tiene encima ' +
           '(¿falta un encabezado o hay un producto pintado como proceso?): filas ' +
           inf.padreDistinto.join('; ');
  }
  if (inf.notas.length) {
    msg += '\n\nℹ️ Filas sin código ni datos, tratadas como notas (no se tocaron): filas ' +
           inf.notas.join(', ');
  }
  ui.alert(msg);
}

/** Pasa a MAYÚSCULAS el texto de la columna B desde la fila 5. */
function convertirMayusculasColumnaB() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const ultima = hoja.getLastRow();
  if (ultima < CONFIG_AUTO_A1.FILA_INICIO) {
    SpreadsheetApp.getUi().alert('No hay datos para procesar en esta hoja.');
    return;
  }
  const rango = hoja.getRange(CONFIG_AUTO_A1.FILA_INICIO, CONFIG_AUTO_A1.COL_B,
                              ultima - CONFIG_AUTO_A1.FILA_INICIO + 1, 1);
  const valores = rango.getValues().map(function (f) {
    return [f[0] === '' ? '' : f[0].toString().toUpperCase()];
  });
  rango.setValues(valores);
  SpreadsheetApp.getUi().alert('✅ La columna B quedó en mayúsculas.');
}
