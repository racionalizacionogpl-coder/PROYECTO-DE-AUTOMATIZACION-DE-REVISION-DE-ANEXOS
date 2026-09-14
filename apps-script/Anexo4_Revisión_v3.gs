/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  REVISIÓN DE INDICADORES — ANEXO 4 (INDICADORES ESTANDARIZADOS)
 *  Oficina de Racionalización — OGPL (UNMSM)
 *
 *  VERSIÓN 2 — primera revisión real
 *  ─────────────────────────────────────────────────────────────────────────────
 *   La v1 era una plantilla con TODO. Esta versión ya revisa el libro
 *   `INDICADORES ESTANDARIZADOS`:
 *
 *    1. Lee la hoja «Resumen de Indicadores» —la tabla CÓDIGO · PROCESO · HOJA ·
 *       INDICADOR · ESTADO ACTUAL · PORCENTAJE · OBSERVACIÓN— localizando sus
 *       encabezados por nombre, no por posición.
 *    2. Comprueba que cada indicador declarado tenga su pestaña en el libro, y
 *       al revés: que no queden pestañas de indicador fuera del resumen.
 *    3. Revisa los campos obligatorios de cada fila y la coherencia entre el
 *       estado y el porcentaje.
 *    4. En las pestañas con formato de FICHA, revisa los campos de la ficha:
 *       identificación, objetivo, indicador y formalización.
 *    5. Recalcula el avance y lo contrasta con el «PROMEDIO TOTAL» y el «Total
 *       de Indicadores Aprobados» que la propia hoja muestra.
 *    6. Escribe el reporte en UNA hoja del libro de revisión —una fila por
 *       indicador, con sus observaciones en la propia fila— y registra el
 *       avance en el historial.
 *
 *   El Anexo 4 NO se modifica: solo se lee.
 *
 *  Uso
 *  ─────────────────────────────────────────────────────────────────────────────
 *   Menú «Auditoría OGPL › Ejecutar revisión del Anexo 4», o la función
 *   `ejecutarRevisionAnexo4` desde el editor.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const CONFIG_A4 = {

  /* ── Entradas ─────────────────────────────────────────────────────────── */

  /** Libro `INDICADORES ESTANDARIZADOS`. */
  SOURCE_SHEET_ID: '1jQFfBlMa92sxoF-XhJv24kz16HMiUFs392TI01HBZ1w',

  /** Libro donde se escribe el reporte, el mismo del Anexo 1 y del Anexo 3. */
  DESTINO_SHEET_ID: '1oYBAHp-Bd0V8un5hUAWdK1jKbcbdsROH4IOyM0MAmFk',

  /* ── Salida ───────────────────────────────────────────────────────────── */

  HOJAS: {
    RESUMEN: 'RESUMEN_EJECUTIVO_A4'
  },

  /**
   * Hojas que este script generó en versiones anteriores y ahora sobran. Se
   * borran al correr para que no queden datos viejos conviviendo con los
   * nuevos, que es peor que no tenerlos.
   */
  HOJAS_RETIRADAS: ['DETALLE_INDICADORES_A4'],

  FUENTE_REPORTE: 'Arial',

  /* ── Vocabulario de la hoja de resumen ────────────────────────────────── */

  /**
   * Encabezados de la tabla del resumen. Se buscan por nombre en cualquier
   * fila: la tabla no empieza en la fila 1 —arriba van el total de aprobados y
   * el título— y esa altura puede cambiar.
   */
  COLUMNAS_RESUMEN: [
    { campo: 'Código',     etiquetas: ['CODIGO', 'CÓDIGO'],                  obligatorio: true },
    { campo: 'Proceso',    etiquetas: ['PROCESO'],                           obligatorio: true },
    { campo: 'Hoja',       etiquetas: ['HOJA'],                              obligatorio: true },
    { campo: 'Indicador',  etiquetas: ['INDICADOR'],                         obligatorio: true },
    { campo: 'Estado',     etiquetas: ['ESTADO ACTUAL', 'ESTADO'],           obligatorio: true },
    { campo: 'Porcentaje', etiquetas: ['PORCENTAJE', '%'],                   obligatorio: true },
    { campo: 'Observación', etiquetas: ['OBSERVACION', 'OBSERVACIÓN'],       obligatorio: false }
  ],

  /**
   * Estados admitidos y el avance que corresponde a cada uno. El porcentaje de
   * la hoja se contrasta con este valor; si no coincide, se observa en lugar de
   * corregirlo, porque el dato de la hoja manda.
   */
  ESTADOS: [
    { estado: 'Aprobado',    porcentaje: 100 },
    { estado: 'Propuesto',   porcentaje: 25 },
    { estado: 'En revisión', porcentaje: 50 },
    { estado: 'Observado',   porcentaje: 50 }
  ],

  /** Filas de cierre de la tabla: no son indicadores. */
  FILAS_DE_CIERRE: ['PROMEDIO TOTAL', 'TOTAL', 'PROMEDIO'],

  /** Rótulo del recuento de aprobados que la hoja muestra arriba. */
  ETIQUETA_APROBADOS: 'TOTAL DE INDICADORES APROBADOS',

  /* ── Campos de la ficha de indicador ──────────────────────────────────── */

  /**
   * Las pestañas de indicador tienen dos formatos: unas son FICHA de indicador
   * y otras son HOJA DE REPORTE. Solo a las primeras se les exigen estos
   * campos; a las segundas se las identifica y se informa, sin exigirles una
   * estructura que no tienen.
   */
  MARCA_FICHA: ['PROPUESTA DE INDICADOR DEL PROCESO NIVEL 0', 'FICHA DE INDICADOR'],
  MARCA_REPORTE: ['INFORMACION GENERAL DEL PERIODO', '1. INFORMACION GENERAL DEL PERIODO'],

  CAMPOS_FICHA: [
    { campo: 'Nombre del proceso', etiquetas: ['NOMBRE DEL PROCESO'] },
    { campo: 'Subproceso',         etiquetas: ['SUBPROCESO'] },
    { campo: 'Responsable',        etiquetas: ['RESPONSABLE DEL PROCESOS', 'RESPONSABLE DEL PROCESO', 'RESPONSABLE'] },
    { campo: 'Código',             etiquetas: ['CODIGO'] },
    { campo: 'Nombre del indicador', etiquetas: ['NOMBRE'] },
    { campo: 'Frecuencia',         etiquetas: ['FRECUENCIA DE MEDIDA', 'FRECUENCIA'] },
    { campo: 'Fórmula',            etiquetas: ['FORMULA'] },
    { campo: 'Variables',          etiquetas: ['VARIABLES'] }
  ],

  VALORES_NULOS: ['NINGUNO', 'NINGUNA', 'N/A', 'NA', 'NO APLICA', 'SIN DATO',
                  '-', '--', '---', '.', 'PENDIENTE', 'POR DEFINIR', 'TODO'],

  /* ── Semáforo ─────────────────────────────────────────────────────────── */

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

function normalizarA4_(txt) {
  return (txt === null || txt === undefined ? '' : txt).toString().trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').replace(/[:.]+$/, '');
}

function esVacioA4_(valor) {
  const t = (valor === null || valor === undefined ? '' : valor).toString().trim();
  if (!t) return true;
  const n = normalizarA4_(t);
  return CONFIG_A4.VALORES_NULOS.some(function (v) { return normalizarA4_(v) === n; });
}

function recortarA4_(txt, largo) {
  const t = (txt === null || txt === undefined ? '' : txt).toString().trim().replace(/\s+/g, ' ');
  const max = largo || 120;
  return t.length > max ? t.substring(0, max - 3) + '...' : t;
}

/** Porcentaje a número 0–100, venga como 25, "25%", "25 %" o 0,25. */
function porcentajeA4_(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  let n;
  if (typeof valor === 'number') {
    n = valor;
  } else {
    const t = valor.toString().trim().replace('%', '').replace(',', '.');
    if (!t || isNaN(Number(t))) return null;
    n = Number(t);
  }
  if (isNaN(n)) return null;
  if (n > 0 && n <= 1) n = n * 100;
  return Math.round(n * 10) / 10;
}

/** Avance que corresponde a un estado, o null si el estado no está declarado. */
function porcentajeDelEstado_(estado) {
  const n = normalizarA4_(estado);
  let encontrado = null;
  CONFIG_A4.ESTADOS.forEach(function (e) {
    if (normalizarA4_(e.estado) === n) encontrado = e.porcentaje;
  });
  return encontrado;
}

function esFilaDeCierre_(valor) {
  const n = normalizarA4_(valor);
  return CONFIG_A4.FILAS_DE_CIERRE.some(function (t) { return normalizarA4_(t) === n; });
}

/* ═══════════════════════════════════════════════════════════════════════════
   LECTURA DE LA HOJA DE RESUMEN
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Localiza la tabla del resumen y devuelve sus indicadores.
 *
 * La tabla no empieza en la fila 1: arriba van el recuento de aprobados y el
 * título, y abajo cierra con «PROMEDIO TOTAL». Se busca la fila de encabezados
 * por sus nombres, de modo que agregar o quitar filas de adorno no rompa nada.
 */
function leerResumenA4_(valores) {
  const salida = { filaEncabezado: -1, columnas: {}, indicadores: [],
                   promedioDeclarado: null, aprobadosDeclarados: null };
  if (!valores || !valores.length) return salida;

  for (let f = 0; f < valores.length && salida.filaEncabezado === -1; f++) {
    const encontradas = {};
    CONFIG_A4.COLUMNAS_RESUMEN.forEach(function (col) {
      for (let c = 0; c < valores[f].length; c++) {
        const n = normalizarA4_(valores[f][c]);
        if (encontradas[col.campo] === undefined &&
            col.etiquetas.some(function (e) { return normalizarA4_(e) === n; })) {
          encontradas[col.campo] = c;
        }
      }
    });
    // Con cuatro columnas reconocidas ya es la fila de encabezados: así se
    // tolera que alguna cambie de nombre.
    if (Object.keys(encontradas).length >= 4) {
      salida.filaEncabezado = f;
      salida.columnas = encontradas;
    }
  }
  if (salida.filaEncabezado === -1) return salida;

  const col = salida.columnas;
  for (let f = 0; f < valores.length; f++) {
    const fila = valores[f];

    // Recuento de aprobados y promedio, estén donde estén.
    for (let c = 0; c < fila.length; c++) {
      const n = normalizarA4_(fila[c]);
      if (n === normalizarA4_(CONFIG_A4.ETIQUETA_APROBADOS) && salida.aprobadosDeclarados === null) {
        const v = porcentajeA4_(fila[c + 1]);
        salida.aprobadosDeclarados = (v === null ? null : Math.round(v));
      }
      if (esFilaDeCierre_(n) && salida.promedioDeclarado === null) {
        for (let k = c + 1; k < fila.length; k++) {
          const p = porcentajeA4_(fila[k]);
          if (p !== null) { salida.promedioDeclarado = p; break; }
        }
      }
    }

    if (f <= salida.filaEncabezado) continue;
    if (fila.every(function (v) { return esVacioA4_(v); })) continue;
    if (fila.some(function (v) { return esFilaDeCierre_(v); })) continue;

    const leer = function (campo) {
      const c = col[campo];
      return (c === undefined || c === null) ? '' : (fila[c] === undefined ? '' : fila[c]);
    };
    const codigo = leer('Código');
    const hoja = leer('Hoja');
    // Una fila sin código ni hoja no es un indicador: es separación o adorno.
    if (esVacioA4_(codigo) && esVacioA4_(hoja)) continue;

    salida.indicadores.push({
      fila: f + 1,
      codigo: (codigo || '').toString().trim(),
      proceso: (leer('Proceso') || '').toString().trim(),
      hoja: (hoja || '').toString().trim(),
      indicador: (leer('Indicador') || '').toString().trim(),
      estado: (leer('Estado') || '').toString().trim(),
      porcentaje: porcentajeA4_(leer('Porcentaje')),
      observacion: (leer('Observación') || '').toString().trim()
    });
  }
  return salida;
}

/**
 * Revisa una fila del resumen. Devuelve los hallazgos, cada uno con su
 * severidad, sin tocar nada.
 */
function revisarIndicadorA4_(ind, nombresDeHojas) {
  const hallazgos = [];

  CONFIG_A4.COLUMNAS_RESUMEN.forEach(function (col) {
    if (!col.obligatorio) return;
    const valor = ind[{ 'Código': 'codigo', 'Proceso': 'proceso', 'Hoja': 'hoja',
                        'Indicador': 'indicador', 'Estado': 'estado',
                        'Porcentaje': 'porcentaje' }[col.campo]];
    const vacio = (col.campo === 'Porcentaje') ? (valor === null) : esVacioA4_(valor);
    if (vacio) {
      hallazgos.push({
        campo: col.campo, severidad: 'incompleto',
        observacion: 'Falta ' + col.campo.toLowerCase() + ' en la fila del resumen.'
      });
    }
  });

  // La pestaña declarada debe existir: sin ficha, el indicador no es revisable.
  if (!esVacioA4_(ind.hoja) && nombresDeHojas) {
    const existe = nombresDeHojas.some(function (n) {
      return normalizarA4_(n) === normalizarA4_(ind.hoja);
    });
    if (!existe) {
      hallazgos.push({
        campo: 'Hoja', severidad: 'critico',
        observacion: 'CRÍTICO: el resumen declara la pestaña "' + ind.hoja + '", que no existe ' +
                     'en el libro. El indicador no tiene ficha que revisar.'
      });
    }
  }

  // Estado dentro de lo previsto, y porcentaje coherente con él.
  if (!esVacioA4_(ind.estado)) {
    const esperado = porcentajeDelEstado_(ind.estado);
    if (esperado === null) {
      hallazgos.push({
        campo: 'Estado', severidad: 'observacion',
        observacion: 'Estado "' + ind.estado + '" no previsto. Estados admitidos: ' +
                     CONFIG_A4.ESTADOS.map(function (e) { return e.estado; }).join(', ') + '.'
      });
    } else if (ind.porcentaje !== null && ind.porcentaje !== esperado) {
      hallazgos.push({
        campo: 'Porcentaje', severidad: 'observacion',
        observacion: 'El estado "' + ind.estado + '" corresponde a ' + esperado + '% y la hoja ' +
                     'registra ' + ind.porcentaje + '%. Verifique cuál de los dos manda.'
      });
    }
  }

  if (ind.porcentaje !== null && (ind.porcentaje < 0 || ind.porcentaje > 100)) {
    hallazgos.push({
      campo: 'Porcentaje', severidad: 'observacion',
      observacion: 'El porcentaje ' + ind.porcentaje + '% está fuera del rango 0–100.'
    });
  }
  return hallazgos;
}

/* ═══════════════════════════════════════════════════════════════════════════
   REVISIÓN DE LA FICHA DE CADA INDICADOR
   ═══════════════════════════════════════════════════════════════════════════ */

/** ¿Qué formato tiene la pestaña: ficha de indicador, hoja de reporte u otro? */
function tipoDeHojaA4_(valores) {
  let texto = '';
  (valores || []).forEach(function (fila) {
    fila.forEach(function (c) { texto += ' ' + normalizarA4_(c); });
  });
  if (CONFIG_A4.MARCA_FICHA.some(function (m) { return texto.indexOf(normalizarA4_(m)) !== -1; })) {
    return 'ficha';
  }
  if (CONFIG_A4.MARCA_REPORTE.some(function (m) { return texto.indexOf(normalizarA4_(m)) !== -1; })) {
    return 'reporte';
  }
  return 'otro';
}

/**
 * Campos de una ficha de indicador.
 *
 * Las etiquetas aparecen de dos maneras: en su propia celda con el valor al
 * lado (`Nombre` | `Porcentaje de…`), o pegadas al valor en la misma celda
 * (`Nombre del Proceso: GESTIÓN ESTRATÉGICA`). Se admiten las dos.
 */
function revisarFichaA4_(valores) {
  const resultado = { campos: [], completos: 0, total: 0 };
  if (!valores || !valores.length) return resultado;

  CONFIG_A4.CAMPOS_FICHA.forEach(function (def) {
    resultado.total++;
    let valor = '';

    for (let f = 0; f < valores.length && !valor; f++) {
      for (let c = 0; c < valores[f].length && !valor; c++) {
        const celda = valores[f][c];
        if (esVacioA4_(celda) && celda !== 0) continue;
        const n = normalizarA4_(celda);

        // a) etiqueta y valor en la misma celda
        const pegada = def.etiquetas.filter(function (e) {
          const ne = normalizarA4_(e);
          return n.indexOf(ne + ':') === 0 || n.indexOf(ne + ' :') === 0;
        })[0];
        if (pegada) {
          const resto = celda.toString().split(':').slice(1).join(':').trim();
          if (!esVacioA4_(resto)) { valor = resto; break; }
        }

        // b) etiqueta sola, valor en una celda a la derecha
        if (def.etiquetas.some(function (e) { return normalizarA4_(e) === n; })) {
          for (let k = c + 1; k < valores[f].length; k++) {
            const vecina = valores[f][k];
            if (esVacioA4_(vecina)) continue;
            if (normalizarA4_(vecina) === n) continue;    // celda combinada
            valor = vecina.toString().trim();
            break;
          }
        }
      }
    }

    if (valor) resultado.completos++;
    resultado.campos.push({ campo: def.campo, valor: recortarA4_(valor, 90), completo: !!valor });
  });
  return resultado;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEMÁFORO
   ═══════════════════════════════════════════════════════════════════════════ */

const ESCALA_A4 = ['correcto', 'incompleto', 'observacion', 'critico'];

function peorSeveridadA4_(a, b) {
  const ia = ESCALA_A4.indexOf(a);
  const ib = ESCALA_A4.indexOf(b);
  if (ia === -1) return b;
  if (ib === -1) return a;
  return ia >= ib ? a : b;
}

function estadoDelAvanceA4_(avance, criticos) {
  let tramo = CONFIG_A4.TRAMOS_AVANCE[CONFIG_A4.TRAMOS_AVANCE.length - 1];
  for (let i = 0; i < CONFIG_A4.TRAMOS_AVANCE.length; i++) {
    if (avance >= CONFIG_A4.TRAMOS_AVANCE[i].desde) { tramo = CONFIG_A4.TRAMOS_AVANCE[i]; break; }
  }
  if (!criticos) return { clave: tramo.clave, rotulo: tramo.rotulo };
  const clave = peorSeveridadA4_(tramo.clave, 'observacion');
  return {
    clave: clave,
    rotulo: (clave === tramo.clave ? tramo.rotulo : 'En proceso') +
            ' — ' + criticos + ' hallazgo(s) crítico(s)'
  };
}

/** Avance del Anexo 4: promedio de los porcentajes declarados por indicador. */
function avanceGeneralAnexo4_(indicadores) {
  const con = (indicadores || []).filter(function (i) { return i.porcentaje !== null; });
  if (!con.length) return 0;
  const suma = con.reduce(function (a, i) { return a + i.porcentaje; }, 0);
  return Math.round((suma / con.length) * 10) / 10;
}

/* ═══════════════════════════════════════════════════════════════════════════
   ESCRITURA DEL REPORTE
   ═══════════════════════════════════════════════════════════════════════════ */

function escribirHojaA4_(ss, nombre, encabezados, filas, severidades) {
  let hoja = ss.getSheetByName(nombre);
  if (!hoja) hoja = ss.insertSheet(nombre);
  hoja.clear();

  const conSeveridad = !!severidades;
  const cabecera = conSeveridad ? encabezados.concat(['CLASIFICACIÓN']) : encabezados.slice();
  const cuerpo = filas.map(function (fila, i) {
    if (!conSeveridad) return fila;
    const clave = severidades[i] || 'correcto';
    return fila.concat([(CONFIG_A4.COLORES[clave] || CONFIG_A4.COLORES.correcto).rotulo]);
  });

  const datos = [cabecera].concat(cuerpo.length ? cuerpo : [cabecera.map(function () { return ''; })]);
  const ancho = cabecera.length;
  hoja.getRange(1, 1, datos.length, ancho).setValues(datos);
  hoja.getRange(1, 1, datos.length, ancho)
      .setFontFamily(CONFIG_A4.FUENTE_REPORTE).setVerticalAlignment('top').setWrap(true);
  hoja.getRange(1, 1, 1, ancho).setFontWeight('bold')
      .setFontColor('#ffffff').setBackground('#1f3864');
  hoja.setFrozenRows(1);

  if (conSeveridad && cuerpo.length) {
    let inicio = 0;
    for (let i = 1; i <= cuerpo.length; i++) {
      if (i < cuerpo.length && severidades[i] === severidades[inicio]) continue;
      const color = CONFIG_A4.COLORES[severidades[inicio]] || CONFIG_A4.COLORES.correcto;
      hoja.getRange(inicio + 2, 1, i - inicio, ancho)
          .setBackground(color.fondo).setFontColor(color.texto);
      inicio = i;
    }
  }
  for (let c = 1; c <= ancho; c++) hoja.setColumnWidth(c, c <= 2 ? 140 : 260);
  // `hoja.clear()` borra contenido y formato, pero NO el objeto Filter de la
  // hoja: si quedó uno de una corrida anterior, createFilter() revienta con
  // "No puedes crear un filtro en una hoja que ya tenga uno." Hay que quitarlo
  // primero.
  const filtroExistente = hoja.getFilter();
  if (filtroExistente) filtroExistente.remove();
  if (cuerpo.length) hoja.getRange(1, 1, cuerpo.length + 1, ancho).createFilter();
  return hoja;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUNTO DE ENTRADA
   ═══════════════════════════════════════════════════════════════════════════ */

function ejecutarRevisionAnexo4() {
  const libro = SpreadsheetApp.openById(CONFIG_A4.SOURCE_SHEET_ID);
  const hojas = libro.getSheets();
  const nombresDeHojas = hojas.map(function (h) { return h.getName(); });

  // El resumen es la primera pestaña que contenga la tabla de indicadores.
  let resumen = null;
  let hojaResumen = null;
  for (let i = 0; i < hojas.length && !hojaResumen; i++) {
    const leido = leerResumenA4_(hojas[i].getDataRange().getValues());
    if (leido.filaEncabezado !== -1 && leido.indicadores.length) {
      resumen = leido;
      hojaResumen = hojas[i];
    }
  }
  if (!hojaResumen) {
    throw new Error('No se encontró la tabla de indicadores en el Anexo 4. Se buscó una fila ' +
                    'con los encabezados CÓDIGO, PROCESO, HOJA, INDICADOR, ESTADO ACTUAL y ' +
                    'PORCENTAJE en las pestañas: ' + nombresDeHojas.join(', ') + '.');
  }

  const porIndicador = [];
  const severidadesHuerfanas = [];
  const filasHuerfanas = [];

  resumen.indicadores.forEach(function (ind) {
    const hallazgos = revisarIndicadorA4_(ind, nombresDeHojas);
    let severidad = 'correcto';
    hallazgos.forEach(function (h) { severidad = peorSeveridadA4_(severidad, h.severidad); });

    // Ficha del indicador, cuando su pestaña existe y tiene ese formato.
    let tipo = '—';
    let ficha = null;
    const hoja = hojas.filter(function (h) {
      return normalizarA4_(h.getName()) === normalizarA4_(ind.hoja);
    })[0];
    if (hoja) {
      const valores = hoja.getDataRange().getValues();
      tipo = tipoDeHojaA4_(valores);
      if (tipo === 'ficha') {
        ficha = revisarFichaA4_(valores);
        ficha.campos.forEach(function (campo) {
          if (campo.completo) return;
          hallazgos.push({
            campo: 'Ficha › ' + campo.campo, severidad: 'incompleto',
            observacion: 'La ficha del indicador no consigna ' + campo.campo.toLowerCase() + '.'
          });
          severidad = peorSeveridadA4_(severidad, 'incompleto');
        });
      }
    }

    porIndicador.push({
      ind: ind, severidad: severidad, tipo: tipo,
      camposFicha: ficha ? ficha.completos + ' de ' + ficha.total : '—',
      hallazgos: hallazgos
    });
  });

  // Pestañas de indicador que nadie declaró en el resumen.
  const declaradas = resumen.indicadores.map(function (i) { return normalizarA4_(i.hoja); });
  const huerfanas = nombresDeHojas.filter(function (n) {
    if (n === hojaResumen.getName()) return false;
    return declaradas.indexOf(normalizarA4_(n)) === -1;
  });
  huerfanas.forEach(function (n) {
    filasHuerfanas.push(['—', '—', n, '(pestaña no declarada en el resumen)', '—', '', '—', '—', 1,
                         'La pestaña "' + n + '" no figura en el resumen de indicadores. ' +
                         'Agréguela al resumen o retírela del libro.',
                         CONFIG_A4.COLORES.observacion.rotulo]);
    severidadesHuerfanas.push('observacion');
  });

  const avance = avanceGeneralAnexo4_(resumen.indicadores);
  const criticos = porIndicador.reduce(function (a, r) {
    return a + r.hallazgos.filter(function (h) { return h.severidad === 'critico'; }).length;
  }, 0);
  const aprobados = resumen.indicadores.filter(function (i) {
    return normalizarA4_(i.estado) === normalizarA4_('Aprobado');
  }).length;

  const notas = [];
  if (resumen.promedioDeclarado !== null && Math.abs(resumen.promedioDeclarado - avance) > 0.5) {
    notas.push('La hoja declara un promedio de ' + resumen.promedioDeclarado + '% y el recálculo ' +
               'da ' + avance + '%.');
  }
  if (resumen.aprobadosDeclarados !== null && resumen.aprobadosDeclarados !== aprobados) {
    notas.push('La hoja declara ' + resumen.aprobadosDeclarados + ' indicador(es) aprobado(s) y se ' +
               'contaron ' + aprobados + '.');
  }

  /* Hoja única — Resumen ejecutivo del Anexo 4.
   *
   * Una fila por indicador, con sus observaciones en la misma fila y una por
   * renglón: así el detalle no se pierde al juntar las dos hojas en una, y
   * sigue siendo posible filtrar por clasificación.
   */
  const filasResumen = porIndicador.map(function (r) {
    const observaciones = r.hallazgos.map(function (h) {
      return '• [' + h.campo + '] ' + h.observacion;
    }).join('\n') || 'Sin observaciones.';

    return [r.ind.codigo, r.ind.proceso, r.ind.hoja, recortarA4_(r.ind.indicador, 90),
            r.ind.estado, r.ind.porcentaje === null ? '—' : r.ind.porcentaje / 100,
            r.tipo === 'ficha' ? 'Ficha de indicador' :
              (r.tipo === 'reporte' ? 'Hoja de reporte' : 'Sin identificar'),
            r.camposFicha, r.hallazgos.length, observaciones,
            (CONFIG_A4.COLORES[r.severidad] || CONFIG_A4.COLORES.correcto).rotulo];
  });
  const severidades = porIndicador.map(function (r) { return r.severidad; });

  filasHuerfanas.forEach(function (f, i) {
    filasResumen.push(f);
    severidades.push(severidadesHuerfanas[i]);
  });

  const totalHallazgos = porIndicador.reduce(function (a, r) { return a + r.hallazgos.length; }, 0) +
                         filasHuerfanas.length;
  filasResumen.push(['TOTAL', 'Los ' + resumen.indicadores.length + ' indicadores', '', '', '',
                     avance / 100, '', '', totalHallazgos,
                     notas.length ? notas.join(' ') : 'Sin discrepancias con lo que declara la hoja.',
                     estadoDelAvanceA4_(avance, criticos).rotulo]);
  severidades.push(estadoDelAvanceA4_(avance, criticos).clave);

  const ss = SpreadsheetApp.openById(CONFIG_A4.DESTINO_SHEET_ID);
  const hojaResumenSalida = escribirHojaA4_(ss, CONFIG_A4.HOJAS.RESUMEN,
    ['CÓDIGO', 'PROCESO', 'PESTAÑA', 'INDICADOR', 'ESTADO', '% AVANCE', 'TIPO DE PESTAÑA',
     'CAMPOS DE LA FICHA', 'HALLAZGOS', 'OBSERVACIONES', 'ESTADO DE LA REVISIÓN'],
    filasResumen, severidades);
  if (filasResumen.length) {
    hojaResumenSalida.getRange(2, 6, filasResumen.length, 1).setNumberFormat('0.0%');
    hojaResumenSalida.getRange(filasResumen.length + 1, 1, 1, 12).setFontWeight('bold');
  }

  // Las hojas que este script dejó en versiones anteriores se retiran, para que
  // no queden datos viejos junto a los nuevos.
  CONFIG_A4.HOJAS_RETIRADAS.forEach(function (nombre) {
    const sobrante = ss.getSheetByName(nombre);
    if (sobrante && ss.getSheets().length > 1) {
      ss.deleteSheet(sobrante);
      Logger.log('Se retiró la hoja ' + nombre + ', que ya no forma parte del reporte.');
    }
  });

  ss.setActiveSheet(ss.getSheetByName(CONFIG_A4.HOJAS.RESUMEN));

  // Registro en el historial: protegido, como en los demás anexos.
  if (typeof registrarRevision === 'function') {
    try {
      registrarRevision('Anexo 4', avance);
    } catch (e) {
      Logger.log('No se pudo registrar el avance del Anexo 4 (' + avance + '%) en el historial: ' +
                 e.message);
    }
  } else {
    Logger.log('No se encontró la función registrarRevision(): el avance del Anexo 4 (' + avance +
               '%) no se registró. Falta el archivo HistorialRevisiones.gs en el proyecto.');
  }

  const mensaje = 'Revisión del Anexo 4 completada.\n\n' +
                  resumen.indicadores.length + ' indicador(es) revisado(s), ' +
                  aprobados + ' aprobado(s).\nAvance: ' + avance + '%.\n' +
                  (huerfanas.length ? huerfanas.length + ' pestaña(s) sin declarar en el resumen.\n' : '') +
                  (notas.length ? '\n' + notas.join('\n') : '');
  Logger.log(mensaje);
  notificarA4_(mensaje);
  return ss.getUrl();
}

/** Aviso al usuario cuando hay interfaz; al registro cuando no la hay. */
function notificarA4_(mensaje) {
  try {
    SpreadsheetApp.getUi().alert(mensaje);
  } catch (e) {
    Logger.log(mensaje);   // ejecución desde el editor o por disparador
  }
}
