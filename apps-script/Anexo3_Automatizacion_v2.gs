/**
 * =========================================================================
 * HERRAMIENTAS DEL ANEXO 3 — VERSIÓN 2
 * -------------------------------------------------------------------------
 * Va en el Apps Script del propio libro del Anexo 3.
 *
 * v2:
 *  · Nivel 2. Si un subproceso tiene procesos de nivel 2 en el Anexo 1, la
 *    ficha lleva el nivel 1 en F (código y denominación), cada nivel 2 en G
 *    (código y denominación) y, en H e I, los productos finales DE ESE
 *    nivel 2. Si no lo tiene, queda como siempre: código en F, denominación
 *    en G y sus productos en H e I. El nivel 2 se detecta en los datos del
 *    Anexo 1, subproceso por subproceso: un código de tres tramos es nivel 2
 *    si tiene productos debajo.
 *  · Productos con el formato nuevo PADRE_F##-P## además del anterior
 *    (un tramo numérico más), para seguir funcionando cuando el Anexo 1 se
 *    renumere con AutoAnexo1.
 *  · Al importar subprocesos se ignoran los productos (tipo Final o
 *    Parcial en la columna C del Anexo 1).
 * =========================================================================
 */

/**
 * =========================================================================
 * 0. MENÚ PERSONALIZADO
 * =========================================================================
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ Herramientas Anexo 3')
    .addItem('Importar Subprocesos (Columna F y G)', 'importarSubprocesos')
    .addItem('Actualizar Productos Finales (Columna H e I)', 'actualizarProductosFinales')
    .addItem('Actualizar Productos Parciales (Columna G y H)', 'actualizarProductosParciales')
    .addSeparator()
    .addItem('Formatear Ficha (Mayúsculas y Saltos)', 'formatearFichaCompleta')
    .addItem('Aplicar Fuente Calibri (Toda la Hoja)', 'aplicarFuenteCalibri')
    .addSeparator()
    .addItem('Corregir y Separar Códigos (PR y EN)', 'corregirCodigosActuales')
    .addItem('Corregir y Separar Beneficiarios (J y K)', 'corregirBeneficiariosMasivo')
    .addToUi();
}  

/**
 * Función auxiliar para validar que estamos en una hoja de facultad 
 * (Acepta tanto "1. FM" como el nuevo formato "F01_FM")
 */
function esHojaValida(nombreHoja) {
  return /^(\d+\.\s+[A-Z]+|F\d{2}_[A-Z]+)$/i.test(nombreHoja.trim());
}

/**
 * Función traductora: Convierte "1. FM" a "F01_FM" para buscar en el Anexo 1
 */
function getAnexo1SheetName(localName) {
  localName = localName.trim();
  // Si ya tiene el formato F01_FM, lo devolvemos tal cual
  if (/^F\d{2}_[A-Z]+$/i.test(localName)) {
    return localName.toUpperCase();
  }
  // Si tiene el formato "1. FM", lo transformamos
  var match = localName.match(/^(\d+)\.\s+([A-Z]+)$/i);
  if (match) {
    var num = parseInt(match[1], 10);
    var letras = match[2].toUpperCase();
    var numStr = num < 10 ? "0" + num : num.toString();
    return "F" + numStr + "_" + letras;
  }
  return localName; // fallback
}

/**
 * Función auxiliar para saber si la fila editada pertenece al bloque de procesos
 * (Entre "PROVEEDORES" y "EJECUCIÓN DEL PROCESO")
 */
function isRowInProcessBlock(sheet, row) {
  if (row < 12) return false;
  var valuesB = sheet.getRange(1, 2, row, 1).getValues();
  // Buscamos hacia arriba desde la fila actual
  for (var i = row - 1; i >= 0; i--) {
    var text = valuesB[i][0].toString().trim().toUpperCase();
    if (text === "EJECUCIÓN DEL PROCESO" || text === "RECURSOS" || text === "FORMALIZACIÓN DEL PROCESO") {
      return false; // Estamos fuera del bloque de procesos (en la parte inferior)
    }
    if (text === "PROVEEDORES") {
      return true; // Encontramos el inicio del bloque válido
    }
  }
  return false;
}

/**
 * =========================================================================
 * 0.4 APLICAR FUENTE CALIBRI EN TODA LA HOJA
 * =========================================================================
 */
function aplicarFuenteCalibri() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (!esHojaValida(sheet.getName())) {
    SpreadsheetApp.getUi().alert("⚠️ Esta función solo se puede ejecutar en hojas de facultades.");
    return;
  }
  
  sheet.getDataRange().setFontFamily("Calibri");
  SpreadsheetApp.getUi().alert("✅ Se aplicó la tipografía Calibri a toda la hoja (" + sheet.getName() + ").");
}

/**
 * =========================================================================
 * 0.5 FORMATEAR FICHA (MAYÚSCULAS, SALTOS DE LÍNEA Y FUENTE CALIBRI)
 * =========================================================================
 */
function formatearFichaCompleta() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (!esHojaValida(sheet.getName())) {
    SpreadsheetApp.getUi().alert("⚠️ Esta función solo se puede ejecutar en hojas de facultades.");
    return;
  }
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  var formulas = range.getFormulas();
  var modified = false;
  
  range.setWrap(true);
  range.setFontFamily("Calibri");
  

  var regexCodigos = /[ \t]+(?=(?:PR|EN|BE|PE|PM|PS|PO)\.\d{2}(?:\.\d{2})*(?:_[A-Z0-9]+)?\b)/g;
  
  for (var i = 0; i < values.length; i++) {
    for (var j = 0; j < values[i].length; j++) {
      if (formulas[i][j] === "") {
        var val = values[i][j];
        if (typeof val === "string" && val !== "") {
          var newVal = val.toUpperCase();
          newVal = newVal.replace(regexCodigos, "\n\n");
  
          if (newVal !== val) {
            values[i][j] = newVal;
            modified = true;
          }
        }
      } else {
        values[i][j] = formulas[i][j];
      }
    }
  }
  
  if (modified) {
    range.setValues(values);
    SpreadsheetApp.getUi().alert("✅ Toda la ficha (" + sheet.getName() + ") se ha convertido a MAYÚSCULAS, fuente CALIBRI y se han aplicado los saltos de línea.");
  } else {
    SpreadsheetApp.getUi().alert("✅ Se aplicó la tipografía Calibri y se aseguró el ajuste de texto en la ficha (" + sheet.getName() + ").");
  }
}

/**
 * =========================================================================
 * 0.9 LÓGICA PURA (v2) — sin tocar hojas, cubierta por las pruebas
 * =========================================================================
 */

/** Código PE|PM|PS al inicio de un texto, sin sufijo: "PM.01.01_F02 X" → "PM.01.01". */
function codigoBaseA3Auto_(texto) {
  var m = (texto || "").toString().trim().toUpperCase().match(/^((?:PE|PM|PS)(?:\.\d{2,3})+)/);
  return m ? m[1] : "";
}

/** Separa "CÓDIGO DENOMINACIÓN" en sus dos partes (el código, con sufijo y -P##). */
function separarCodigoA3Auto_(texto) {
  var t = (texto || "").toString().trim().toUpperCase().replace(/\s+/g, " ");
  var m = t.match(/^((?:PE|PM|PS)(?:\.\d{2,3})+(?:_F\d{2})?(?:\s?-\s?P\d{1,3})?)\s*[-–:]?\s*(.*)$/);
  if (!m) return { code: t, name: "" };
  return { code: m[1].replace(/\s/g, ""), name: m[2].trim() };
}

/**
 * ¿`producto` es un producto de `codigoProceso`? En el formato anterior lleva
 * un tramo más ("PM.01.01.03_F02"); en el nuevo, el código del padre y -P##
 * ("PM.01.01_F02-P03").
 */
function esProductoDeA3Auto_(producto, codigoProceso) {
  var p = (producto || "").toString().trim().toUpperCase();
  var esc = codigoProceso.replace(/\./g, "\\.");
  return new RegExp("^" + esc + "\\.\\d{2}(?:_| |$)").test(p) ||
         new RegExp("^" + esc + "(?:_F\\d{2})?\\s?-\\s?P\\d{1,3}(?:\\s|$)").test(p);
}

/** Filas del Anexo 1 (columnas B y C) que son productos de `codigoProceso` del tipo dado. */
function productosDeProcesoA3Auto_(codigoProceso, datosAnexo1, tipo) {
  var res = [];
  for (var i = 0; i < datosAnexo1.length; i++) {
    var b = datosAnexo1[i][0] ? datosAnexo1[i][0].toString().trim() : "";
    var c = datosAnexo1[i][1] ? datosAnexo1[i][1].toString().toUpperCase() : "";
    if (!b || c.indexOf(tipo) === -1) continue;
    if (esProductoDeA3Auto_(b, codigoProceso)) res.push(separarCodigoA3Auto_(b));
  }
  return res;
}

/**
 * Una fila del Anexo 1 es producto si su tipo (columna C) dice Final o
 * Parcial, o si su código lleva -P## (aunque todavía no tenga el tipo llenado).
 */
function esFilaDeProductoA3Auto_(fila) {
  var c = fila[1] ? fila[1].toString().toUpperCase() : "";
  if (c.indexOf("FINAL") !== -1 || c.indexOf("PARCIAL") !== -1) return true;
  var b = fila[0] ? fila[0].toString().toUpperCase() : "";
  return /^\s*(?:PE|PM|PS)(?:\.\d{2,3})+(?:_F\d{2})?\s?-\s?P\d{1,3}(?:\s|$)/.test(b);
}

/**
 * Estructura de subprocesos de un proceso de nivel 0 según el Anexo 1:
 * una entrada por bloque de la ficha.
 *   Nivel 1:  { f: "PM.02.01_F02", g: "FOMENTO…", proceso: "PM.02.01", nivel1: "PM.02.01" }
 *   Nivel 2:  { f: "PM.01.01_F02 GESTIÓN…", g: "PM.01.01.01_F02 DISEÑO…",
 *               proceso: "PM.01.01.01", nivel1: "PM.01.01" }
 * `proceso` es aquel cuyos productos van en H e I.
 */
function estructuraSubprocesosA3Auto_(codigoNivel0, datosAnexo1) {
  var esc = codigoNivel0.replace(/\./g, "\\.");
  var reN1 = new RegExp("^" + esc + "\\.\\d{2}(?:_| |$)");
  var codigos = [];
  for (var i = 0; i < datosAnexo1.length; i++) {
    var t = datosAnexo1[i][0] ? datosAnexo1[i][0].toString().trim().toUpperCase() : "";
    if (t) codigos.push(t);
  }
  var tieneProductos = function (base) {
    for (var k = 0; k < codigos.length; k++) {
      if (esProductoDeA3Auto_(codigos[k], base)) return true;
    }
    return false;
  };

  var salida = [];
  for (var i = 0; i < datosAnexo1.length; i++) {
    var fila = datosAnexo1[i];
    var texto = fila[0] ? fila[0].toString().trim() : "";
    var linea = texto.toUpperCase().replace(/\s+/g, " ");
    if (!reN1.test(linea) || esFilaDeProductoA3Auto_(fila)) continue;
    var n1 = separarCodigoA3Auto_(linea);
    var base1 = codigoBaseA3Auto_(n1.code);

    // Hijos de 3 tramos que no son productos y que a su vez tienen productos: nivel 2.
    var reN2 = new RegExp("^" + base1.replace(/\./g, "\\.") + "\\.\\d{2}(?:_| |$)");
    var niveles2 = [];
    for (var j = 0; j < datosAnexo1.length; j++) {
      var t2 = datosAnexo1[j][0] ? datosAnexo1[j][0].toString().trim().toUpperCase().replace(/\s+/g, " ") : "";
      if (!reN2.test(t2) || esFilaDeProductoA3Auto_(datosAnexo1[j])) continue;
      var base2 = codigoBaseA3Auto_(t2);
      if (tieneProductos(base2)) niveles2.push(separarCodigoA3Auto_(t2));
    }

    if (!niveles2.length) {
      salida.push({ f: n1.code, g: n1.name, proceso: base1, nivel1: base1 });
    } else {
      for (var k = 0; k < niveles2.length; k++) {
        salida.push({ f: (n1.code + " " + n1.name).trim(),
                      g: (niveles2[k].code + " " + niveles2[k].name).trim(),
                      proceso: codigoBaseA3Auto_(niveles2[k].code), nivel1: base1 });
      }
    }
  }
  return salida;
}

/**
 * Proceso cuyos productos van en H e I para una fila de la ficha: el nivel 2
 * de la columna G si lo hay, y si no el subproceso de la columna F.
 */
function procesoDeFilaA3Auto_(valorF, valorG) {
  var g = codigoBaseA3Auto_(valorG);
  if (g && g.split(".").length >= 4) return { codigo: g, columna: 7 };   // PM.01.01.01
  var f = codigoBaseA3Auto_(valorF);
  if (f && f.split(".").length === 3) return { codigo: f, columna: 6 };  // PM.01.01
  return null;
}

/**
 * =========================================================================
 * 1. IMPORTAR SUBPROCESOS (F y G)
 * =========================================================================
 */
function importarSubprocesos() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var sheetName = sheet.getName();
    
  if (!esHojaValida(sheetName)) {
    SpreadsheetApp.getUi().alert("⚠️ Esta función solo se puede ejecutar en hojas de facultades.");
    return;
  }
  
  var activeCell = sheet.getActiveCell();
  var initialRow = activeCell.getRow();
  var jVal = getBlockCode(sheet, initialRow);
  var codigoBase = jVal.substring(0, 5);
  
  if (!codigoBase) {
    SpreadsheetApp.getUi().alert("No se pudo detectar el código base del bloque actual.");
    return;
  }
  
  var externalId = ANEXO1_ID;
  var extSheet;
  var anexo1Name = getAnexo1SheetName(sheetName);
  
  try {
    extSheet = SpreadsheetApp.openById(externalId).getSheetByName(anexo1Name);
    if (!extSheet) throw new Error("Hoja no encontrada");
  } catch (e) {
    SpreadsheetApp.getUi().alert("⚠️ Error: No se pudo encontrar la hoja '" + anexo1Name + "' en el Anexo 1.");
    return;
  }
  
  var lastRowExt = extSheet.getLastRow();
  if (lastRowExt < 1) return;
  var datos = extSheet.getRange(1, 2, lastRowExt, 2).getValues();   // B y C
  var entradas = estructuraSubprocesosA3Auto_(codigoBase, datos);

  if (!entradas.length) {
    SpreadsheetApp.getUi().alert("ℹ️ No se encontraron subprocesos para: " + codigoBase);
    return;
  }

  // Un bloque por entrada. Se miden por la columna G: en nivel 2 la F abarca
  // varios bloques de G; en nivel 1 las dos se combinan igual.
  var blocks = [];
  var currRow = initialRow;
  for (var k = 0; k < entradas.length; k++) {
    var gCell = sheet.getRange(currRow, 7);
    var gMerged = gCell.isPartOfMerge() ? gCell.getMergedRanges()[0] : null;
    var sRow = gMerged ? gMerged.getRow() : currRow;
    var nRows = gMerged ? gMerged.getNumRows() : 1;
    blocks.push({ startRow: sRow, numRows: nRows });
    currRow = sRow + nRows;
  }
  var primera = blocks[0].startRow;
  var ultima = blocks[blocks.length - 1].startRow + blocks[blocks.length - 1].numRows - 1;
  descombinarSeguro(sheet, primera, 6, ultima - primera + 1, 2);

  for (var k = 0; k < blocks.length; k++) {
    sheet.getRange(blocks[k].startRow, 6).setValue(entradas[k].f);
    sheet.getRange(blocks[k].startRow, 7).setValue(entradas[k].g);
    if (blocks[k].numRows > 1) {
      sheet.getRange(blocks[k].startRow, 7, blocks[k].numRows, 1).merge();
    }
  }
  // F se combina sobre todos los bloques consecutivos del mismo nivel 1.
  var desde = 0;
  for (var k = 1; k <= blocks.length; k++) {
    if (k < blocks.length && entradas[k].nivel1 === entradas[desde].nivel1) {
      sheet.getRange(blocks[k].startRow, 6).setValue("");
      continue;
    }
    var ini = blocks[desde].startRow;
    var fin = blocks[k - 1].startRow + blocks[k - 1].numRows - 1;
    if (fin > ini) sheet.getRange(ini, 6, fin - ini + 1, 1).merge();
    desde = k;
  }

  var conNivel2 = entradas.filter(function (e) { return e.proceso !== e.nivel1; }).length;
  SpreadsheetApp.getUi().alert("✅ Se importaron " + entradas.length + " bloques en F y G" +
    (conNivel2 ? " (" + conNivel2 + " de nivel 2)." : "."));
}

/**
 * =========================================================================
 * 2. ACTUALIZAR PRODUCTOS FINALES (H e I)
 * =========================================================================
 */
function obtenerProductosFinalesSeparados(codigoProceso, datosAnexo1) {
  return productosDeProcesoA3Auto_(codigoProceso, datosAnexo1, "FINAL");
}

function actualizarProductosFinales() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (!esHojaValida(sheet.getName())) {
    SpreadsheetApp.getUi().alert("⚠️ Esta función solo se puede ejecutar en hojas de facultades.");
    return;
  }
  var actualizados = actualizarProductosFinalesCore_(sheet);
  SpreadsheetApp.getUi().alert("✅ Se actualizaron " + actualizados + " subprocesos con sus Productos Finales en H e I.");
}

function actualizarProductosFinalesCore_(sheet) {
  var extSheet;
  var anexo1Name = getAnexo1SheetName(sheet.getName());
  
  try {
    extSheet = SpreadsheetApp.openById(ANEXO1_ID).getSheetByName(anexo1Name);
    if (!extSheet) return 0;
  } catch (e) {
    return 0;
  }
  
  var lastRowExt = extSheet.getLastRow();
  if (lastRowExt < 1) return 0;
  var datosAnexo1 = extSheet.getRange(1, 2, lastRowExt, 2).getValues();
  
  var lastRowDest = sheet.getLastRow();
  var valoresFG = sheet.getRange(1, 6, lastRowDest, 2).getValues();
  var actualizados = 0;
  var hechos = {};

  for (var i = 0; i < valoresFG.length; i++) {
    var p = procesoDeFilaA3Auto_(valoresFG[i][0], valoresFG[i][1]);
    if (!p) continue;
    // En nivel 2, una F combinada también tiene un nivel 2 en G en su primera
    // fila: manda el de G.
    if (p.columna === 6 && procesoDeFilaA3Auto_("", valoresFG[i][1])) continue;

    var row = i + 1;
    var cell = sheet.getRange(row, p.columna);
    var merged = cell.isPartOfMerge() ? cell.getMergedRanges()[0] : null;
    var mergeStartRow = merged ? merged.getRow() : row;
    var mergeNumRows = merged ? merged.getNumRows() : 1;
    if (hechos[mergeStartRow]) continue;

    var salidas = productosDeProcesoA3Auto_(p.codigo, datosAnexo1, "FINAL");
    if (salidas.length === 0) continue;
    hechos[mergeStartRow] = true;

    descombinarSeguro(sheet, mergeStartRow, 8, mergeNumRows, 2);
    sheet.getRange(mergeStartRow, 8).setValue(salidas.map(function (s) { return s.code; }).join("\n\n"));
    sheet.getRange(mergeStartRow, 9).setValue(salidas.map(function (s) { return s.name; }).join("\n\n"));
    if (mergeNumRows > 1) {
      sheet.getRange(mergeStartRow, 8, mergeNumRows, 1).merge();
      sheet.getRange(mergeStartRow, 9, mergeNumRows, 1).merge();
    }
    sheet.getRange(mergeStartRow, 8, mergeNumRows, 2).setWrap(true);
    sheet.autoResizeRows(mergeStartRow, mergeNumRows);
    actualizados++;
  }
  return actualizados;
}

/**
 * =========================================================================
 * 2.5 ACTUALIZAR PRODUCTOS PARCIALES EN REGISTROS (G y H)
 * =========================================================================
 */
function actualizarProductosParciales() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (!esHojaValida(sheet.getName())) {
    SpreadsheetApp.getUi().alert("⚠️ Esta función solo se puede ejecutar en hojas de facultades.");
    return;
  }
  var actualizados = actualizarProductosParcialesCore_(sheet);
  SpreadsheetApp.getUi().alert("✅ Se actualizaron " + actualizados + " bloques de Registros (Productos Parciales).");
}

function actualizarProductosParcialesCore_(sheet) {
  var extSheet;
  var anexo1Name = getAnexo1SheetName(sheet.getName());
  
  try {
    extSheet = SpreadsheetApp.openById(ANEXO1_ID).getSheetByName(anexo1Name);
    if (!extSheet) return 0;
  } catch (e) {
    return 0;
  }
  
  var lastRowExt = extSheet.getLastRow();
  if (lastRowExt < 1) return 0;
  
  var datosAnexo1 = extSheet.getRange(1, 2, lastRowExt, 2).getValues();
  var lastRowDest = sheet.getLastRow();
  var valoresF = sheet.getRange(1, 6, lastRowDest, 1).getValues();
  var actualizados = 0;
  
  for (var i = 0; i < valoresF.length; i++) {
    var fVal = valoresF[i][0] ? valoresF[i][0].toString().trim().toUpperCase() : "";
  
    if (fVal === "REGISTROS") {
      var row = i + 1;
      var jVal = getBlockCode(sheet, row);
      var padre = jVal.substring(0, 5);
  
      if (!padre) continue;
  
      var regexMatch = new RegExp("^" + padre.replace(/\./g, "\\.") + "(?:\\.\\d{2})+(?:_|" + " |$)", "i");
      var parciales = [];
  
      for (var j = 0; j < datosAnexo1.length; j++) {
        var producto = datosAnexo1[j][0] ? datosAnexo1[j][0].toString().trim() : "";
        var tipo = datosAnexo1[j][1] ? datosAnexo1[j][1].toString().trim().toUpperCase() : "";
  
        if (producto && regexMatch.test(producto) && tipo.indexOf("PARCIAL") !== -1) {
          producto = producto.replace(/\s+/g, " ");
          parciales.push(producto);
        }
      }
  
      var textoFinal = parciales.join("\n\n");
  
      var cellG = sheet.getRange(row, 7);
      var mergedG = cellG.isPartOfMerge() ? cellG.getMergedRanges()[0] : null;
      var numRows = mergedG ? mergedG.getNumRows() : 1;
  
      descombinarSeguro(sheet, row, 7, numRows, 2);
      sheet.getRange(row, 7).setValue(textoFinal);
  
      if (numRows > 0) {
        sheet.getRange(row, 7, numRows, 2).merge();
      }
  
      sheet.getRange(row, 7, Math.max(numRows, 1), 2).setWrap(true);
      sheet.autoResizeRows(row, Math.max(numRows, 1));
  
      actualizados++;
    }
  }
  return actualizados;
}

/**
 * =========================================================================
 * 2.6 ID DEL ANEXO 1
 * =========================================================================
 */
var ANEXO1_ID = "1SUMuS32zUweN_o7WfdBhXq-ipvvaFXYTcxKF1hmhPww";

/**
 * =========================================================================
 * 3. FUNCIÓN AUTOMÁTICA onEdit (Dinámica para cualquier hoja válida)
 * =========================================================================
 */
function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.source.getActiveSheet();
  if (!esHojaValida(sheet.getName())) return;
  
  var range = e.range;
  var col = range.getColumn();
  var row = range.getRow();
  
  var valEditado = e.value;
  if (valEditado && typeof valEditado === "string" && !valEditado.startsWith("=")) {
    var regexCodigos = /[ \t]+(?=(?:PR|EN|BE|PE|PM|PS|PO)\.\d{2}(?:\.\d{2})*(?:_[A-Z0-9]+)?\b)/g;
    var newVal = valEditado.toUpperCase().replace(regexCodigos, "\n\n");
    if (newVal !== valEditado) {
      range.setValue(newVal);
    }
  }
  
  if ([2, 3, 4, 5, 8, 9, 10, 11].indexOf(col) === -1 || row < 12) return;
  
  // NUEVA VALIDACIÓN: Si la fila no está dentro del bloque de procesos, no hace nada
  if (!isRowInProcessBlock(sheet, row)) return;
  
  var headerRow = getClosestHeaderRow(sheet, row);
  var headB = sheet.getRange(headerRow, 2).getValue().toString();
  var headD = sheet.getRange(headerRow, 4).getValue().toString();
  
  var prefB = headB.length >= 2 ? headB.substring(0, 2).toUpperCase() : "";
  var prefD = headD.length >= 2 ? headD.substring(0, 2).toUpperCase() : "";
  
  var jVal = getBlockCode(sheet, row);
  var codigoFacultad = jVal.slice(-3) || "F00"; 
  
  if (col === 8 || col === 9) return;
  
  if (col === 10 || col === 11) {
    codificarBeneficiario(sheet, row, codigoFacultad);
    return;
  }
  
  var valB = sheet.getRange(row, 2).getValue().toString().trim();
  var valC = sheet.getRange(row, 3).getValue().toString().trim();
  var valD = sheet.getRange(row, 4).getValue().toString().trim();
  var valE = sheet.getRange(row, 5).getValue().toString().trim();
  
  var regexB = prefB ? new RegExp("^" + prefB + "\\.\\d+_[A-Z0-9]+\\s*", "i") : null;
  var regexD = prefD ? new RegExp("^" + prefD + "\\.\\d+_[A-Z0-9]+\\s*", "i") : null;
  
  function getCleanLinesPair(valCode, valText, regex) {
    var lines1 = valCode.split(/\n+/).map(function(s){return s.trim();}).filter(function(s){return s!=="";});
    var lines2 = valText.split(/\n+/).map(function(s){return s.trim();}).filter(function(s){return s!=="";});
    var max = Math.max(lines1.length, lines2.length);
    var valid = [];
    for (var i = 0; i < max; i++) {
      var l1 = lines1[i] || "";
      var l2 = lines2[i] || "";
      var pure = l2 ? l2 : l1;
      if (regex) pure = pure.replace(regex, "").trim();
      if (pure !== "") valid.push(pure.toUpperCase());
    }
    return valid;
  }
  
  var linesPR = getCleanLinesPair(valB, valC, regexB);
  var linesEN = getCleanLinesPair(valD, valE, regexD);
  var maxLines = Math.max(linesPR.length, linesEN.length);
  
  if (maxLines === 0) return;
  
  var mapB = prefB ? buildCodeMapSeparated(sheet, 2, 3, prefB, codigoFacultad, row) : {map:{}, maxSeq:0};
  var mapD = prefD ? buildCodeMapSeparated(sheet, 4, 5, prefD, codigoFacultad, row) : {map:{}, maxSeq:0};
  
  function assignCodeObj(pureText, pref, mapInfo) {
    if (!pureText || !pref) return {code: "", text: pureText};
    var key = generarLlave(pureText);
    var assignedCode;
    if (mapInfo.map[key]) {
      assignedCode = mapInfo.map[key];
    } else {
      mapInfo.maxSeq++;
      assignedCode = pref + "." + mapInfo.maxSeq.toString().padStart(2, '0') + "_" + codigoFacultad;
      mapInfo.map[key] = assignedCode;
    }
    return {code: assignedCode, text: pureText};
  }
  
  sheet.getRange(row, 2, 1, 2).breakApart();
  sheet.getRange(row, 4, 1, 2).breakApart();
  
  if (maxLines > 1) {
    var mergesToRestore = [];
    for (var c = 6; c <= 11; c++) {
      var cell = sheet.getRange(row, c);
      var merged = cell.isPartOfMerge() ? cell.getMergedRanges()[0] : null;
      mergesToRestore.push({
        col: c,
        startRow: merged ? merged.getRow() : row,
        numRows: merged ? merged.getNumRows() : 1
      });
    }
  
    sheet.insertRowsAfter(row, maxLines - 1);
  
    for (var i = 0; i < maxLines; i++) {
      var currentRow = row + i;
      var textPR = linesPR[i] !== undefined ? linesPR[i] : (linesPR.length === 1 ? linesPR[0] : "");
      var textEN = linesEN[i] !== undefined ? linesEN[i] : (linesEN.length === 1 ? linesEN[0] : "");
  
      var objPR = assignCodeObj(textPR, prefB, mapB);
      var objEN = assignCodeObj(textEN, prefD, mapD);
  
      sheet.getRange(currentRow, 2).setValue(objPR.code);
      sheet.getRange(currentRow, 3).setValue(objPR.text);
      sheet.getRange(currentRow, 4).setValue(objEN.code);
      sheet.getRange(currentRow, 5).setValue(objEN.text);
  
      sheet.getRange(currentRow, 2, 1, 2).breakApart();
      sheet.getRange(currentRow, 4, 1, 2).breakApart();
    }
  
    for (var m = 0; m < mergesToRestore.length; m++) {
      var info = mergesToRestore[m];
      var newTotalRows = info.numRows + (maxLines - 1);
      descombinarSeguro(sheet, info.startRow, info.col, newTotalRows, 1);
      sheet.getRange(info.startRow, info.col, newTotalRows, 1).merge();
    }
  } else {
    var objPR = assignCodeObj(linesPR[0] || "", prefB, mapB);
    var objEN = assignCodeObj(linesEN[0] || "", prefD, mapD);
    sheet.getRange(row, 2).setValue(objPR.code);
    sheet.getRange(row, 3).setValue(objPR.text);
    sheet.getRange(row, 4).setValue(objEN.code);
    sheet.getRange(row, 5).setValue(objEN.text);
  }
}

function codificarBeneficiario(sheet, row, codigoFacultad) {
  var colJ = 10;
  var colK = 11;
  
  var cellK = sheet.getRange(row, colK);
  var mergedK = cellK.isPartOfMerge() ? cellK.getMergedRanges()[0] : null;
  var startRow = mergedK ? mergedK.getRow() : row;
  var numRows = mergedK ? mergedK.getNumRows() : 1;
  
  var cellJ = sheet.getRange(startRow, colJ);
  var mergedJ = cellJ.isPartOfMerge() ? cellJ.getMergedRanges()[0] : null;
  if (mergedJ && mergedJ.getNumRows() > numRows) {
    numRows = mergedJ.getNumRows();
  }
  
  var valJ = sheet.getRange(startRow, colJ).getValue().toString().trim();
  var valK = sheet.getRange(startRow, colK).getValue().toString().trim();
  
  var linesJ = valJ.split(/\n+/).map(function(s){return s.trim();}).filter(function(s){return s!=="";});
  var linesK = valK.split(/\n+/).map(function(s){return s.trim();}).filter(function(s){return s!=="";});
  var maxLines = Math.max(linesJ.length, linesK.length);
  
  if (maxLines === 0) return;
  
  var mapInfo = buildCodeMapBeneficiarios(sheet, colJ, colK, startRow, numRows);
  var regexBE = new RegExp("^BE\\.\\d+_[A-Z0-9]+\\s*", "i");
  
  var codigosFinales = [];
  var nombresFinales = [];
  
  for (var i = 0; i < maxLines; i++) {
    var lJ = linesJ[i] || "";
    var lK = linesK[i] || "";
    var textoLinea = lK ? lK : lJ;
  
    var matchLegacy = textoLinea.match(/^BE\.\d+_[A-Z0-9]+\s+(.*)/i);
    var nombrePuro = matchLegacy ? matchLegacy[1].trim().toUpperCase() : textoLinea.replace(regexBE, "").trim().toUpperCase();
  
    if (!nombrePuro) continue;
  
    var key = generarLlave(nombrePuro);
    var codigoAsignado;
  
    if (mapInfo.map[key]) {
      codigoAsignado = mapInfo.map[key];
    } else {
      mapInfo.maxSeq++;
      codigoAsignado = "BE." + mapInfo.maxSeq.toString().padStart(2, '0') + "_" + codigoFacultad;
      mapInfo.map[key] = codigoAsignado;
    }
  
    codigosFinales.push(codigoAsignado);
    nombresFinales.push(nombrePuro);
  }
  
  sheet.getRange(startRow, colJ, numRows, 2).breakApart();
  sheet.getRange(startRow, colJ).setValue(codigosFinales.join("\n\n"));
  sheet.getRange(startRow, colK).setValue(nombresFinales.join("\n\n"));
  
  if (numRows > 1) {
    descombinarSeguro(sheet, startRow, colJ, numRows, 1);
    sheet.getRange(startRow, colJ, numRows, 1).merge();
    descombinarSeguro(sheet, startRow, colK, numRows, 1);
    sheet.getRange(startRow, colK, numRows, 1).merge();
  }
}

function buildCodeMapBeneficiarios(sheet, colJ, colK, excludeStartRow, excludeNumRows) {
  var lastRow = sheet.getLastRow();
  var map = {};
  var maxSeq = 0;
  
  if (lastRow < 12) return { map: map, maxSeq: maxSeq };
  
  var data = sheet.getRange(1, colJ, lastRow, 2).getValues();
  var valuesB = sheet.getRange(1, 2, lastRow, 1).getValues();
  
  var excludeStart = excludeStartRow;
  var excludeEnd = excludeStartRow + excludeNumRows - 1;
  
  var inBlock = false;
  
  for (var i = 0; i < lastRow; i++) {
    var anchorText = valuesB[i][0].toString().trim().toUpperCase();
    if (anchorText === "PROVEEDORES") { inBlock = true; continue; }
    if (anchorText === "EJECUCIÓN DEL PROCESO" || anchorText === "DESCRIPCIÓN DEL PROCESO" || anchorText === "RECURSOS") { inBlock = false; continue; }
    
    if (!inBlock) continue;
    
    var currentRow = i + 1;
    if (currentRow < 12) continue;
    if (currentRow >= excludeStart && currentRow <= excludeEnd) continue;
  
    var codeVal = data[i][0].toString().trim();
    var nameVal = data[i][1].toString().trim();
    if (!codeVal && !nameVal) continue;
  
    var linesJ = codeVal.split(/\n+/).map(function(s){return s.trim();}).filter(function(s){return s!=="";});
    var linesK = nameVal.split(/\n+/).map(function(s){return s.trim();}).filter(function(s){return s!=="";});
    var maxLines = Math.max(linesJ.length, linesK.length);
  
    for (var j = 0; j < maxLines; j++) {
      var lJ = linesJ[j] || "";
      var lK = linesK[j] || "";
  
      var matchCode = lJ.match(/^BE\.(\d+)_/i);
      if (matchCode) {
        var seq = parseInt(matchCode[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
  
      var pureName = lK ? lK : lJ.replace(/^BE\.\d+_[A-Z0-9]+\s*/i, "").trim();
      if (pureName && matchCode) {
        var key = generarLlave(pureName.toUpperCase());
        if (!map[key]) map[key] = matchCode[0].toUpperCase();
      }
    }
  }
  return { map: map, maxSeq: maxSeq };
}

/**
 * =========================================================================
 * 4. FUNCIONES DE REPARACIÓN Y SEPARACIÓN MASIVA
 * =========================================================================
 */
function corregirCodigosActuales() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (!esHojaValida(sheet.getName())) return;
    
  var valorJ5 = sheet.getRange("J5").getValue().toString();
  var codigoFacultad = valorJ5.slice(-3) || "F00";
  recalcularColumnaSeparadaReset(sheet, 2, 3, "PR", codigoFacultad);
  recalcularColumnaSeparadaReset(sheet, 4, 5, "EN", codigoFacultad);
  SpreadsheetApp.getUi().alert("✅ Códigos PR y EN corregidos y reseteados para " + sheet.getName());
}

function corregirBeneficiariosMasivo() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (!esHojaValida(sheet.getName())) return;
  
  var valorJ5 = sheet.getRange("J5").getValue().toString();
  var codigoFacultad = valorJ5.slice(-3) || "F00";
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 12) return;
  
  var mapInfo = { map: {}, maxSeq: 0 };
  var inBlock = false;
  var valuesB = sheet.getRange(1, 2, lastRow, 1).getValues();
  var procesados = {};
  
  var regexBE = new RegExp("^BE\\.\\d+_[A-Z0-9]+\\s*", "i");
  
  for (var row = 11; row <= lastRow; row++) {
    var anchorText = valuesB[row - 1][0].toString().trim().toUpperCase();
  
    if (anchorText === "PROVEEDORES") {
      inBlock = true;
      continue;
    }
    if (anchorText === "EJECUCIÓN DEL PROCESO" || anchorText === "DESCRIPCIÓN DEL PROCESO" || anchorText === "RECURSOS") {
      inBlock = false;
      continue;
    }
  
    if (row < 12) continue;
  
    if (inBlock) {
      var cellI = sheet.getRange(row, 9);
      var mergedI = cellI.isPartOfMerge() ? cellI.getMergedRanges()[0] : null;
      var startRow = mergedI ? mergedI.getRow() : row;
      var numRows = mergedI ? mergedI.getNumRows() : 1;
  
      if (procesados[startRow]) continue;
      procesados[startRow] = true;
  
      var valJ = sheet.getRange(startRow, 10).getValue().toString().trim();
      var valK = sheet.getRange(startRow, 11).getValue().toString().trim();
  
      if (!valJ && !valK) continue;
  
      var linesJ = valJ.split(/\n+/).map(function(s){return s.trim();}).filter(function(s){return s!=="";});
      var linesK = valK.split(/\n+/).map(function(s){return s.trim();}).filter(function(s){return s!=="";});
      var maxLines = Math.max(linesJ.length, linesK.length);
  
      var codigosFinales = [];
      var nombresFinales = [];
      var modificado = false;
  
      for (var i = 0; i < maxLines; i++) {
        var lJ = linesJ[i] || "";
        var lK = linesK[i] || "";
        var textoLinea = lK ? lK : lJ;
  
        var matchLegacy = textoLinea.match(/^BE\.\d+_[A-Z0-9]+\s+(.*)/i);
        var nombrePuro = matchLegacy ? matchLegacy[1].trim().toUpperCase() : textoLinea.replace(regexBE, "").trim().toUpperCase();
  
        if (!nombrePuro) continue;
  
        var key = generarLlave(nombrePuro);
        var codigoAsignado;
  
        if (mapInfo.map[key]) {
          codigoAsignado = mapInfo.map[key];
        } else {
          mapInfo.maxSeq++;
          codigoAsignado = "BE." + mapInfo.maxSeq.toString().padStart(2, '0') + "_" + codigoFacultad;
          mapInfo.map[key] = codigoAsignado;
        }
  
        codigosFinales.push(codigoAsignado);
        nombresFinales.push(nombrePuro);
        modificado = true;
      }
  
      if (modificado) {
        descombinarSeguro(sheet, startRow, 10, numRows, 2);
  
        sheet.getRange(startRow, 10).setValue(codigosFinales.join("\n\n"));
        sheet.getRange(startRow, 11).setValue(nombresFinales.join("\n\n"));
  
        if (numRows > 1) {
          sheet.getRange(startRow, 10, numRows, 1).merge();
          sheet.getRange(startRow, 11, numRows, 1).merge();
        }
      }
    }
  }
  
  SpreadsheetApp.getUi().alert("✅ Beneficiarios corregidos para " + sheet.getName());
}

// =========================================================================
// FUNCIONES AUXILIARES GLOBALES
// =========================================================================

function generarLlave(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ').trim();
}

function descombinarSeguro(sheet, row, col, numRows, numCols) {
  var range = sheet.getRange(row, col, numRows, numCols);
  var merges = range.getMergedRanges();
  for (var i = 0; i < merges.length; i++) {
    merges[i].breakApart();
  }
}

function getBlockCode(sheet, currentRow) {
  var valuesI = sheet.getRange(1, 9, currentRow, 1).getValues();
  for (var i = currentRow - 1; i >= 0; i--) {
    var textI = valuesI[i][0].toString().trim().toUpperCase();
    if (textI === "CODIGO" || textI === "CÓDIGO") {
      return sheet.getRange(i + 1, 10).getValue().toString().trim();
    }
  }
  return sheet.getRange("J5").getValue().toString().trim();
}

function buildCodeMapSeparated(sheet, colCode, colText, prefix, facultyCode, ignoreRow) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 11) return { map: {}, maxSeq: 0 };
  var codes = sheet.getRange(1, colCode, lastRow, 1).getValues();
  var texts = sheet.getRange(1, colText, lastRow, 1).getValues();
  var valuesB = sheet.getRange(1, 2, lastRow, 1).getValues();
  
  var map = {};
  var maxSeq = 0;
  var regexCode = new RegExp("^" + prefix + "\\.(\\d+)_" + facultyCode, "i");
  
  var inBlock = false;
  
  for (var i = 0; i < lastRow; i++) {
    var anchorText = valuesB[i][0].toString().trim().toUpperCase();
    if (anchorText === "PROVEEDORES") { inBlock = true; continue; }
    if (anchorText === "EJECUCIÓN DEL PROCESO" || anchorText === "DESCRIPCIÓN DEL PROCESO" || anchorText === "RECURSOS") { inBlock = false; continue; }
    
    if (!inBlock) continue;
    
    var currentRow = i + 1;
    if (currentRow < 11) continue;
    if (currentRow === ignoreRow) continue;
    
    var codeVal = codes[i][0].toString().trim();
    var textVal = texts[i][0].toString().trim();
    var match = codeVal.match(regexCode);
    if (match) {
      var fullCode = match[0].toUpperCase();
      var seqNum = parseInt(match[1], 10);
      var key = generarLlave(textVal);
      if (key && !map[key]) map[key] = fullCode;
      if (seqNum > maxSeq) maxSeq = seqNum;
    }
  }
  return { map: map, maxSeq: maxSeq };
}

function recalcularColumnaSeparadaReset(sheet, colCode, colText, prefix, facultyCode) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 11) return;
  var valuesB = sheet.getRange(1, 2, lastRow, 1).getValues();
  var rangeCode = sheet.getRange(1, colCode, lastRow, 1);
  var rangeText = sheet.getRange(1, colText, lastRow, 1);
  var codes = rangeCode.getValues();
  var texts = rangeText.getValues();
  var map = {};
  var maxSeq = 0;
  var inBlock = false;
  var dataChanged = false;
  var regexLegacy = new RegExp("^([A-Z]+\\.[\\d\\.]+)_" + "[A-Z0-9]+\\s+(.*)", "i");
  
  for (var i = 0; i < lastRow; i++) {
    var anchorText = valuesB[i][0].toString().trim().toUpperCase();
    if (anchorText === "PROVEEDORES") {
      inBlock = true;
      continue;
    }
    if (anchorText === "EJECUCIÓN DEL PROCESO" || anchorText === "DESCRIPCIÓN DEL PROCESO" || anchorText === "RECURSOS") {
      inBlock = false;
      continue;
    }
  
    if (inBlock) {
      descombinarSeguro(sheet, i + 1, colCode, 1, 2);
      var codeVal = codes[i][0].toString().trim();
      var textVal = texts[i][0].toString().trim();
      if (!codeVal && !textVal) continue;
  
      if (!codeVal && textVal) {
        var matchL = textVal.match(regexLegacy);
        if (matchL) {
          textVal = matchL[2];
        }
      } else if (codeVal && !textVal) {
        var matchL2 = codeVal.match(regexLegacy);
        if (matchL2) {
          textVal = matchL2[2];
        }
      }  
  
      var pureText = textVal.trim() || codeVal.replace(new RegExp("^" + prefix + "\\.\\d+_[A-Z0-9]+\\s*", "i"), "").trim();
      if (!pureText) continue;
  
      pureText = pureText.toUpperCase();
      var key = generarLlave(pureText);
      var assignedCode;
  
      if (map[key]) {
        assignedCode = map[key];
      } else {
        maxSeq++;
        assignedCode = prefix + "." + maxSeq.toString().padStart(2, '0') + "_" + facultyCode;
        map[key] = assignedCode;
      }
  
      if (codes[i][0] !== assignedCode || texts[i][0] !== pureText) {
        codes[i][0] = assignedCode;
        texts[i][0] = pureText;
        dataChanged = true;
      }
    }
  }
  if (dataChanged) {
    rangeCode.setValues(codes);
    rangeText.setValues(texts);
  }
}

function getClosestHeaderRow(sheet, currentRow) {
  var values = sheet.getRange(1, 2, currentRow, 1).getValues();
  for (var i = currentRow - 1; i >= 0; i--) {
    if (values[i][0].toString().trim().toUpperCase() === "PROVEEDORES") return i + 1;
  }
  return 11;
} 