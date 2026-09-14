/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  RESUMEN GENERAL — avance combinado del Anexo 1 y el Anexo 3
 *  Oficina de Racionalización — OGPL (UNMSM)
 *
 *  VERSIÓN 1
 *  ─────────────────────────────────────────────────────────────────────────────
 *   Antes esta hoja la generaba `Anexo3_Revision_v3.gs` en cada corrida del
 *   Anexo 3, releyendo además `RESUMEN_EJECUTIVO_A1`. Eso volvía la corrida del
 *   Anexo 3 más pesada por una hoja que no depende de su propia lógica de
 *   revisión, así que se separó en este script.
 *
 *   No vuelve a auditar nada: SOLO lee las dos hojas de resumen que los
 *   auditores del Anexo 1 y del Anexo 3 ya dejaron escritas en el libro de
 *   revisión —`RESUMEN_EJECUTIVO_A1` y `RESUMEN_EJECUTIVO_A3`— y combina su
 *   avance por facultad, mitad y mitad. Es la misma información y el mismo
 *   cálculo que antes traía `RESUMEN_GENERAL`; solo cambió cuándo se genera.
 *
 *   Todos los nombres de este archivo llevan el sufijo `RG_` (o `_RG`) a
 *   propósito: el proyecto ya sufrió dos veces una declaración duplicada entre
 *   archivos —`CONFIG_HISTORIAL` y `calcularPorcentajeGeneralAnexo3_`—, así que
 *   este script no reutiliza ni un nombre de los demás, aunque compartan el
 *   mismo proyecto de Apps Script.
 *
 *  Uso
 *  ─────────────────────────────────────────────────────────────────────────────
 *   Menú «Auditoría OGPL › Actualizar resumen general», cada vez que cambie el
 *   Anexo 1 o el Anexo 3 y se quiera reflejar en el combinado. También puede
 *   ejecutarse `actualizarResumenGeneral` directamente desde el editor.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const CONFIG_GENERAL = {

  /** Libro de revisión: el mismo donde viven RESUMEN_EJECUTIVO_A1 y _A3. */
  ID_LIBRO: '1oYBAHp-Bd0V8un5hUAWdK1jKbcbdsROH4IOyM0MAmFk',

  HOJA_SALIDA: 'RESUMEN_GENERAL',

  HOJA_A1: 'RESUMEN_EJECUTIVO_A1',
  COLUMNA_FACULTAD_A1: 'FACULTAD',
  COLUMNA_NOMBRE_A1: 'NOMBRE',
  COLUMNA_AVANCE_A1: 'AVANCE GENERAL DEL ANEXO 1',

  HOJA_A3: 'RESUMEN_EJECUTIVO_A3',
  COLUMNA_FACULTAD_A3: 'SIGLA',
  COLUMNA_NOMBRE_A3: 'FACULTAD',
  COLUMNA_AVANCE_A3: '% AVANCE',
  COLUMNA_CRITICOS_A3: 'CRÍTICOS (TOTAL)',

  /**
   * Peso de cada anexo en el avance general. 50/50 por decisión de la OGPL: son
   * dos entregables distintos y a la facultad se le exigen ambos, así que
   * ninguno pesa más por tener más celdas que revisar.
   */
  PESOS: { A1: 0.5, A3: 0.5 },

  FUENTE_REPORTE: 'Arial',

  COLORES: {
    correcto:    { fondo: '#d9ead3', texto: '#274e13', rotulo: 'Correcto'    },
    incompleto:  { fondo: '#fff2cc', texto: '#7f6000', rotulo: 'Incompleto'  },
    observacion: { fondo: '#fce5cd', texto: '#7f3f00', rotulo: 'Observación' },
    critico:     { fondo: '#f4cccc', texto: '#990000', rotulo: 'Crítico'     }
  },

  TRAMOS_AVANCE: [
    { desde: 95, clave: 'correcto',    rotulo: 'Satisfactorio' },
    { desde: 80, clave: 'incompleto',  rotulo: 'Aceptable'     },
    { desde: 60, clave: 'observacion', rotulo: 'En proceso'    },
    { desde: 0,  clave: 'critico',     rotulo: 'Crítico'       }
  ]
};

/* ═══════════════════════════════════════════════════════════════════════════
   UTILIDADES  (puras — cubiertas por las pruebas)
   ═══════════════════════════════════════════════════════════════════════════ */

function normalizarRG_(txt) {
  return (txt === null || txt === undefined ? '' : txt).toString().trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').replace(/[:.]+$/, '');
}

/**
 * Convierte a número (0–100) un porcentaje escrito de cualquiera de las formas
 * en que puede venir de una celda de otra hoja: `85`, `85%`, `"85 %"`, `0.85` o
 * `85,3`. Devuelve null cuando no hay dato, para poder distinguir «0 % de
 * avance» de «no hay dato» — promediar un vacío como si fuera cero castigaría
 * a una facultad por algo que nadie midió.
 */
function porcentajeARG_(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') {
    if (isNaN(valor)) return null;
    // Una celda con formato de porcentaje llega como fracción: 0,85 = 85 %.
    return valor > 0 && valor <= 1 ? valor * 100 : valor;
  }
  const texto = valor.toString().trim().replace('%', '').replace(',', '.');
  if (!texto || isNaN(Number(texto))) return null;
  return Number(texto);
}

/**
 * Un número entero simple (un conteo, no un porcentaje), o null si el valor no
 * es utilizable. A diferencia de `porcentajeARG_`, NO escala una fracción: la
 * columna CRÍTICOS (TOTAL) trae un conteo (`1`, `2`…), y tratarlo como
 * porcentaje convertiría un solo crítico en «100 %».
 */
function enteroRG_(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor.toString().trim().replace(',', '.'));
  return isNaN(n) ? null : Math.round(n);
}

/* ═══════════════════════════════════════════════════════════════════════════
   LECTURA DE UNA HOJA DE RESUMEN (A1 o A3)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Lee una hoja de resumen (la del Anexo 1 o la del Anexo 3) y devuelve, en el
 * orden en que aparecen sus filas:
 *
 *   { orden: ['FM', 'FDCP', …],
 *     porSigla: { FM: { nombre, avance, criticos }, … } }
 *
 * El encabezado se busca por NOMBRE, no por posición: las dos hojas han
 * cambiado de columnas varias veces y fijar un índice las volvería a romper.
 * La fila TOTAL de cierre se descarta.
 */
function leerResumenPorFacultadRG_(valores, etiquetaSigla, etiquetaNombre, etiquetaAvance, etiquetaCriticos) {
  const resultado = { orden: [], porSigla: {} };
  if (!valores || !valores.length) return resultado;

  let filaEncabezado = -1;
  let colSigla = -1, colNombre = -1, colAvance = -1, colCriticos = -1;

  for (let f = 0; f < valores.length && filaEncabezado === -1; f++) {
    let sigla = -1, avance = -1;
    for (let c = 0; c < valores[f].length; c++) {
      const n = normalizarRG_(valores[f][c]);
      if (sigla === -1 && n === normalizarRG_(etiquetaSigla)) sigla = c;
      if (avance === -1 && n === normalizarRG_(etiquetaAvance)) avance = c;
    }
    // Con las dos columnas imprescindibles ya es la fila de encabezados.
    if (sigla !== -1 && avance !== -1) {
      filaEncabezado = f;
      colSigla = sigla;
      colAvance = avance;
      for (let c = 0; c < valores[f].length; c++) {
        const n = normalizarRG_(valores[f][c]);
        if (colNombre === -1 && n === normalizarRG_(etiquetaNombre)) colNombre = c;
        if (etiquetaCriticos && colCriticos === -1 && n === normalizarRG_(etiquetaCriticos)) colCriticos = c;
      }
    }
  }
  if (filaEncabezado === -1) return resultado;

  for (let f = filaEncabezado + 1; f < valores.length; f++) {
    const fila = valores[f];
    const siglaCruda = (fila[colSigla] || '').toString().trim();
    const sigla = normalizarRG_(siglaCruda);
    // La fila TOTAL cierra la tabla. Debajo de ella el Anexo 1 agrega una
    // LEYENDA a mano, con sus propios textos en la columna de la sigla: sin
    // este corte, esos textos se leerían como si fueran facultades más.
    if (sigla === 'TOTAL') break;
    if (!sigla) continue;

    resultado.orden.push(sigla);
    resultado.porSigla[sigla] = {
      nombre: colNombre === -1 ? '' : (fila[colNombre] || '').toString().trim(),
      avance: porcentajeARG_(fila[colAvance]),
      criticos: colCriticos === -1 ? 0 : (enteroRG_(fila[colCriticos]) || 0)
    };
  }
  return resultado;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMBINACIÓN 50/50
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Avance general de una facultad a partir de los dos anexos.
 *
 * Los pesos son una decisión, no un dato: 50/50 significa que cada anexo vale
 * lo mismo aunque el Anexo 1 evalúe muchas más celdas. Si falta el avance de
 * uno de los dos, NO se promedia con cero: se informa el que hay y se dice que
 * el otro falta.
 */
function combinarRG_(avanceA1, avanceA3, pesos) {
  const p = pesos || CONFIG_GENERAL.PESOS;
  const hayA1 = (avanceA1 !== null && avanceA1 !== undefined);
  const hayA3 = (avanceA3 !== null && avanceA3 !== undefined);

  if (hayA1 && hayA3) {
    const suma = p.A1 + p.A3;
    return {
      general: Math.round(((avanceA1 * p.A1 + avanceA3 * p.A3) / suma) * 10) / 10,
      completo: true,
      nota: ''
    };
  }
  if (hayA3) {
    return { general: avanceA3, completo: false,
             nota: 'Sin dato del Anexo 1: el general muestra solo el avance del Anexo 3.' };
  }
  if (hayA1) {
    return { general: avanceA1, completo: false,
             nota: 'Sin dato del Anexo 3: el general muestra solo el avance del Anexo 1.' };
  }
  return { general: null, completo: false, nota: 'Sin datos de ninguno de los dos anexos.' };
}

/** Estado (tramo + semáforo) de una facultad, igual criterio que en el Anexo 3. */
function estadoRG_(avance, criticos) {
  let tramo = CONFIG_GENERAL.TRAMOS_AVANCE[CONFIG_GENERAL.TRAMOS_AVANCE.length - 1];
  for (let i = 0; i < CONFIG_GENERAL.TRAMOS_AVANCE.length; i++) {
    if (avance >= CONFIG_GENERAL.TRAMOS_AVANCE[i].desde) { tramo = CONFIG_GENERAL.TRAMOS_AVANCE[i]; break; }
  }
  if (!criticos) return { clave: tramo.clave, rotulo: tramo.rotulo };

  // Un hallazgo crítico del Anexo 3 impide considerar satisfactoria a la
  // facultad por alto que sea el porcentaje: baja como mínimo a "En proceso".
  const clave = (['correcto', 'incompleto', 'observacion', 'critico'].indexOf(tramo.clave) >=
                 ['correcto', 'incompleto', 'observacion', 'critico'].indexOf('observacion'))
    ? tramo.clave : 'observacion';
  return {
    clave: clave,
    rotulo: (clave === tramo.clave ? tramo.rotulo : 'En proceso') +
            ' — ' + criticos + ' hallazgo(s) crítico(s) del Anexo 3'
  };
}

/**
 * Construye las filas del RESUMEN_GENERAL a partir de lo ya leído de las dos
 * hojas de resumen. Pura: no toca Sheets, para poder probarla sin Apps Script.
 *
 * El orden es el de `resumenA3` (F01 → F20, tal como lo deja el Anexo 3); las
 * facultades que solo aparezcan en el Anexo 1 se agregan al final, para no
 * perder ese dato en vez de descartarlo en silencio.
 */
function construirFilasResumenGeneralRG_(resumenA1, resumenA3, opciones) {
  const op = opciones || {};
  const hayHojaA1 = op.hayHojaA1 !== false;
  const hayHojaA3 = op.hayHojaA3 !== false;

  const siglas = resumenA3.orden.slice();
  resumenA1.orden.forEach(function (s) { if (siglas.indexOf(s) === -1) siglas.push(s); });

  const filas = [];
  const generales = [];

  siglas.forEach(function (sigla) {
    const a1 = resumenA1.porSigla[sigla];
    const a3 = resumenA3.porSigla[sigla];
    const combinado = combinarRG_(a1 ? a1.avance : null, a3 ? a3.avance : null);

    const notas = [];
    if (!hayHojaA1) notas.push('No se encontró la hoja ' + CONFIG_GENERAL.HOJA_A1 + ': ejecute primero la auditoría del Anexo 1.');
    else if (!a1) notas.push('La facultad no aparece en ' + CONFIG_GENERAL.HOJA_A1 + '.');
    if (!hayHojaA3) notas.push('No se encontró la hoja ' + CONFIG_GENERAL.HOJA_A3 + ': ejecute primero la revisión del Anexo 3.');
    else if (!a3) notas.push('La facultad no aparece en ' + CONFIG_GENERAL.HOJA_A3 + '.');
    if (hayHojaA1 && hayHojaA3 && combinado.nota) notas.push(combinado.nota);

    const criticos = a3 ? (a3.criticos || 0) : 0;
    if (criticos) notas.push(criticos + ' hallazgo(s) crítico(s) en el Anexo 3.');

    if (combinado.completo) generales.push(combinado.general);
    const estado = estadoRG_(combinado.general === null ? 0 : combinado.general, criticos);

    filas.push({
      sigla: sigla,
      nombre: (a3 && a3.nombre) || (a1 && a1.nombre) || '(sin nombre)',
      avanceA1: a1 ? a1.avance : null,
      avanceA3: a3 ? a3.avance : null,
      general: combinado.general,
      estado: estado,
      notas: notas.join(' ')
    });
  });

  const promedio = generales.length
    ? Math.round((generales.reduce(function (a, x) { return a + x; }, 0) / generales.length) * 10) / 10
    : null;
  const criticosTotal = siglas.reduce(function (a, s) {
    const a3 = resumenA3.porSigla[s];
    return a + (a3 ? (a3.criticos || 0) : 0);
  }, 0);

  return {
    filas: filas,
    total: {
      general: promedio,
      estado: estadoRG_(promedio === null ? 0 : promedio, criticosTotal),
      nota: 'Promedio simple de las ' + generales.length + ' facultad(es) con avance en los dos ' +
            'anexos. Cada facultad pesa igual, y dentro de cada una el Anexo 1 vale ' +
            Math.round(CONFIG_GENERAL.PESOS.A1 * 100) + ' % y el Anexo 3 ' +
            Math.round(CONFIG_GENERAL.PESOS.A3 * 100) + ' %.'
    }
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ESCRITURA DE LA HOJA
   ═══════════════════════════════════════════════════════════════════════════ */

function escribirHojaGeneralRG_(ss, encabezados, filas, severidades) {
  let hoja = ss.getSheetByName(CONFIG_GENERAL.HOJA_SALIDA);
  if (!hoja) hoja = ss.insertSheet(CONFIG_GENERAL.HOJA_SALIDA);
  hoja.clear();

  const cabecera = encabezados.concat(['CLASIFICACIÓN']);
  const cuerpo = filas.map(function (fila, i) {
    const clave = severidades[i] || 'correcto';
    return fila.concat([(CONFIG_GENERAL.COLORES[clave] || CONFIG_GENERAL.COLORES.correcto).rotulo]);
  });

  const datos = [cabecera].concat(cuerpo.length ? cuerpo : [cabecera.map(function () { return ''; })]);
  const ancho = cabecera.length;
  hoja.getRange(1, 1, datos.length, ancho).setValues(datos);
  hoja.getRange(1, 1, datos.length, ancho)
      .setFontFamily(CONFIG_GENERAL.FUENTE_REPORTE).setVerticalAlignment('top').setWrap(true);
  hoja.getRange(1, 1, 1, ancho).setFontWeight('bold')
      .setFontColor('#ffffff').setBackground('#1f3864');
  hoja.setFrozenRows(1);

  if (cuerpo.length) {
    let inicio = 0;
    for (let i = 1; i <= cuerpo.length; i++) {
      if (i < cuerpo.length && severidades[i] === severidades[inicio]) continue;
      const color = CONFIG_GENERAL.COLORES[severidades[inicio]] || CONFIG_GENERAL.COLORES.correcto;
      hoja.getRange(inicio + 2, 1, i - inicio, ancho)
          .setBackground(color.fondo).setFontColor(color.texto);
      inicio = i;
    }
  }
  for (let c = 1; c <= ancho; c++) hoja.setColumnWidth(c, c <= 2 ? 140 : 260);
  if (cuerpo.length) hoja.getRange(1, 1, cuerpo.length + 1, ancho).createFilter();
  return hoja;
}

/**
 * Formato condicional sobre la columna de % general. Se deja como REGLA y no
 * como color fijo, para que siga funcionando si alguien edita el porcentaje a
 * mano.
 */
function aplicarSemaforoRG_(hoja, columna, numFilas) {
  const rango = hoja.getRange(2, columna, numFilas, 1);
  const reglas = [];
  CONFIG_GENERAL.TRAMOS_AVANCE.forEach(function (tramo) {
    const color = CONFIG_GENERAL.COLORES[tramo.clave];
    reglas.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThanOrEqualTo(tramo.desde / 100)
      .setBackground(color.fondo).setFontColor(color.texto)
      .setRanges([rango]).build());
  });
  hoja.setConditionalFormatRules(hoja.getConditionalFormatRules().concat(reglas));
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUNTO DE ENTRADA
   ═══════════════════════════════════════════════════════════════════════════ */

/** Libro de revisión: por ID; el activo solo como respaldo. */
function abrirLibroGeneralRG_() {
  try {
    return SpreadsheetApp.openById(CONFIG_GENERAL.ID_LIBRO);
  } catch (e) {
    const activo = SpreadsheetApp.getActiveSpreadsheet();
    if (activo) return activo;
    throw new Error('No se pudo abrir el libro de revisión (' + CONFIG_GENERAL.ID_LIBRO +
                    '). Verifique el ID en CONFIG_GENERAL.ID_LIBRO y su permiso de edición. ' +
                    'Detalle: ' + e.message);
  }
}

/**
 * Actualiza RESUMEN_GENERAL a partir de lo que ya dejaron escrito el auditor
 * del Anexo 1 y el del Anexo 3. No vuelve a auditar nada.
 */
function actualizarResumenGeneral() {
  const ss = abrirLibroGeneralRG_();

  const hojaA1 = ss.getSheetByName(CONFIG_GENERAL.HOJA_A1);
  const hojaA3 = ss.getSheetByName(CONFIG_GENERAL.HOJA_A3);

  const resumenA1 = hojaA1
    ? leerResumenPorFacultadRG_(hojaA1.getDataRange().getValues(),
        CONFIG_GENERAL.COLUMNA_FACULTAD_A1, CONFIG_GENERAL.COLUMNA_NOMBRE_A1, CONFIG_GENERAL.COLUMNA_AVANCE_A1)
    : { orden: [], porSigla: {} };
  const resumenA3 = hojaA3
    ? leerResumenPorFacultadRG_(hojaA3.getDataRange().getValues(),
        CONFIG_GENERAL.COLUMNA_FACULTAD_A3, CONFIG_GENERAL.COLUMNA_NOMBRE_A3, CONFIG_GENERAL.COLUMNA_AVANCE_A3,
        CONFIG_GENERAL.COLUMNA_CRITICOS_A3)
    : { orden: [], porSigla: {} };

  const resultado = construirFilasResumenGeneralRG_(resumenA1, resumenA3,
    { hayHojaA1: !!hojaA1, hayHojaA3: !!hojaA3 });

  const filasSalida = resultado.filas.map(function (f) {
    return [f.sigla, f.nombre, f.avanceA1 === null ? '—' : f.avanceA1 / 100,
            f.avanceA3 === null ? '—' : f.avanceA3 / 100,
            f.general === null ? '—' : f.general / 100, f.estado.rotulo, f.notas];
  });
  const severidades = resultado.filas.map(function (f) { return f.estado.clave; });

  filasSalida.push(['TOTAL', 'PROMEDIO DE LAS ' + resultado.filas.length + ' FACULTADES', '', '',
                    resultado.total.general === null ? '—' : resultado.total.general / 100,
                    resultado.total.estado.rotulo, resultado.total.nota]);
  severidades.push(resultado.total.estado.clave);

  const hoja = escribirHojaGeneralRG_(ss,
    ['SIGLA', 'FACULTAD', '% ANEXO 1', '% ANEXO 3', '% GENERAL', 'ESTADO', 'NOTAS'],
    filasSalida, severidades);
  if (filasSalida.length) {
    hoja.getRange(2, 3, filasSalida.length, 3).setNumberFormat('0.0%');
    aplicarSemaforoRG_(hoja, 5, filasSalida.length);
    hoja.getRange(filasSalida.length + 1, 1, 1, 8).setFontWeight('bold');
  }
  ss.setActiveSheet(hoja);

  const mensaje = 'Resumen general actualizado.\n\n' + resultado.filas.length + ' facultad(es).\n' +
    (hojaA1 ? '' : 'No se encontró ' + CONFIG_GENERAL.HOJA_A1 + '.\n') +
    (hojaA3 ? '' : 'No se encontró ' + CONFIG_GENERAL.HOJA_A3 + '.\n') +
    (resultado.total.general === null ? '' : 'Promedio general: ' + resultado.total.general + '%.');
  Logger.log(mensaje);
  try {
    SpreadsheetApp.getUi().alert(mensaje);
  } catch (e) {
    // Sin interfaz disponible: ejecución desde el editor o por disparador.
  }
  return hoja.getParent().getUrl();
}
