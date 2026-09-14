/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  HISTORIAL DE REVISIONES — Oficina de Racionalización, OGPL (UNMSM)
 *
 *  Registra el avance de cada anexo, corrida a corrida, en la hoja
 *  `HISTORIAL_REVISIONES` del libro de revisión.
 *
 *  Esta es la ÚNICA definición de `registrarRevision()` del proyecto: cada
 *  auditor la llama al terminar. Si un archivo de anexo declarara la suya, Apps
 *  Script ejecutaría solo una de las dos y sin avisar cuál.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Se llama CONFIG_HISTORIAL_REVISIONES y no CONFIG_HISTORIAL porque ese nombre
 * ya lo usa `ExportarJSON.gs` para otra cosa. En Apps Script todos los archivos
 * comparten un único ámbito global, y dos `const` con el mismo nombre son un
 * SyntaxError que impide ejecutar CUALQUIER función del proyecto.
 */
const CONFIG_HISTORIAL_REVISIONES = {

  /**
   * Libro donde vive el historial: `4_REVISIÓN_INTERNA DE_AVANCES_ACTIVIDADES`,
   * el mismo de los reportes del Anexo 1 y del Anexo 3.
   *
   * Se abre por ID y NO con `getActiveSpreadsheet()`: al ejecutar desde el
   * editor no hay libro activo y la llamada fallaba, y al ejecutar con otro
   * archivo abierto el historial terminaba escrito en el libro equivocado.
   */
  ID_LIBRO: '1oYBAHp-Bd0V8un5hUAWdK1jKbcbdsROH4IOyM0MAmFk',

  HOJA: 'HISTORIAL_REVISIONES',
  ENCABEZADOS: ['FECHA_HORA', 'ANEXO', 'PORCENTAJE']
};

/** Libro del historial: el declarado por ID; el activo solo como respaldo. */
function libroDelHistorial_() {
  try {
    return SpreadsheetApp.openById(CONFIG_HISTORIAL_REVISIONES.ID_LIBRO);
  } catch (e) {
    const activo = SpreadsheetApp.getActiveSpreadsheet();
    if (activo) return activo;
    throw new Error('No se pudo abrir el libro del historial (' + CONFIG_HISTORIAL_REVISIONES.ID_LIBRO +
                    '). Verifique el ID en CONFIG_HISTORIAL_REVISIONES.ID_LIBRO y su permiso de edición. ' +
                    'Detalle: ' + e.message);
  }
}

/**
 * Normaliza el porcentaje a un número de 0 a 100.
 *
 * Los auditores lo entregan como número, pero una celda con formato de
 * porcentaje llega como fracción (0,85) y un resumen puede traerlo como texto
 * ("85%"). Guardar 0,85 donde se espera 85 hacía que el historial mostrara
 * casi cero avance.
 */
function normalizarPorcentaje_(valor) {
  if (valor === null || valor === undefined || valor === '') return null;

  let n;
  if (typeof valor === 'number') {
    n = valor;
  } else {
    const texto = valor.toString().trim().replace('%', '').replace(',', '.');
    if (!texto || isNaN(Number(texto))) return null;
    n = Number(texto);
  }
  if (isNaN(n)) return null;
  if (n > 0 && n <= 1) n = n * 100;      // fracción venida de una celda con formato
  return Math.round(n * 10) / 10;
}

/**
 * Registra una revisión en la hoja `HISTORIAL_REVISIONES`.
 *
 * @param {string} anexo       'Anexo 1', 'Anexo 3', 'Anexo 4'…
 * @param {number} porcentaje  Avance de 0 a 100.
 * @return {boolean} true si se registró.
 */
function registrarRevision(anexo, porcentaje) {
  const nombre = (anexo || '').toString().trim();
  if (!nombre) {
    Logger.log('registrarRevision(): se llamó sin nombre de anexo; no se registró nada.');
    return false;
  }

  const valor = normalizarPorcentaje_(porcentaje);
  if (valor === null) {
    // Registrar un cero inventado sería peor que no registrar: quedaría en el
    // historial como si la facultad hubiera retrocedido.
    Logger.log('registrarRevision(): "' + nombre + '" no trajo un porcentaje utilizable (' +
               porcentaje + '); no se registró nada.');
    return false;
  }

  const libro = libroDelHistorial_();
  let hoja = libro.getSheetByName(CONFIG_HISTORIAL_REVISIONES.HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(CONFIG_HISTORIAL_REVISIONES.HOJA);
    hoja.appendRow(CONFIG_HISTORIAL_REVISIONES.ENCABEZADOS);
    hoja.getRange(1, 1, 1, CONFIG_HISTORIAL_REVISIONES.ENCABEZADOS.length).setFontWeight('bold');
    hoja.setFrozenRows(1);
  }

  hoja.appendRow([new Date(), nombre, valor]);
  Logger.log('Historial: ' + nombre + ' registrado con ' + valor + '%.');
  return true;
}

/**
 * Historial completo, agrupado por momento de corrida, para el tablero.
 *
 * Cada grupo reúne los anexos revisados en la misma tanda. Las filas cuya fecha
 * no sea una fecha válida se descartan en vez de romper el agrupado.
 */
function historialParaJSON() {
  const libro = libroDelHistorial_();
  const hoja = libro.getSheetByName(CONFIG_HISTORIAL_REVISIONES.HOJA);
  if (!hoja) return [];

  const datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) return [];   // solo encabezados

  const grupos = {};
  for (let i = 1; i < datos.length; i++) {
    const fechaHora = datos[i][0];
    const anexo = datos[i][1];
    const porcentaje = datos[i][2];
    if (!(fechaHora instanceof Date) || isNaN(fechaHora.getTime())) continue;
    if (!anexo) continue;

    const clave = fechaHora.toISOString();
    if (!grupos[clave]) grupos[clave] = [];
    grupos[clave].push({ anexo: anexo, porcentaje: porcentaje });
  }

  return Object.keys(grupos).sort().map(function (iso, idx, arr) {
    return {
      etiqueta: idx === arr.length - 1 ? 'Revisión actual' : 'Revisión ' + (idx + 1),
      'fecha-hora': iso,
      revisiones: grupos[iso]
    };
  });
}

/**
 * Diagnóstico: dice si el historial es accesible y qué contiene. Útil cuando
 * falta el avance de algún anexo, para saber si el problema es el registro o el
 * auditor que nunca llegó a llamarlo.
 */
function revisarHistorial() {
  const libro = libroDelHistorial_();
  const hoja = libro.getSheetByName(CONFIG_HISTORIAL_REVISIONES.HOJA);
  if (!hoja) {
    Logger.log('El libro "' + libro.getName() + '" todavía no tiene la hoja ' +
               CONFIG_HISTORIAL_REVISIONES.HOJA + '. Se creará en el primer registro.');
    return [];
  }
  const datos = hoja.getDataRange().getValues();
  const porAnexo = {};
  for (let i = 1; i < datos.length; i++) {
    const anexo = (datos[i][1] || '(sin anexo)').toString();
    porAnexo[anexo] = (porAnexo[anexo] || 0) + 1;
  }
  const lineas = Object.keys(porAnexo).map(function (a) { return a + ': ' + porAnexo[a] + ' registro(s)'; });
  Logger.log('Historial en "' + libro.getName() + '" — ' + (datos.length - 1) + ' fila(s).\n' +
             (lineas.join('\n') || 'sin registros todavía'));
  return lineas;
}
