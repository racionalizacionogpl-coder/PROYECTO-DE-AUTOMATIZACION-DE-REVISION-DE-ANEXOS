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
  var datos = extSheet.getRange("B1:B" + lastRowExt).getValues();
  
  var regexEscaped = codigoBase.replace(/\./g, "\\.");
  var regexMatch = new RegExp("^\\s*" + regexEscaped + "\\.\\d{2}(?:_|" + " |$)", "i");
  
  var subprocesosCode = [];
  var subprocesosName = [];
  
  for (var i = 0; i < datos.length; i++) {
    var cellVal = datos[i][0].toString().trim();
    if (!cellVal) continue;
  
    var lineas = cellVal.split(/\n+/);
    for (var j = 0; j < lineas.length; j++) {
      var linea = lineas[j].trim().toUpperCase().replace(/\s+/g, " ");
      if (regexMatch.test(linea)) {
        var spaceIdx = linea.indexOf(" ");
        if (spaceIdx !== -1) {
          subprocesosCode.push(linea.substring(0, spaceIdx).trim());
          subprocesosName.push(linea.substring(spaceIdx + 1).trim());
        } else {
          subprocesosCode.push(linea);
          subprocesosName.push("");
        }
      }
    }
  }
  
  if (subprocesosCode.length > 0) {
    var blocks = [];
    var currRow = initialRow;
  
    for (var k = 0; k < subprocesosCode.length; k++) {
      var fCell = sheet.getRange(currRow, 6);
      var fMerged = fCell.isPartOfMerge() ? fCell.getMergedRanges()[0] : null;
      var sRow = fMerged ? fMerged.getRow() : currRow;
      var nRows = fMerged ? fMerged.getNumRows() : 1;
      blocks.push({ startRow: sRow, numRows: nRows });
      currRow = sRow + nRows;
    }
  
    for (var k = 0; k < blocks.length; k++) {
      descombinarSeguro(sheet, blocks[k].startRow, 6, blocks[k].numRows, 2);
    }
  
    for (var k = 0; k < blocks.length; k++) {
      sheet.getRange(blocks[k].startRow, 6).setValue(subprocesosCode[k]);
      sheet.getRange(blocks[k].startRow, 7).setValue(subprocesosName[k]);
      if (blocks[k].numRows > 1) {
        sheet.getRange(blocks[k].startRow, 6, blocks[k].numRows, 1).merge();
        sheet.getRange(blocks[k].startRow, 7, blocks[k].numRows, 1).merge();
      }
    }
    SpreadsheetApp.getUi().alert("✅ Se importaron " + subprocesosCode.length + " subprocesos en F y G.");
  } else {
    SpreadsheetApp.getUi().alert("ℹ️ No se encontraron subprocesos para: " + codigoBase);
  }
}

/**
 * =========================================================================
 * 2. ACTUALIZAR PRODUCTOS FINALES (H e I)
 * =========================================================================
 */
function obtenerProductosFinalesSeparados(codigoProceso, datosAnexo1) {
  var escaped = codigoProceso.replace(/\./g, "\\.");
  var regexMatch = new RegExp("^" + escaped + "\\.\\d{2}(?:_|" + " |$)", "i");
  var resultados = [];
  
  for (var i = 0; i < datosAnexo1.length; i++) {
    var producto = datosAnexo1[i][0] ? datosAnexo1[i][0].toString().trim() : "";
    var tipo = datosAnexo1[i][1] ? datosAnexo1[i][1].toString().trim() : "";
    if (!producto) continue;
  
    if (regexMatch.test(producto) && tipo.toUpperCase().indexOf("FINAL") !== -1) {
      producto = producto.toUpperCase().replace(/\s+/g, " ");
      var spaceIdx = producto.indexOf(" ");
      if (spaceIdx !== -1) {
        resultados.push({ code: producto.substring(0, spaceIdx).trim(), name: producto.substring(spaceIdx + 1).trim() });
      } else {
        resultados.push({ code: producto, name: "" });
      }
    }
  }
  return resultados;
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
  var codigosF = sheet.getRange(1, 6, lastRowDest, 1).getValues();
  
  var regexCodigoProceso = /[A-Z]{2}\.\d{2}\.\d{2}/i;
  var actualizados = 0;
  
  for (var i = 0; i < codigosF.length; i++) {
    var fVal = codigosF[i][0] ? codigosF[i][0].toString().trim() : "";
    if (!fVal) continue;
  
    var match = fVal.match(regexCodigoProceso);
    if (!match) continue;
  
    var codigoProceso = match[0];
    var salidas = obtenerProductosFinalesSeparados(codigoProceso, datosAnexo1);
    if (salidas.length === 0) continue;
  
    var row = i + 1;
    var fCell = sheet.getRange(row, 6);
    var fMerged = fCell.isPartOfMerge() ? fCell.getMergedRanges()[0] : null;
    var mergeStartRow = fMerged ? fMerged.getRow() : row;
    var mergeNumRows = fMerged ? fMerged.getNumRows() : 1;
  
    descombinarSeguro(sheet, mergeStartRow, 8, mergeNumRows, 2);
  
    var codigosJoined = salidas.map(function(s) { return s.code; }).join("\n\n");
    var nombresJoined = salidas.map(function(s) { return s.name; }).join("\n\n");
  
    sheet.getRange(mergeStartRow, 8).setValue(codigosJoined);
    sheet.getRange(mergeStartRow, 9).setValue(nombresJoined);
  
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