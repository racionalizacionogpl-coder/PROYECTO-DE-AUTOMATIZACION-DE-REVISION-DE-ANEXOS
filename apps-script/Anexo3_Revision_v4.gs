/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  REVISIÓN INTERNA DE FICHAS TÉCNICAS — ANEXO 3 (PRODUCTO Y PROCESO)
 *  Oficina de Racionalización — OGPL (UNMSM)
 *
 *  VERSIÓN 4 — código de producto PADRE_F##-P##
 *  ─────────────────────────────────────────────────────────────────────────────
 *   · Salidas y Registros aceptan el código de producto del Anexo 1 v19:
 *     el código del proceso padre seguido de -P## (PE.01.01_F18-P01). Vale
 *     como el nivel del padre más uno, de modo que la exigencia de niveles y
 *     la excepción de nivel 2 no cambian. Un -P## en Definición o Procesos
 *     es error: ahí va un proceso.
 *   · Cotejo con el Anexo 1 durante la renumeración: si el código exacto no
 *     está, se traduce con la hoja EQUIVALENCIAS_CODIGOS que AutoAnexo1
 *     escribe en el Anexo 1 (anterior → nuevo); y si no figura ahí, se busca
 *     un producto con la misma denominación bajo el mismo proceso padre.
 *   · Facultades de nivel 2: FM, FDCP, FFB, FE, FMV, FCM y FIEE.
 *  ─────────────────────────────────────────────────────────────────────────────
 *  VERSIÓN 3 — integración con historial de revisiones
 *  ─────────────────────────────────────────────────────────────────────────────
 *   · El porcentaje general del Anexo 3 se calcula con los datos de la corrida,
 *     no leyendo la celda L22: esa celda devuelve la fracción 0,85 en vez de
 *     "85%" y su fila solo es la del TOTAL cuando hay exactamente 20 facultades.
 *   · La revisión no se cae si `registrarRevision()` no está en el proyecto.
 *   · El menú se arma igual desde el archivo del Anexo 1 o desde este, porque
 *     dos `onOpen` en un mismo proyecto se pisan.
 *  ─────────────────────────────────────────────────────────────────────────────
 *   · Las pestañas se detectan solas por su nombre `F##_SIGLA` (F01_FM,
 *     F02_FDCP, F03_FLCH…) sobre el libro activo. No hay que nombrar ninguna
 *     facultad ni duplicar funciones.
 *   · Toda ficha debe declarar al menos un producto final en "Salidas": si no
 *     tiene ninguno, es hallazgo CRÍTICO.
 *   · Los hallazgos se clasifican en cuatro niveles: Correcto, Incompleto,
 *     Observación y Crítico.
 *   · Se agrega la hoja RESUMEN_20_FACULTADES, una fila por facultad en el
 *     orden F01 → F20, con su semáforo de avance.
 *
 *  Qué hace
 *  ─────────────────────────────────────────────────────────────────────────────
 *   1. Recorre las pestañas de facultad del Anexo 3 (cada pestaña se lee de una
 *      sola vez; los datos originales NO se tocan).
 *   2. Parte cada pestaña en fichas técnicas y revisa las cuatro secciones:
 *      Descripción, Definición, Ejecución y Formalización.
 *   3. Valida la codificación de proveedores, entradas, procesos, salidas,
 *      beneficiarios y registros, y las 7 reglas obligatorias de consignación;
 *      además detecta códigos duplicados, códigos de otra facultad, fichas sin
 *      producto final y denominaciones inconsistentes.
 *   4. Coteja salidas y registros contra el Anexo 1.
 *   5. Crea un Google Sheets nuevo en la carpeta de salida con cuatro hojas:
 *      DETALLE_REVISION, RESUMEN_FICHAS, RESUMEN_20_FACULTADES y
 *      REGISTRO_MAESTRO_CODIGOS.
 *
 *  Uso
 *  ─────────────────────────────────────────────────────────────────────────────
 *   Extensiones › Apps Script sobre el propio Anexo 3, pegar este archivo y
 *   ejecutar `ejecutarRevisionAnexo3`. La configuración se puede editar aquí
 *   abajo o en una pestaña `CONFIG_A3` del propio Anexo 3 (columna A = clave,
 *   columna B = valor), que tiene prioridad sobre lo escrito en el código.
 *
 *  Especificación: reglas/ANEXO-3_reglas-v1.md
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const CONFIG_A3 = {

  /* ── Entradas ─────────────────────────────────────────────────────────── */

  /**
   * Anexo 3. Si el script está enlazado al propio Anexo 3 (Extensiones › Apps
   * Script desde dentro del archivo) se usa el libro ACTIVO y este ID solo
   * sirve de respaldo cuando se ejecuta desde un proyecto suelto.
   */
  SOURCE_SHEET_ID:  '1BYqg7p-8DoEJQGf_APxCZkieu6nrM1aPGPdXdblHyUI',

  /**
   * Pestañas a revisar. Vacío o null = TODAS las pestañas de facultad que se
   * detecten. Para revisar solo algunas, escribir sus siglas o sus nombres
   * separados por coma: "FDCP" o "F02_FDCP, F03_FLCH".
   */
  SOURCE_TAB_NAME:  '',

  /**
   * Libro donde se escribe el reporte: `4_REVISIÓN_INTERNA DE_AVANCES_ACTIVIDADES`,
   * el mismo donde el auditor del Anexo 1 deja sus hojas `*_A1`. Las hojas del
   * Anexo 3 llevan el sufijo `_A3`, así que conviven sin pisarse: cada corrida
   * reescribe solo las suyas.
   */
  DESTINO_SHEET_ID: '1oYBAHp-Bd0V8un5hUAWdK1jKbcbdsROH4IOyM0MAmFk',

  /** Anexo 1, para cotejar salidas y registros (reglas 5 y 7). */
  ANEXO1_SHEET_ID:  '1SUMuS32zUweN_o7WfdBhXq-ipvvaFXYTcxKF1hmhPww',
  /** Pestaña del Anexo 1; null = se localiza por la sigla de la facultad. */
  ANEXO1_TAB_NAME:  null,

  /* ── Facultad ─────────────────────────────────────────────────────────── */

  /** Sigla de la facultad revisada; null = se deduce del nombre de la pestaña. */
  FACULTAD_SIGLA: null,
  /**
   * Sufijo de formulario esperado en todos los códigos (`F02` para la FDCP);
   * null = se toma el sufijo dominante de la pestaña.
   */
  FORMULARIO: null,

  /**
   * Facultades que trabajan procesos y productos de NIVEL 2: su desagregado
   * llega a un nivel más (`PM.XX.YY.ZZ.AA_FWW`) y en el encabezado de una ficha
   * pueden convivir códigos de 2 y de 3 niveles. Se admite como excepción
   * válida, nunca como error.
   */
  /**
   * [v4] Hoja del Anexo 1 donde AutoAnexo1 anota cada código de producto que
   * renumera (anterior → nuevo). El cotejo la usa para reconocer los códigos
   * viejos que las fichas aún no actualizan.
   */
  HOJA_EQUIVALENCIAS_A1: 'EQUIVALENCIAS_CODIGOS',

  FACULTADES_NIVEL_2: ['FM', 'FDCP', 'FFB', 'FE', 'FMV', 'FCM', 'FIEE'],

  /* ── Salida ───────────────────────────────────────────────────────────── */


  HOJAS: {
    DETALLE:    'DETALLE_REVISION_A3',
    RESUMEN:    'RESUMEN_FICHAS_A3',
    RESUMEN_20: 'RESUMEN_EJECUTIVO_A3',
    MAESTRO:    'REGISTRO_MAESTRO_CODIGOS_A3'
  },

  /**
   * Hoja del Anexo 1 y del Anexo 3 que ya se dejaron de generar aquí: el
   * combinado de los dos anexos (RESUMEN_GENERAL) pasó a su propio script,
   * `ResumenGeneral.gs`, porque generarlo en cada corrida del Anexo 3
   * saturaba la revisión. Se deja el nombre anotado para quien busque el
   * cambio.
   */
  HOJAS_RETIRADAS: ['RESUMEN_GENERAL'],

  /**
   * Fuente con la que se escribe el archivo de salida. Es formato del reporte,
   * no un criterio de revisión: la fuente del Anexo 3 no se comprueba.
   */
  FUENTE_REPORTE: 'Arial',

  /**
   * Semáforo de las hojas de salida. Cada fila se pinta según su estado:
   * verde = correcto, ámbar = incompleto o por verificar, rojo = con error.
   * El color va acompañado siempre de la columna ESTADO en texto, para que la
   * hoja siga leyéndose impresa en blanco y negro o por quien no distinga los
   * colores.
   */
  COLORES: {
    correcto:    { fondo: '#d9ead3', texto: '#274e13', rotulo: 'Correcto'    },
    incompleto:  { fondo: '#fff2cc', texto: '#7f6000', rotulo: 'Incompleto'  },
    observacion: { fondo: '#fce5cd', texto: '#7f3f00', rotulo: 'Observación' },
    critico:     { fondo: '#f4cccc', texto: '#990000', rotulo: 'Crítico'     },
    opcional:    { fondo: '#f3f3f3', texto: '#666666', rotulo: 'Opcional'    }
  },

  /**
   * Semáforo de avance de la hoja RESUMEN_20_FACULTADES. `desde` es el piso
   * inclusivo del tramo, en porcentaje.
   */
  TRAMOS_AVANCE: [
    { desde: 95, clave: 'correcto',    rotulo: 'Satisfactorio' },
    { desde: 80, clave: 'incompleto',  rotulo: 'Aceptable'     },
    { desde: 60, clave: 'observacion', rotulo: 'En proceso'    },
    { desde: 0,  clave: 'critico',     rotulo: 'Crítico'       }
  ],

  /** Productos finales que como mínimo debe declarar una ficha en "Salidas". */
  MIN_SALIDAS_POR_FICHA: 1,

  /**
   * Fichas técnicas que trae la plantilla de cada facultad. Es un dato
   * INFORMATIVO: hay facultades que no tienen los 16 procesos y su ficha
   * sobrante se eliminó (la FDCP trabaja con 15). Que falte una ficha no es
   * hallazgo; solo se informa en el resumen para que se vea de un vistazo
   * cuántas trae cada hoja. Poner null para no informarlo.
   */
  FICHAS_ESPERADAS: 16,
  /** Pestaña opcional de configuración dentro del propio Anexo 3. */
  TAB_CONFIG: 'CONFIG_A3',

  /**
   * Nombre de una pestaña de facultad: `F##_SIGLA` (F01_FM, F02_FDCP…). El
   * número manda sobre el catálogo: es el formulario que deben llevar todos los
   * códigos de esa pestaña, y también el orden del reporte.
   */
  REGEX_PESTANA_FACULTAD: /^\s*F(\d{2})\s*[_\-. ]\s*([A-ZÑ]{2,8})\s*$/i,

  /* ── Vocabulario de la ficha ──────────────────────────────────────────── */

  ETIQUETAS: {
    TITULO_FICHA:  ['FICHA TECNICA DE PRODUCTO Y PROCESO'],
    SEC_DESCRIPCION: ['DESCRIPCION DEL PROCESO'],
    SEC_DEFINICION:  ['DEFINICION DEL PROCESO', 'DEFINICION DEL PROCESO:'],
    SEC_EJECUCION:   ['EJECUCION DEL PROCESO'],
    SEC_FORMALIZACION: ['FORMALIZACION DEL PROCESO']
  },

  /** Campos de "Definición del Proceso". */
  CAMPOS_DEFINICION: [
    { campo: 'Nombre',      etiquetas: ['NOMBRE'] },
    { campo: 'Responsable', etiquetas: ['RESPONSABLE'] },
    { campo: 'Alcance',     etiquetas: ['ALCANCE'] },
    { campo: 'Vinculación', etiquetas: ['VINCULACION'] },
    { campo: 'Objetivo',    etiquetas: ['OBJETIVO'] },
    { campo: 'Código',      etiquetas: ['CODIGO'], codigo: 'PROCESO_N1' },
    { campo: 'Tipo',        etiquetas: ['TIPO'] },
    { campo: 'Versión',     etiquetas: ['VERSION'] }
  ],

  /**
   * Campos de "Ejecución del Proceso". Las pestañas escriben la etiqueta de
   * recursos partida en dos celdas ("RECURSOS" | "HUMANOS") y con nombres que
   * varían entre facultades, así que se admite más de una forma.
   */
  CAMPOS_EJECUCION: [
    { campo: 'Recursos Humanos',      etiquetas: ['HUMANOS', 'RECURSOS HUMANOS'] },
    { campo: 'Recursos Físicos',      etiquetas: ['FISICOS', 'RECURSOS FISICOS'] },
    { campo: 'Equipos Tecnológicos',  etiquetas: ['TECNOLOGICOS', 'EQUIPOS TECNOLOGICOS', 'RECURSOS TECNOLOGICOS'] },
    { campo: 'Sistemas Informáticos', etiquetas: ['INFORMATICOS', 'SISTEMAS INFORMATICOS', 'RECURSOS INFORMATICOS'] },
    { campo: 'Registros',             etiquetas: ['REGISTROS'], codigo: 'REGISTRO' },
    { campo: 'Riesgos',               etiquetas: ['RIESGOS'] },
    { campo: 'Indicadores',           etiquetas: ['INDICADORES'] },
    { campo: 'Controles',             etiquetas: ['CONTROLES'] }
  ],

  /** Columnas de "Descripción del Proceso": etiqueta del encabezado y código. */
  COLUMNAS_DESCRIPCION: [
    { campo: 'Proveedores',   etiquetas: ['PROVEEDORES', 'PROVEEDOR'], codigo: 'PR', columna: 'B' },
    { campo: 'Entradas',      etiquetas: ['ENTRADAS', 'ENTRADA'],      codigo: 'EN', columna: 'D' },
    { campo: 'Procesos',      etiquetas: ['PROCESO', 'PROCESOS'],      codigo: 'PROCESO_N2', columna: 'F' },
    { campo: 'Salidas',       etiquetas: ['SALIDAS', 'SALIDA'],        codigo: 'SALIDA', columna: 'H' },
    { campo: 'Beneficiarios', etiquetas: ['BENEFICIARIOS', 'BENEFICIARIO'], codigo: 'BE', columna: 'J' }
  ],

  /** Filas de "Formalización del Proceso". La firma es una foto: es opcional. */
  BLOQUES_FORMALIZACION: ['ELABORACION', 'REVISION'],
  CAMPOS_FORMALIZACION: [
    { campo: 'Unidad',            etiquetas: ['UNIDAD'],             obligatorio: true },
    { campo: 'Cargo',             etiquetas: ['CARGO'],              obligatorio: true },
    { campo: 'Nombre y Apellido', etiquetas: ['NOMBRE Y APELLIDOS', 'NOMBRE Y APELLIDO'], obligatorio: true },
    { campo: 'Firma',             etiquetas: ['FIRMA'],              obligatorio: false }
  ],

  VALORES_NULOS: [
    'NINGUNO', 'NINGUNA', 'NINGUN', 'N/A', 'NA', 'N.A.', 'NO APLICA',
    'NO APLICABLE', 'SIN DATO', 'SIN DATOS', '-', '--', '---', '.', 'X',
    'PENDIENTE', 'POR DEFINIR', 'POR COMPLETAR'
  ],

  /** Facultades: sigla ↔ formulario oficial, igual que en el Anexo 1. */
  FACULTADES: [
    { sigla: 'FM',     formulario: 'F01', nombre: 'FACULTAD DE MEDICINA' },
    { sigla: 'FDCP',   formulario: 'F02', nombre: 'FACULTAD DE DERECHO Y CIENCIA POLÍTICA' },
    { sigla: 'FLCH',   formulario: 'F03', nombre: 'FACULTAD DE LETRAS Y CIENCIAS HUMANAS' },
    { sigla: 'FFB',    formulario: 'F04', nombre: 'FACULTAD DE FARMACIA Y BIOQUÍMICA' },
    { sigla: 'FO',     formulario: 'F05', nombre: 'FACULTAD DE ODONTOLOGÍA' },
    { sigla: 'FE',     formulario: 'F06', nombre: 'FACULTAD DE EDUCACIÓN' },
    { sigla: 'FQIQ',   formulario: 'F07', nombre: 'FACULTAD DE QUÍMICA E INGENIERÍA QUÍMICA' },
    { sigla: 'FMV',    formulario: 'F08', nombre: 'FACULTAD DE MEDICINA VETERINARIA' },
    { sigla: 'FCA',    formulario: 'F09', nombre: 'FACULTAD DE CIENCIAS ADMINISTRATIVAS' },
    { sigla: 'FCB',    formulario: 'F10', nombre: 'FACULTAD DE CIENCIAS BIOLÓGICAS' },
    { sigla: 'FCC',    formulario: 'F11', nombre: 'FACULTAD DE CIENCIAS CONTABLES' },
    { sigla: 'FCE',    formulario: 'F12', nombre: 'FACULTAD DE CIENCIAS ECONÓMICAS' },
    { sigla: 'FCF',    formulario: 'F13', nombre: 'FACULTAD DE CIENCIAS FÍSICAS' },
    { sigla: 'FCM',    formulario: 'F14', nombre: 'FACULTAD DE CIENCIAS MATEMÁTICAS' },
    { sigla: 'FCCSS',  formulario: 'F15', nombre: 'FACULTAD DE CIENCIAS SOCIALES' },
    { sigla: 'FIGMMG', formulario: 'F16', nombre: 'FACULTAD DE INGENIERÍA GEOLÓGICA, MINERA, METALÚRGICA Y GEOGRÁFICA' },
    { sigla: 'FII',    formulario: 'F17', nombre: 'FACULTAD DE INGENIERÍA INDUSTRIAL' },
    { sigla: 'FPSIC',  formulario: 'F18', nombre: 'FACULTAD DE PSICOLOGÍA' },
    { sigla: 'FIEE',   formulario: 'F19', nombre: 'FACULTAD DE INGENIERÍA ELECTRÓNICA Y ELÉCTRICA' },
    { sigla: 'FISI',   formulario: 'F20', nombre: 'FACULTAD DE INGENIERÍA DE SISTEMAS E INFORMÁTICA' }
  ]
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXPRESIONES REGULARES DE CODIFICACIÓN
   ═══════════════════════════════════════════════════════════════════════════ */

/** `PR.01_F02`, `EN.196_F02`, `BE.07_F02` — correlativo de 1 a 3 dígitos. */
const REGEX_SIMPLE_A3 = /^(PR|EN|BE)\.(\d{1,3})_F(\d{2})$/;

/**
 * `PE.01_F02`, `PM.01.03.02_F02`, `PM.01.01.02.05_F02` y, desde la v4, el
 * producto `PM.01.03_F02-P05` (grupo 4: número de producto).
 */
const REGEX_PROCESO_A3 = /^(PE|PM|PS)((?:\.\d{1,3})+)_F(\d{2})(?:-P(\d{1,3}))?$/;

/** Barrido de códigos dentro de una celda con varios códigos y su denominación. */
const REGEX_BARRIDO_A3 = /\b(PR|EN|BE|PE|PM|PS)((?:\.\d{1,3})+)(?:[_\-.]\s?[Ff]?\d{1,2})?(?:\s?-\s?[Pp]\d{1,3})?/g;

/* ═══════════════════════════════════════════════════════════════════════════
   UTILIDADES DE TEXTO
   ═══════════════════════════════════════════════════════════════════════════ */

function normalizar_(txt) {
  return (txt === null || txt === undefined ? '' : txt).toString().trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').replace(/[:.]+$/, '');
}

/**
 * Forma canónica de una denominación, para comparar la del Anexo 3 con la del
 * Anexo 1. Se ignoran comillas, guiones y puntuación: `PLAN ESTRATÉGICO "FM"` y
 * `PLAN ESTRATEGICO FM` son el mismo producto escrito de dos maneras, y
 * marcarlos como distintos solo genera ruido.
 */
function claveDenominacion_(txt) {
  return normalizar_(txt).replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizarCodigoA3_(txt) {
  return (txt === null || txt === undefined ? '' : txt).toString().trim().toUpperCase()
    .replace(/\s+/g, '').replace(/[–—]/g, '-');
}

function esVacio_(valor) {
  const t = (valor === null || valor === undefined ? '' : valor).toString().trim();
  if (!t) return true;
  const n = normalizar_(t);
  return CONFIG_A3.VALORES_NULOS.some(function (v) { return normalizar_(v) === n; });
}

function recortarA3_(txt, largo) {
  const t = (txt === null || txt === undefined ? '' : txt).toString().trim().replace(/\s+/g, ' ');
  const max = largo || 120;
  return t.length > max ? t.substring(0, max - 3) + '...' : t;
}

/** ¿La celda es exactamente una de las etiquetas dadas? */
function esEtiqueta_(valor, etiquetas) {
  const n = normalizar_(valor);
  if (!n) return false;
  return etiquetas.some(function (e) { return normalizar_(e) === n; });
}

/* ═══════════════════════════════════════════════════════════════════════════
   VALIDADORES DE CODIFICACIÓN  (funciones puras — cubiertas por las pruebas)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Número de grupos numéricos de un código de proceso: `PM.01.03` → 2. */
function nivelDeCodigo_(codigo) {
  const m = REGEX_PROCESO_A3.exec(normalizarCodigoA3_(codigo));
  // [v4] Un producto -P## vale como el nivel de su padre más uno.
  return m ? m[2].split('.').filter(String).length + (m[4] ? 1 : 0) : 0;
}

/**
 * [v4] Proceso padre de un código de producto, en cualquiera de los dos
 * formatos: `PM.01.03_F02-P05` → `PM.01.03`; `PM.01.03.05_F02` → `PM.01.03`.
 */
function padreDeProductoA3_(codigo) {
  const m = REGEX_PROCESO_A3.exec(normalizarCodigoA3_(codigo));
  if (!m) return null;
  if (m[4]) return m[1] + m[2];
  const tramos = m[2].split('.').filter(String);
  return tramos.length > 1 ? m[1] + '.' + tramos.slice(0, -1).join('.') : null;
}

/**
 * Extrae los códigos presentes en una celda. Devuelve el código tal cual se
 * escribió, sin la denominación que lo acompaña.
 */
function extraerCodigosA3_(celda) {
  const texto = (celda === null || celda === undefined ? '' : celda).toString();
  const encontrados = [];
  let m;
  REGEX_BARRIDO_A3.lastIndex = 0;
  while ((m = REGEX_BARRIDO_A3.exec(texto)) !== null) {
    encontrados.push(normalizarCodigoA3_(m[0]));
  }
  return encontrados;
}

/**
 * Denominación que acompaña a un código dentro de una celda: lo que queda tras
 * quitar todos los códigos.
 */
function denominacionDeA3_(celda) {
  return (celda === null || celda === undefined ? '' : celda).toString()
    .replace(REGEX_BARRIDO_A3, ' ')
    .replace(/[\s\-–—:;,.]+/g, ' ')
    .trim();
}

/** Quita la viñeta y la puntuación con que suelen abrir las denominaciones. */
function limpiarDenominacion_(txt) {
  return (txt === null || txt === undefined ? '' : txt).toString()
    .replace(/^[\s\-–—•*.,;:]+/, '').replace(/[\s.;,]+$/, '').replace(/\s+/g, ' ').trim();
}

/**
 * Empareja cada código con SU denominación dentro de un par de celdas.
 *
 * Las celdas de proveedores, entradas, salidas y beneficiarios traen varios
 * códigos, uno por línea, y la celda contigua trae las denominaciones también
 * una por línea:
 *
 *     BE.15_F02      - DOCENTES DE LA FACULTAD
 *     BE.16_F02      - ESTUDIANTES DE PREGRADO
 *     BE.17_F02      - EGRESADOS
 *
 * Atribuir a los tres códigos el texto entero de la celda —como se hacía
 * antes— hacía creer que un mismo nombre estaba repartido entre varios códigos
 * y disparaba cientos de inconsistencias falsas. Aquí se emparejan por
 * posición: la línea 1 con la línea 1, la 2 con la 2.
 *
 * Cuando los conteos no coinciden no se adivina: el código se queda sin
 * denominación y simplemente no participa de la comprobación de consistencia.
 * Es preferible no comprobar a comprobar mal.
 */
function emparejarCodigosYDenominaciones_(celdaCodigos, celdaDenominaciones) {
  const lineas = (celdaCodigos === null || celdaCodigos === undefined ? '' : celdaCodigos)
    .toString().split(/[\r\n]+/).map(function (t) { return t.trim(); }).filter(String);

  const pares = [];
  let faltanDenominaciones = false;
  lineas.forEach(function (linea) {
    const codigos = extraerCodigosA3_(linea);
    // La denominación pegada al código en la misma línea siempre gana.
    const pegada = limpiarDenominacion_(denominacionDeA3_(linea));
    codigos.forEach(function (codigo, i) {
      const denominacion = (codigos.length === 1 ? pegada : '');
      if (!denominacion) faltanDenominaciones = true;
      pares.push({ codigo: codigo, denominacion: denominacion });
    });
  });
  if (!pares.length || !faltanDenominaciones) return pares;

  const denominaciones = (celdaDenominaciones === null || celdaDenominaciones === undefined
      ? '' : celdaDenominaciones)
    .toString().split(/[\r\n]+/).map(limpiarDenominacion_).filter(String);

  // Solo se emparejan cuando hay tantas denominaciones como códigos: cualquier
  // otra proporción sería una suposición.
  if (denominaciones.length === pares.length) {
    pares.forEach(function (par, i) { if (!par.denominacion) par.denominacion = denominaciones[i]; });
  }
  return pares;
}

/** Niveles de código admitidos para cada tipo de campo. */
function nivelesEsperados_(tipo, permiteNivel2) {
  switch (tipo) {
    // La Definición exige siempre dos niveles de código (`PE.XX_FYY`), sin el
    // desagregado de salidas, también en las facultades de nivel 2.
    case 'PROCESO_N1': return [1];                            // Definición › Código
    case 'PROCESO_N2': return permiteNivel2 ? [2, 3] : [2];   // Descripción › Procesos
    case 'SALIDA':     return permiteNivel2 ? [3, 4] : [3];   // Descripción › Salidas
    case 'REGISTRO':   return permiteNivel2 ? [3, 4] : [3];   // Ejecución › Registros
    default:           return [];
  }
}

/**
 * Valida un código suelto contra el tipo de campo que lo contiene.
 *
 * Devuelve `{ ok, motivo, correccion, excepcionNivel2 }`. `excepcionNivel2`
 * marca los casos que la FDCP puede tener por trabajar a nivel 2 y que, por
 * tanto, no se cuentan como error.
 */
function validarCodigoA3_(codigo, tipo, formulario, permiteNivel2) {
  const c = normalizarCodigoA3_(codigo);
  if (!c) return { ok: false, motivo: 'Sin código.', correccion: 'Consigne el código correspondiente.' };

  if (tipo === 'PR' || tipo === 'EN' || tipo === 'BE') {
    const m = REGEX_SIMPLE_A3.exec(c);
    if (!m) {
      return {
        ok: false,
        motivo: 'El código "' + c + '" no sigue la estructura ' + tipo + '.XX_FYY.',
        correccion: 'Escríbalo como ' + tipo + '.01_' + (formulario || 'F##') +
                    ' seguido de la denominación, sin espacios dentro del código.'
      };
    }
    if (m[1] !== tipo) {
      return {
        ok: false,
        motivo: 'Prefijo "' + m[1] + '" en un campo de tipo ' + tipo + '.',
        correccion: 'Use el prefijo ' + tipo + ' que corresponde a esta columna.'
      };
    }
    if (formulario && 'F' + m[3] !== formulario) {
      return {
        ok: false,
        motivo: 'Sufijo de formulario "F' + m[3] + '" distinto del de la facultad (' + formulario + ').',
        correccion: 'Reemplace el sufijo por ' + formulario + '.'
      };
    }
    return { ok: true };
  }

  const m = REGEX_PROCESO_A3.exec(c);
  if (!m) {
    return {
      ok: false,
      motivo: 'El código "' + c + '" no sigue la estructura PE|PM|PS.##…_FYY.',
      correccion: 'Escríbalo con prefijo PE, PM o PS, los grupos numéricos separados por punto ' +
                  'y el sufijo ' + (formulario || 'F##') + '.'
    };
  }
  if (formulario && 'F' + m[3] !== formulario) {
    return {
      ok: false,
      motivo: 'Sufijo de formulario "F' + m[3] + '" distinto del de la facultad (' + formulario + ').',
      correccion: 'Reemplace el sufijo por ' + formulario + '.'
    };
  }

  const tramos = m[2].split('.').filter(String).length;
  const esProducto = !!m[4];
  if (esProducto && tipo !== 'SALIDA' && tipo !== 'REGISTRO') {
    return {
      ok: false,
      motivo: 'El código "' + c + '" es de un producto (-P' + m[4] + '); este campo lleva un proceso.',
      correccion: 'Use el código del proceso, sin el sufijo -P##.'
    };
  }
  const nivel = tramos + (esProducto ? 1 : 0);
  const esperados = nivelesEsperados_(tipo, permiteNivel2);
  // [v4] Un producto puede colgar directamente del proceso de nivel 0 cuando
  // ese proceso no tiene subprocesos, igual que en el Anexo 1.
  if (esProducto && tramos === 1) return { ok: true };
  if (esperados.indexOf(nivel) === -1) {
    return {
      ok: false,
      motivo: 'El código "' + c + '" tiene ' + nivel + ' nivel(es); este campo exige ' +
              esperados.join(' o ') + '.',
      correccion: 'Ajuste la profundidad del código al nivel que corresponde al campo.'
    };
  }
  // El nivel adicional que solo tienen las facultades de nivel 2 es excepción
  // válida: se deja anotado, nunca como error.
  if (permiteNivel2 && nivelesEsperados_(tipo, false).indexOf(nivel) === -1) {
    return { ok: true, excepcionNivel2: true,
             motivo: 'Código de ' + nivel + ' niveles admitido por tratarse de una facultad ' +
                     'que trabaja procesos y productos de nivel 2.' };
  }
  return { ok: true };
}

/**
 * Valida el contenido completo de una celda: puede traer varios códigos
 * (permitido en salidas, registros y beneficiarios) y su denominación.
 *
 * `unicoPorCelda` aplica la regla 4: un proceso por celda.
 */
function validarCeldaA3_(celda, tipo, formulario, permiteNivel2, unicoPorCelda) {
  const texto = (celda === null || celda === undefined ? '' : celda).toString();
  const res = { codigos: [], errores: [], notas: [], vacio: esVacio_(texto) };
  if (res.vacio) return res;

  const codigos = extraerCodigosA3_(texto);
  if (!codigos.length) {
    res.errores.push({
      motivo: 'La celda no contiene ningún código reconocible.',
      correccion: 'Anteponga la codificación correspondiente a la denominación.'
    });
    return res;
  }
  if (unicoPorCelda && codigos.length > 1) {
    res.errores.push({
      motivo: 'La celda agrupa ' + codigos.length + ' códigos (' + codigos.join(', ') + ').',
      correccion: 'Regla 4: registre un proceso por celda, sin combinar ni agrupar.'
    });
  }
  codigos.forEach(function (c) {
    const v = validarCodigoA3_(c, tipo, formulario, permiteNivel2);
    if (!v.ok) res.errores.push({ codigo: c, motivo: v.motivo, correccion: v.correccion });
    else if (v.excepcionNivel2) res.notas.push({ codigo: c, motivo: v.motivo });
    res.codigos.push(c);
  });
  return res;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOCALIZACIÓN DE FACULTAD Y PESTAÑAS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Lee el nombre de una pestaña de facultad. Devuelve
 * `{ codigo: 'F02', orden: 2, sigla: 'FDCP', pestana }` o null si el nombre no
 * corresponde a una facultad (DASHBOARD, CONFIG_A3, hojas sueltas…).
 *
 * El número del nombre manda: es el formulario que deben llevar los códigos de
 * esa pestaña y el orden en que la facultad aparece en el reporte. Así el
 * script no depende de ningún catálogo para saber qué revisar.
 */
function leerPestanaFacultad_(nombrePestana) {
  const m = CONFIG_A3.REGEX_PESTANA_FACULTAD.exec((nombrePestana || '').toString());
  if (!m) return null;
  const sigla = m[2].toUpperCase();
  const ficha = facultadPorSigla_(sigla);
  return {
    pestana: nombrePestana,
    codigo: 'F' + m[1],
    orden: parseInt(m[1], 10),
    sigla: sigla,
    nombre: ficha ? ficha.nombre : ''
  };
}

/**
 * Pestañas de facultad del libro, en el orden F01 → F20 que pide el reporte,
 * no en el orden físico de las pestañas.
 */
function localizarFacultades_(libro) {
  const encontradas = [];
  libro.getSheets().forEach(function (hoja) {
    const f = leerPestanaFacultad_(hoja.getName());
    if (f) { f.hoja = hoja; encontradas.push(f); }
  });
  encontradas.sort(function (a, b) {
    return a.orden !== b.orden ? a.orden - b.orden : a.sigla.localeCompare(b.sigla);
  });
  return encontradas;
}

/**
 * Filtra las facultades detectadas por lo que pida `SOURCE_TAB_NAME`: vacío =
 * todas; si trae texto, se admiten siglas o nombres de pestaña separados por
 * coma.
 */
function filtrarFacultades_(facultades, filtro) {
  const texto = (filtro || '').toString().trim();
  if (!texto) return facultades;
  const pedidas = texto.split(',').map(function (t) { return normalizar_(t).replace(/[\s.\-_]/g, ''); })
                       .filter(String);
  return facultades.filter(function (f) {
    const nombre = normalizar_(f.pestana).replace(/[\s.\-_]/g, '');
    return pedidas.some(function (p) {
      return p === nombre || p === f.sigla || p === f.codigo || p === f.codigo + f.sigla;
    });
  });
}

/** Sigla de la facultad a partir del nombre de la pestaña ("2.FDCP" → FDCP). */
function siglaDePestana_(nombrePestana) {
  // El guion bajo NO es separador para \b (es carácter de palabra), así que se
  // normaliza a espacio antes de comparar: sin esto, "F02_FDCP" no coincidía
  // con ninguna sigla y la pestaña del Anexo 1 quedaba sin localizar.
  const n = normalizar_(nombrePestana)
    .replace(/[_\-.]+/g, ' ')
    .replace(/^\d+\s*/, '')
    .trim();
  let exacta = null;
  let contenida = null;
  CONFIG_A3.FACULTADES.forEach(function (f) {
    if (n === f.sigla) exacta = f.sigla;
    // Coincidencia por subcadena solo como respaldo, y siempre la más larga:
    // así "FCCSS" gana sobre "FCC" y "FMV" sobre "FM".
    else if (new RegExp('\\b' + f.sigla + '\\b').test(n) &&
             (!contenida || f.sigla.length > contenida.length)) contenida = f.sigla;
  });
  return exacta || contenida;
}

function facultadPorSigla_(sigla) {
  let encontrada = null;
  CONFIG_A3.FACULTADES.forEach(function (f) { if (f.sigla === sigla) encontrada = f; });
  return encontrada;
}

/** Sufijo `F##` que más se repite en la pestaña, para cuando no está declarado. */
function formularioDominante_(valores) {
  const cuenta = {};
  valores.forEach(function (fila) {
    fila.forEach(function (celda) {
      extraerCodigosA3_(celda).forEach(function (c) {
        const m = /_F(\d{2})$/.exec(c);
        if (m) cuenta['F' + m[1]] = (cuenta['F' + m[1]] || 0) + 1;
      });
    });
  });
  let mejor = null;
  Object.keys(cuenta).forEach(function (k) {
    if (!mejor || cuenta[k] > cuenta[mejor]) mejor = k;
  });
  return mejor;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PARSEO DE LA PESTAÑA EN FICHAS TÉCNICAS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ¿La fila abre una ficha técnica? Es la fila que lleva la etiqueta NOMBRE y,
 * más a la derecha, la etiqueta CODIGO. Se usa esta fila y no el título
 * "FICHA TÉCNICA DE PRODUCTO Y PROCESO" porque la primera ficha de la pestaña
 * suele venir sin título.
 */
function esInicioDeFicha_(fila) {
  let nombre = -1;
  for (let i = 0; i < fila.length; i++) {
    if (nombre === -1 && esEtiqueta_(fila[i], ['NOMBRE'])) nombre = i;
    else if (nombre !== -1 && esEtiqueta_(fila[i], ['CODIGO'])) return true;
  }
  return false;
}

/** Índices de fila (base 0) donde empieza cada ficha técnica de la pestaña. */
function localizarFichas_(valores) {
  const inicios = [];
  for (let i = 0; i < valores.length; i++) if (esInicioDeFicha_(valores[i])) inicios.push(i);
  return inicios.map(function (inicio, k) {
    let fin = (k + 1 < inicios.length ? inicios[k + 1] : valores.length) - 1;
    // La fila de "FICHA TÉCNICA…" y la de "DEFINICIÓN DEL PROCESO" de la ficha
    // siguiente no pertenecen a esta.
    while (fin > inicio && filaEsPreambulo_(valores[fin])) fin--;
    return { inicio: inicio, fin: fin };
  });
}

function filaEsPreambulo_(fila) {
  const textos = fila.filter(function (c) { return !esVacio_(c); });
  if (!textos.length) return true;
  // Basta con que la fila ABRA con el título de la ficha o con "DEFINICIÓN DEL
  // PROCESO:": esa segunda fila lleva a su derecha el nombre del proceso, y aun
  // así pertenece a la ficha siguiente.
  return esEtiqueta_(textos[0], CONFIG_A3.ETIQUETAS.TITULO_FICHA) ||
         esEtiqueta_(textos[0], CONFIG_A3.ETIQUETAS.SEC_DEFINICION);
}

/** Primera fila del bloque (dentro del rango) cuya etiqueta coincide. */
function buscarFilaEtiqueta_(valores, desde, hasta, etiquetas) {
  for (let f = desde; f <= hasta && f < valores.length; f++) {
    for (let c = 0; c < valores[f].length; c++) {
      if (esEtiqueta_(valores[f][c], etiquetas)) return { fila: f, col: c };
    }
  }
  return null;
}

/**
 * Valor asociado a una etiqueta: la primera celda no vacía a su derecha,
 * saltando las repeticiones que dejan las celdas combinadas y las etiquetas
 * de otro campo de la misma fila.
 */
function valorDeEtiqueta_(fila, colEtiqueta, etiquetasOtrosCampos) {
  const etiqueta = normalizar_(fila[colEtiqueta]);
  for (let c = colEtiqueta + 1; c < fila.length; c++) {
    const v = fila[c];
    if (esVacio_(v)) continue;
    const n = normalizar_(v);
    if (n === etiqueta) continue;                       // celda combinada
    if (etiquetasOtrosCampos && etiquetasOtrosCampos.indexOf(n) !== -1) return { valor: '', col: c };
    return { valor: v.toString().trim(), col: c };
  }
  return { valor: '', col: -1 };
}

/** Todas las etiquetas conocidas, para no confundir un valor con otro campo. */
function catalogoDeEtiquetas_() {
  const todas = [];
  function agregar(lista) { lista.forEach(function (e) { todas.push(normalizar_(e)); }); }
  CONFIG_A3.CAMPOS_DEFINICION.forEach(function (c) { agregar(c.etiquetas); });
  CONFIG_A3.CAMPOS_EJECUCION.forEach(function (c) { agregar(c.etiquetas); });
  CONFIG_A3.CAMPOS_FORMALIZACION.forEach(function (c) { agregar(c.etiquetas); });
  CONFIG_A3.COLUMNAS_DESCRIPCION.forEach(function (c) { agregar(c.etiquetas); });
  agregar(CONFIG_A3.BLOQUES_FORMALIZACION);
  agregar(['RECURSOS']);
  return todas;
}

/* ═══════════════════════════════════════════════════════════════════════════
   REVISIÓN DE UNA FICHA TÉCNICA
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Devuelve una copia de la matriz de valores con las CELDAS COMBINADAS
 * expandidas: el valor de la celda ancla se repite en todas las celdas del
 * rango combinado.
 *
 * `getValues()` entrega el valor solo en la esquina superior izquierda del
 * rango y deja el resto en blanco. Como la hoja usa combinaciones verticales
 * —un proceso que abarca varias filas de salidas—, esas filas parecían no
 * tener proceso y se reportaba "producto final sin proceso" en filas que están
 * perfectamente bien. Expandiendo el valor, un hueco solo es un hueco cuando la
 * celda está realmente vacía y sin combinar.
 */
function expandirCombinadas_(valores, rangosCombinados, filaBase, colBase) {
  const copia = valores.map(function (fila) { return fila.slice(); });
  if (!rangosCombinados || !rangosCombinados.length) return copia;

  rangosCombinados.forEach(function (rango) {
    const f0 = rango.getRow() - filaBase;
    const c0 = rango.getColumn() - colBase;
    const filas = rango.getNumRows();
    const cols = rango.getNumColumns();
    if (f0 < 0 || c0 < 0 || f0 >= copia.length || c0 >= (copia[f0] || []).length) return;

    const ancla = copia[f0][c0];
    if (esVacio_(ancla)) return;
    for (let f = f0; f < f0 + filas && f < copia.length; f++) {
      for (let c = c0; c < c0 + cols && c < copia[f].length; c++) copia[f][c] = ancla;
    }
  });
  return copia;
}

/**
 * Comprueba, fila por fila, que las cinco columnas de la descripción se
 * correspondan entre sí. Cada fila con datos aporta dos criterios al avance:
 * el par proveedor ↔ entrada y el par proceso ↔ salida.
 *
 *  · Proveedor sin entrada, o entrada sin proveedor → Incompleto. Un proveedor
 *    entrega algo; si la celda de al lado está vacía, falta ese algo.
 *  · Proceso sin producto final → Crítico. Es la regla 5: todo proceso entrega
 *    un producto, y esa celda vacía es la que la revisión anterior no veía.
 *  · Salida sin proceso → Observación: hay un producto que no cuelga de ningún
 *    proceso de la fila.
 */
function revisarFilasDeDescripcion_(V, filaEnc, finDesc, columnas, ficha, anotar, faltante) {
  const col = {
    proveedor:    columnas['Proveedores'],
    entrada:      columnas['Entradas'],
    proceso:      columnas['Procesos'],
    salida:       columnas['Salidas'],
    beneficiario: columnas['Beneficiarios']
  };

  const lleno = function (fila, c) {
    return c !== undefined && c !== null && !esVacio_(V[fila][c]);
  };

  for (let f = filaEnc + 1; f <= finDesc && f < V.length; f++) {
    const hay = {
      proveedor:    lleno(f, col.proveedor),
      entrada:      lleno(f, col.entrada),
      proceso:      lleno(f, col.proceso),
      salida:       lleno(f, col.salida),
      beneficiario: lleno(f, col.beneficiario)
    };
    // Una fila totalmente vacía es separación de la tabla, no un hueco.
    if (!hay.proveedor && !hay.entrada && !hay.proceso && !hay.salida && !hay.beneficiario) continue;

    /* Par proveedor ↔ entrada */
    if (hay.proveedor || hay.entrada) {
      ficha.campos++;
      if (hay.proveedor && hay.entrada) {
        ficha.completos++;
      } else if (hay.proveedor) {
        faltante('Descripción › Entrada del proveedor', { fila: f, col: col.entrada });
        anotar('Descripción', 'Entrada del proveedor', recortarA3_(V[f][col.proveedor], 60),
               'N/A', 'No',
               'La fila registra un proveedor pero deja vacía la ENTRADA. A todo proveedor le ' +
               'corresponde al menos una entrada, y a toda entrada su proveedor: la celda no ' +
               'puede quedar en blanco.', { fila: f, col: col.entrada }, 'incompleto');
      } else {
        faltante('Descripción › Proveedor de la entrada', { fila: f, col: col.proveedor });
        anotar('Descripción', 'Proveedor de la entrada', recortarA3_(V[f][col.entrada], 60),
               'N/A', 'No',
               'La fila registra una entrada pero deja vacío el PROVEEDOR. A toda entrada le ' +
               'corresponde el proveedor que la entrega.', { fila: f, col: col.proveedor }, 'incompleto');
      }
    }

    /* Par proceso ↔ salida */
    if (hay.proceso || hay.salida) {
      ficha.campos++;
      if (hay.proceso && hay.salida) {
        ficha.completos++;
      } else if (hay.proceso) {
        faltante('Descripción › Producto final del proceso', { fila: f, col: col.salida });
        anotar('Descripción', 'Producto final del proceso', recortarA3_(V[f][col.proceso], 60),
               'N/A', 'No',
               'CRÍTICO: la fila registra un proceso pero deja vacía la SALIDA. Regla 5: todo ' +
               'proceso debe consignar su producto final con la codificación y denominación ' +
               'del Anexo 1.', { fila: f, col: col.salida }, 'critico');
      } else {
        anotar('Descripción', 'Proceso de la salida', recortarA3_(V[f][col.salida], 60),
               'N/A', 'Sí',
               'La fila registra un producto final pero deja vacío el PROCESO que lo genera.',
               { fila: f, col: col.proceso }, 'observacion');
      }
    }
  }
}

/** Severidad de una fila del detalle cuando no se declara una explícita. */
function severidadPorDefecto_(estructura, completo) {
  if (estructura === 'No') return 'observacion';
  if (completo === 'Opcional') return 'opcional';
  if (completo === 'No') return 'incompleto';
  return 'correcto';
}

/**
 * Severidad de un error de codificación. Un código con el formulario de otra
 * facultad es crítico: no es una errata de formato, es información que
 * pertenece a otra pestaña y descuadra el inventario de las dos.
 */
function severidadDeErrorDeCodigo_(errores) {
  let peor = 'observacion';
  errores.forEach(function (e) {
    if (/formulario/i.test(e.motivo) && /distinto del de la facultad/i.test(e.motivo)) {
      peor = 'critico';
    }
  });
  return peor;
}

/**
 * Revisa una ficha y devuelve sus hallazgos.
 *
 * `ctx` = { valores, formulario, permiteNivel2, etiquetas }.
 */
function revisarFicha_(ctx, bloque, numero) {
  const V = ctx.valores;
  const detalle = [];       // filas de la hoja 1
  const codigosMaestro = []; // { tipo, codigo, denominacion }
  const cotejo = [];         // { tipo, codigo, denominacion }
  const ficha = {
    numero: numero,
    nombre: '',
    codigo: '',
    filaInicio: bloque.inicio + 1,
    filaFin: bloque.fin + 1,
    campos: 0,
    completos: 0,
    faltantes: [],
    erroresCodificacion: 0,
    notas: [],
    excepcionesNivel2: 0,  // códigos con un nivel de más, válidos en estas facultades
    salidas: [],          // productos finales CODIFICADOS en la columna H
    salidasDeclaradas: 0, // celdas con texto en la columna H, tengan código o no
    filasDescripcion: 0,  // celdas con datos en la tabla de la descripción
    detalle: detalle,
    codigosMaestro: codigosMaestro,
    cotejo: cotejo
  };

  /**
   * Registra una fila del detalle.
   *
   * `ubicacion` = { fila, col } en base 0, tal como vienen del recorrido de la
   * matriz. Se traduce a la fila y la celda que el revisor ve en la hoja, para
   * que pueda ir directo al dato sin tener que buscarlo. Cuando el hallazgo no
   * cuelga de una celda concreta (una columna entera sin registros, la revisión
   * de fuente de toda la ficha) se deja el rango de filas de la ficha.
   */
  function anotar(seccion, campo, codigo, estructura, completo, obs, ubicacion, severidad) {
    let fila = '';
    let celda = '';
    if (ubicacion && ubicacion.fila !== undefined && ubicacion.fila !== null && ubicacion.fila >= 0) {
      fila = ubicacion.fila + 1;
      if (ubicacion.col !== undefined && ubicacion.col !== null && ubicacion.col >= 0) {
        celda = letraColumna_(ubicacion.col + 1) + fila;
      }
    } else if (ubicacion && ubicacion.rango) {
      fila = ubicacion.rango;
    }
    detalle.push({
      ficha: numero, nombre: ficha.nombre, seccion: seccion, campo: campo,
      fila: fila, celda: celda,
      codigo: recortarA3_(codigo, 90),
      estructura: estructura, completo: completo,
      observacion: obs || '',
      severidad: severidad || severidadPorDefecto_(estructura, completo)
    });
  }

  /** Rango de filas de la ficha, para los hallazgos que no son de una celda. */
  const rangoFicha = { rango: (bloque.inicio + 1) + '–' + (bloque.fin + 1) };

  /**
   * Anota un campo pendiente y le adjunta dónde está, para que el resumen
   * ejecutivo sirva de lista de tareas sin tener que abrir el detalle.
   */
  function faltante(nombre, ubicacion) {
    let donde = '';
    if (ubicacion && ubicacion.fila !== undefined && ubicacion.fila !== null && ubicacion.fila >= 0) {
      donde = (ubicacion.col !== undefined && ubicacion.col !== null && ubicacion.col >= 0)
        ? ' (celda ' + letraColumna_(ubicacion.col + 1) + (ubicacion.fila + 1) + ')'
        : ' (fila ' + (ubicacion.fila + 1) + ')';
    } else if (ubicacion && ubicacion.rango) {
      donde = ' (filas ' + ubicacion.rango + ')';
    }
    ficha.faltantes.push(nombre + donde);
  }

  /* ── 3.2 Definición del Proceso ─────────────────────────────────────── */

  CONFIG_A3.CAMPOS_DEFINICION.forEach(function (def) {
    const pos = buscarFilaEtiqueta_(V, bloque.inicio, bloque.fin, def.etiquetas);
    ficha.campos++;
    if (!pos) {
      faltante('Definición › ' + def.campo, rangoFicha);
      anotar('Definición', def.campo, '', 'N/A', 'No',
             'No se encontró la etiqueta "' + def.campo + '" en la ficha.', rangoFicha);
      return;
    }
    const v = valorDeEtiqueta_(V[pos.fila], pos.col, ctx.etiquetas);
    if (esVacio_(v.valor)) {
      faltante('Definición › ' + def.campo, { fila: pos.fila, col: pos.col });
      anotar('Definición', def.campo, '', def.codigo ? 'No' : 'N/A', 'No',
             'Campo obligatorio vacío.', { fila: pos.fila, col: pos.col });
      return;
    }
    ficha.completos++;
    if (def.campo === 'Nombre') ficha.nombre = v.valor.toString().trim();

    if (!def.codigo) {
      anotar('Definición', def.campo, recortarA3_(v.valor, 90), 'N/A', 'Sí', '',
             { fila: pos.fila, col: v.col });
      return;
    }

    const r = validarCeldaA3_(v.valor, def.codigo, ctx.formulario, ctx.permiteNivel2, true);
    if (def.campo === 'Código' && r.codigos.length) ficha.codigo = r.codigos[0];
    if (r.errores.length) {
      ficha.erroresCodificacion += r.errores.length;
      anotar('Definición', def.campo, v.valor, 'No', 'Sí',
             r.errores.map(function (e) { return e.motivo + ' ' + e.correccion; }).join(' | '),
             { fila: pos.fila, col: v.col }, severidadDeErrorDeCodigo_(r.errores));
    } else {
      anotar('Definición', def.campo, v.valor, 'Sí', 'Sí', '',
             { fila: pos.fila, col: v.col });
      ficha.excepcionesNivel2 += r.notas.length;
    }
  });

  /* ── 3.1 Descripción del Proceso ────────────────────────────────────── */

  const posDesc = buscarFilaEtiqueta_(V, bloque.inicio, bloque.fin, CONFIG_A3.ETIQUETAS.SEC_DESCRIPCION);
  const posEjec = buscarFilaEtiqueta_(V, bloque.inicio, bloque.fin, CONFIG_A3.ETIQUETAS.SEC_EJECUCION);
  const finDesc = posEjec ? posEjec.fila - 1 : bloque.fin;

  if (!posDesc) {
    ficha.campos++;
    faltante('Descripción › sección completa', rangoFicha);
    anotar('Descripción', 'Sección', '', 'N/A', 'No',
           'No se encontró "DESCRIPCIÓN DEL PROCESO" en la ficha.', rangoFicha, 'critico');
  } else {
    // Fila de encabezados (PROVEEDORES … BENEFICIARIOS) y columna de cada uno.
    let filaEnc = -1;
    const columnas = {};
    for (let f = posDesc.fila; f <= finDesc; f++) {
      const encontradas = {};
      CONFIG_A3.COLUMNAS_DESCRIPCION.forEach(function (col) {
        for (let c = 0; c < V[f].length; c++) {
          if (esEtiqueta_(V[f][c], col.etiquetas) && encontradas[col.campo] === undefined) {
            encontradas[col.campo] = c;
          }
        }
      });
      if (Object.keys(encontradas).length >= 3) { filaEnc = f; Object.keys(encontradas).forEach(function (k) { columnas[k] = encontradas[k]; }); break; }
    }

    CONFIG_A3.COLUMNAS_DESCRIPCION.forEach(function (col) {
      ficha.campos++;
      if (filaEnc === -1 || columnas[col.campo] === undefined) {
        faltante('Descripción › ' + col.campo, filaEnc === -1 ? rangoFicha : { fila: filaEnc });
        anotar('Descripción', col.campo, '', 'N/A', 'No',
               'No se ubicó la columna "' + col.campo + '" (columna ' + col.columna + ').',
               filaEnc === -1 ? rangoFicha : { fila: filaEnc });
        return;
      }
      const c = columnas[col.campo];
      let conDatos = 0;
      for (let f = filaEnc + 1; f <= finDesc; f++) {
        const celda = V[f][c];
        if (esVacio_(celda)) continue;
        if (esEtiqueta_(celda, col.etiquetas)) continue;
        conDatos++;
        ficha.filasDescripcion++;
        if (col.campo === 'Salidas') ficha.salidasDeclaradas++;
        const unico = (col.campo === 'Procesos');   // regla 4
        const r = validarCeldaA3_(celda, col.codigo, ctx.formulario, ctx.permiteNivel2, unico);
        // Cada código con SU denominación: la celda contigua trae una por línea.
        const pares = emparejarCodigosYDenominaciones_(celda, V[f][c + 1]);
        const denominacionDe = {};
        pares.forEach(function (par) { denominacionDe[par.codigo] = par.denominacion; });
        if (r.errores.length) {
          ficha.erroresCodificacion += r.errores.length;
          anotar('Descripción', col.campo, celda, 'No', 'Sí',
                 r.errores.map(function (e) { return e.motivo + ' ' + e.correccion; }).join(' | '),
                 { fila: f, col: c }, severidadDeErrorDeCodigo_(r.errores));
        } else if (r.notas.length) {
          // La excepción de nivel 2 es lo NORMAL en estas facultades: se cuenta
          // una vez para el resumen en lugar de repetirla en cada código, que
          // llenaba el detalle con la misma frase veinte veces.
          ficha.excepcionesNivel2 += r.notas.length;
        }
        // Registro maestro (reglas 2, 3 y 6) y cotejo con el Anexo 1 (regla 5).
        r.codigos.forEach(function (cod) {
          const denom = denominacionDe[cod] || '';
          if (col.codigo === 'PR' || col.codigo === 'EN' || col.codigo === 'BE') {
            codigosMaestro.push({ tipo: col.campo, codigo: cod, denominacion: denom, ficha: numero });
          } else if (col.codigo === 'SALIDA') {
            cotejo.push({ tipo: 'Salida', codigo: cod, denominacion: denom, ficha: numero });
            ficha.salidas.push({ codigo: cod, denominacion: denom, fila: f, col: c });
          }
        });
      }
      if (conDatos === 0) {
        faltante('Descripción › ' + col.campo, { rango: (filaEnc + 2) + '–' + (finDesc + 1) });
        anotar('Descripción', col.campo, '', 'N/A', 'No',
               'La columna ' + col.columna + ' (' + col.campo + ') no tiene ningún registro.',
               { rango: (filaEnc + 2) + '–' + (finDesc + 1) });
      } else {
        ficha.completos++;
        anotar('Descripción', col.campo, conDatos + ' registro(s)', 'Sí', 'Sí', '',
               { rango: (filaEnc + 2) + '–' + (finDesc + 1) });
      }
    });

    /* Coherencia FILA POR FILA de la tabla de la descripción.
     *
     * Revisar cada columna por separado deja pasar el defecto más común: la
     * columna tiene registros —así que "está completa"— pero a un proveedor no
     * le corresponde ninguna entrada, o a un proceso ningún producto final. Es
     * lo que hace que una ficha con huecos evidentes llegue al 100 %. Aquí se
     * revisa cada fila como lo que es: una relación proveedor → entrada →
     * proceso → salida → beneficiario.
     */
    if (filaEnc !== -1) {
      revisarFilasDeDescripcion_(V, filaEnc, finDesc, columnas, ficha, anotar, faltante);
    }
  }

  /* ── Criterio obligatorio: al menos un producto final ───────────────── */

  // Una ficha sin ninguna salida no describe qué produce el proceso: no sirve
  // aunque el resto esté impecable. Es hallazgo crítico y no se computa como un
  // campo más, para no diluirlo en el porcentaje.
  //
  // Distinto es tener los productos escritos pero sin codificar: eso es un
  // defecto de codificación, no una ficha sin producto, y cada celda ya se
  // observa una por una. Confundir ambos casos marcaba como críticas facultades
  // enteras que sí habían declarado sus productos.
  if (ficha.salidasDeclaradas === 0) {
    anotar('Descripción', 'Productos finales (Salidas)', '', 'N/A', 'No',
           'CRÍTICO: la ficha no declara ningún producto final en la columna H ' +
           '("Salidas"). Toda ficha debe registrar al menos ' +
           CONFIG_A3.MIN_SALIDAS_POR_FICHA + ' producto final con la codificación y ' +
           'denominación establecidas en el Anexo 1.', rangoFicha, 'critico');
  } else if (ficha.salidas.length < CONFIG_A3.MIN_SALIDAS_POR_FICHA) {
    anotar('Descripción', 'Productos finales (Salidas)',
           ficha.salidasDeclaradas + ' producto(s) sin codificar', 'No', 'Sí',
           'La ficha declara ' + ficha.salidasDeclaradas + ' producto(s) final(es) en la ' +
           'columna H, pero ninguno lleva codificación. Regla 5: consigne el código y la ' +
           'denominación ya establecidos en el Anexo 1.', rangoFicha, 'observacion');
  } else {
    anotar('Descripción', 'Productos finales (Salidas)',
           ficha.salidas.length + ' producto(s) final(es)', 'Sí', 'Sí', '',
           rangoFicha, 'correcto');
  }

  /* ── 3.3 Ejecución del Proceso ──────────────────────────────────────── */

  const posForm = buscarFilaEtiqueta_(V, bloque.inicio, bloque.fin, CONFIG_A3.ETIQUETAS.SEC_FORMALIZACION);
  const iniEjec = posEjec ? posEjec.fila : bloque.inicio;
  const finEjec = posForm ? posForm.fila - 1 : bloque.fin;

  CONFIG_A3.CAMPOS_EJECUCION.forEach(function (def) {
    ficha.campos++;
    let valor = '';
    let filaHallada = -1;
    let colEtiqueta = -1;
    let colValor = -1;
    for (let f = iniEjec; f <= finEjec && f < V.length; f++) {
      for (let c = 0; c < V[f].length; c++) {
        if (!esEtiqueta_(V[f][c], def.etiquetas)) continue;
        const v = valorDeEtiqueta_(V[f], c, ctx.etiquetas);
        if (!esVacio_(v.valor)) { valor = v.valor; filaHallada = f; colEtiqueta = c; colValor = v.col; break; }
        // La etiqueta existe pero está vacía: se recuerda su posición por si no
        // aparece llena más abajo (las celdas combinadas la repiten por fila).
        if (filaHallada === -1) { filaHallada = f; colEtiqueta = c; }
      }
      if (valor) break;
    }
    if (filaHallada === -1) {
      faltante('Ejecución › ' + def.campo, rangoFicha);
      anotar('Ejecución', def.campo, '', 'N/A', 'No',
             'No se encontró la etiqueta "' + def.campo + '".', rangoFicha);
      return;
    }
    if (esVacio_(valor)) {
      faltante('Ejecución › ' + def.campo, { fila: filaHallada, col: colEtiqueta });
      anotar('Ejecución', def.campo, '', def.codigo ? 'No' : 'N/A', 'No',
             'Campo obligatorio vacío.', { fila: filaHallada, col: colEtiqueta });
      return;
    }
    ficha.completos++;
    if (!def.codigo) {
      anotar('Ejecución', def.campo, recortarA3_(valor, 90), 'N/A', 'Sí', '',
             { fila: filaHallada, col: colValor });
      return;
    }

    const r = validarCeldaA3_(valor, def.codigo, ctx.formulario, ctx.permiteNivel2, false);
    if (r.errores.length) {
      ficha.erroresCodificacion += r.errores.length;
      anotar('Ejecución', def.campo, valor, 'No', 'Sí',
             r.errores.map(function (e) { return e.motivo + ' ' + e.correccion; }).join(' | '),
             { fila: filaHallada, col: colValor }, severidadDeErrorDeCodigo_(r.errores));
    } else {
      anotar('Ejecución', def.campo, valor, 'Sí', 'Sí', '',
             { fila: filaHallada, col: colValor });
      ficha.excepcionesNivel2 += r.notas.length;
    }
    // Regla 7: los registros se cotejan contra los productos parciales del A1.
    // Cada registro con SU denominación: la celda trae varios, uno por línea, y
    // atribuirles el texto entero hacía fallar el cotejo de todos ellos.
    emparejarCodigosYDenominaciones_(valor, V[filaHallada][colValor + 1]).forEach(function (par) {
      cotejo.push({ tipo: 'Registro', codigo: par.codigo,
                    denominacion: par.denominacion, ficha: numero });
    });
  });

  /* ── 3.4 Formalización del Proceso ──────────────────────────────────── */

  if (!posForm) {
    ficha.campos++;
    faltante('Formalización › sección completa', rangoFicha);
    anotar('Formalización', 'Sección', '', 'N/A', 'No',
           'No se encontró "FORMALIZACIÓN DEL PROCESO" en la ficha.', rangoFicha, 'critico');
  } else {
    // Encabezado Unidad | Cargo | Nombre y Apellidos | Firma.
    let filaEnc = -1;
    const columnas = {};
    for (let f = posForm.fila; f <= bloque.fin; f++) {
      const encontradas = {};
      CONFIG_A3.CAMPOS_FORMALIZACION.forEach(function (campo) {
        for (let c = 0; c < V[f].length; c++) {
          if (esEtiqueta_(V[f][c], campo.etiquetas) && encontradas[campo.campo] === undefined) {
            encontradas[campo.campo] = c;
          }
        }
      });
      if (Object.keys(encontradas).length >= 2) { filaEnc = f; Object.keys(encontradas).forEach(function (k) { columnas[k] = encontradas[k]; }); break; }
    }

    CONFIG_A3.BLOQUES_FORMALIZACION.forEach(function (bloqueNombre) {
      let filaBloque = -1;
      for (let f = (filaEnc === -1 ? posForm.fila : filaEnc); f <= bloque.fin; f++) {
        for (let c = 0; c < V[f].length; c++) {
          if (esEtiqueta_(V[f][c], [bloqueNombre])) { filaBloque = f; break; }
        }
        if (filaBloque !== -1) break;
      }
      const rotulo = bloqueNombre.charAt(0) + bloqueNombre.substring(1).toLowerCase();

      CONFIG_A3.CAMPOS_FORMALIZACION.forEach(function (campo) {
        if (!campo.obligatorio) {
          // La firma va como foto: se informa, no se computa ni se exige.
          anotar('Formalización', rotulo + ' › ' + campo.campo, '', 'N/A', 'Opcional',
                 'La firma es una imagen; no se computa como campo faltante.',
                 filaBloque === -1 ? rangoFicha
                                   : { fila: filaBloque, col: columnas[campo.campo] });
          return;
        }
        ficha.campos++;
        if (filaBloque === -1) {
          faltante('Formalización › ' + rotulo + ' › ' + campo.campo, rangoFicha);
          anotar('Formalización', rotulo + ' › ' + campo.campo, '', 'N/A', 'No',
                 'No se encontró la fila "' + rotulo + '".', rangoFicha);
          return;
        }
        let valor = '';
        if (columnas[campo.campo] !== undefined) {
          const bruto = V[filaBloque][columnas[campo.campo]];
          if (!esVacio_(bruto) && !esEtiqueta_(bruto, [bloqueNombre])) valor = bruto.toString().trim();
        }
        if (!valor) {
          // Sin encabezado ubicable, se recorre la fila de izquierda a derecha.
          const v = valorDeEtiqueta_(V[filaBloque], indiceDe_(V[filaBloque], bloqueNombre), ctx.etiquetas);
          if (campo.campo === 'Unidad') valor = v.valor;
        }
        if (esVacio_(valor)) {
          faltante('Formalización › ' + rotulo + ' › ' + campo.campo, { fila: filaBloque, col: columnas[campo.campo] });
          anotar('Formalización', rotulo + ' › ' + campo.campo, '', 'N/A', 'No',
                 'Campo obligatorio vacío.',
                 { fila: filaBloque, col: columnas[campo.campo] });
        } else {
          ficha.completos++;
          anotar('Formalización', rotulo + ' › ' + campo.campo, recortarA3_(valor, 90), 'N/A', 'Sí', '',
                 { fila: filaBloque, col: columnas[campo.campo] });
        }
      });
    });
  }

  ficha.avance = ficha.campos ? Math.round(ficha.completos * 1000 / ficha.campos) / 10 : 0;
  ficha.completa = (ficha.faltantes.length === 0 && ficha.erroresCodificacion === 0 &&
                    ficha.salidas.length >= CONFIG_A3.MIN_SALIDAS_POR_FICHA);
  // Una plantilla que quedó de más no es una ficha a medio hacer: no se computa
  // ni se penaliza. Se reconoce por lo esencial —sin nombre, sin código y sin
  // una sola fila de la descripción— y no por el conteo de campos completos,
  // porque la plantilla suele venir con la unidad de elaboración ya escrita.
  ficha.vacia = (!ficha.nombre && !ficha.codigo && ficha.filasDescripcion === 0);
  if (!ficha.nombre) ficha.nombre = ficha.codigo || ('Ficha ' + numero) + (ficha.vacia ? ' (en blanco)' : '');
  detalle.forEach(function (d) { d.nombre = ficha.nombre; });
  ficha.severidad = severidadDeFicha_(ficha);
  ficha.criticos = detalle.filter(function (d) { return d.severidad === 'critico'; }).length;
  return ficha;
}

/** Denominación tomada de la celda contigua cuando el código va solo. */
function denominacionVecina_(fila, col) {
  for (let c = col + 1; c < fila.length; c++) {
    if (esVacio_(fila[c])) continue;
    const t = fila[c].toString().trim();
    if (extraerCodigosA3_(t).length) return '';
    return t;
  }
  return '';
}

function indiceDe_(fila, etiqueta) {
  for (let c = 0; c < fila.length; c++) if (esEtiqueta_(fila[c], [etiqueta])) return c;
  return 0;
}

/** 1 → A, 27 → AA. */
function letraColumna_(n) {
  let s = '';
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONSOLIDACIONES  (hojas 4 y 5)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Registro maestro de proveedores, entradas y beneficiarios. Detecta los dos
 * defectos de las reglas 2, 3 y 6: un mismo código con denominaciones distintas
 * y una misma denominación con códigos distintos.
 */
function construirMaestro_(entradas) {
  const porCodigo = {};
  const porDenominacion = {};

  entradas.forEach(function (e) {
    if (!e.codigo) return;
    const k = e.tipo + '|' + e.codigo;
    if (!porCodigo[k]) porCodigo[k] = { tipo: e.tipo, codigo: e.codigo, denominaciones: [], fichas: [] };
    const reg = porCodigo[k];
    const dn = normalizar_(e.denominacion);
    if (dn && reg.denominaciones.indexOf(dn) === -1) reg.denominaciones.push(dn);
    if (reg.fichas.indexOf(e.ficha) === -1) reg.fichas.push(e.ficha);

    if (dn) {
      const kd = e.tipo + '|' + dn;
      if (!porDenominacion[kd]) porDenominacion[kd] = [];
      if (porDenominacion[kd].indexOf(e.codigo) === -1) porDenominacion[kd].push(e.codigo);
    }
  });

  return Object.keys(porCodigo).sort().map(function (k) {
    const r = porCodigo[k];
    const observaciones = [];
    if (r.denominaciones.length > 1) {
      observaciones.push('El código se usa con ' + r.denominaciones.length +
        ' denominaciones distintas: ' + r.denominaciones.map(function (d) { return '"' + recortarA3_(d, 50) + '"'; }).join(', ') +
        '. Unifique la denominación o asigne códigos distintos.');
    }
    r.denominaciones.forEach(function (d) {
      const codigos = porDenominacion[r.tipo + '|' + d] || [];
      if (codigos.length > 1) {
        observaciones.push('La denominación "' + recortarA3_(d, 50) + '" aparece con los códigos ' +
          codigos.join(', ') + '. Debe conservarse un único código correlativo en toda la facultad.');
      }
    });
    return {
      tipo: r.tipo,
      codigo: r.codigo,
      denominacion: r.denominaciones.join(' | '),
      fichas: r.fichas.join(', '),
      consistente: observaciones.length ? 'No' : 'Sí',
      observacion: observaciones.join(' ')
    };
  });
}

/**
 * Códigos duplicados dentro de una misma facultad. Se revisan dos cosas
 * distintas, y solo la primera es un defecto siempre:
 *
 *  · El CÓDIGO DE LA FICHA (Definición › Código) identifica al proceso: si dos
 *    fichas lo comparten, una de las dos está mal codificada. Es crítico.
 *  · Una MISMA SALIDA declarada por dos procesos distintos puede ser legítima
 *    —dos procesos que entregan el mismo producto— pero casi siempre es un
 *    copiado y pegado, así que se reporta como observación para que el revisor
 *    lo confirme, no como error.
 *
 * Devuelve las filas ya listas para el detalle, con su severidad.
 */
function detectarDuplicados_(fichas) {
  const hallazgos = [];

  const porCodigoFicha = {};
  fichas.forEach(function (f) {
    if (!f.codigo) return;
    if (!porCodigoFicha[f.codigo]) porCodigoFicha[f.codigo] = [];
    porCodigoFicha[f.codigo].push(f);
  });
  Object.keys(porCodigoFicha).sort().forEach(function (codigo) {
    const grupo = porCodigoFicha[codigo];
    if (grupo.length < 2) return;
    grupo.forEach(function (f) {
      hallazgos.push({
        ficha: f,
        campo: 'Código de la ficha',
        codigo: codigo,
        severidad: 'critico',
        observacion: 'CRÍTICO: el código "' + codigo + '" está declarado en ' + grupo.length +
          ' fichas técnicas (' + grupo.map(function (x) { return x.numero; }).join(', ') +
          '). Cada proceso debe tener un código propio y correlativo.'
      });
    });
  });

  const porSalida = {};
  fichas.forEach(function (f) {
    const vistas = {};
    f.salidas.forEach(function (sal) {
      if (vistas[sal.codigo]) return;   // repetida dentro de la misma ficha: una sola vez
      vistas[sal.codigo] = true;
      if (!porSalida[sal.codigo]) porSalida[sal.codigo] = [];
      porSalida[sal.codigo].push(f);
    });
  });
  Object.keys(porSalida).sort().forEach(function (codigo) {
    const grupo = porSalida[codigo];
    if (grupo.length < 2) return;
    grupo.forEach(function (f) {
      hallazgos.push({
        ficha: f,
        campo: 'Salida duplicada',
        codigo: codigo,
        severidad: 'observacion',
        observacion: 'El producto final "' + codigo + '" se declara como salida en las fichas ' +
          grupo.map(function (x) { return x.numero; }).join(', ') +
          '. Verifique si corresponde a un solo proceso.'
      });
    });
  });

  return hallazgos;
}

/**
 * Catálogo del Anexo 1: código → { denominación, tipo }. Se lee la columna B
 * (código + denominación) y la columna C (tipo de producto).
 */
function leerCatalogoAnexo1_(sigla) {
  const catalogo = {};
  let hoja = null;
  try {
    const libro = SpreadsheetApp.openById(CONFIG_A3.ANEXO1_SHEET_ID);
    if (CONFIG_A3.ANEXO1_TAB_NAME) hoja = libro.getSheetByName(CONFIG_A3.ANEXO1_TAB_NAME);

    // El Anexo 1 se renombró igual que el Anexo 3: primero se busca el formato
    // vigente `F##_SIGLA` y solo después el antiguo `1. FM`.
    if (!hoja) {
      libro.getSheets().forEach(function (h) {
        const f = leerPestanaFacultad_(h.getName());
        if (!hoja && f && f.sigla === sigla) hoja = h;
      });
    }
    if (!hoja) {
      libro.getSheets().forEach(function (h) {
        if (!hoja && siglaDePestana_(h.getName()) === sigla) hoja = h;
      });
    }
    if (!hoja) {
      return {
        disponible: false,
        motivo: 'No se ubicó la pestaña de ' + sigla + ' en el Anexo 1. Pestañas del Anexo 1: ' +
                libro.getSheets().map(function (h) { return '"' + h.getName() + '"'; }).join(', ') + '.',
        catalogo: catalogo
      };
    }

    const datos = hoja.getRange(1, 2, hoja.getLastRow(), 2).getValues();  // B y C
    datos.forEach(function (fila) {
      extraerCodigosA3_(fila[0]).forEach(function (c) {
        if (!catalogo[c]) {
          catalogo[c] = { denominacion: denominacionDeA3_(fila[0]), tipo: (fila[1] || '').toString().trim() };
        }
      });
    });
    return { disponible: true, hoja: hoja.getName(), catalogo: catalogo,
             equivalencias: leerEquivalenciasA1_(libro, hoja.getName()) };
  } catch (e) {
    return { disponible: false, motivo: 'No se pudo leer el Anexo 1: ' + e.message, catalogo: catalogo };
  }
}

/**
 * Cotejo de salidas y registros contra el Anexo 1 (reglas 5 y 7). Ya no tiene
 * hoja propia: sus hallazgos se vuelcan al detalle, junto a la ficha donde
 * aparece cada código.
 */
/**
 * [v4] Código del catálogo del Anexo 1 que corresponde al mismo producto escrito
 * en el otro formato: misma denominación y mismo proceso padre. null si no hay
 * uno solo que cumpla.
 */
function buscarEnOtroFormato_(codigo, denominacion, catalogo) {
  const padre = padreDeProductoA3_(codigo);
  const clave = claveDenominacion_(denominacion);
  if (!padre || !clave) return null;
  const candidatos = Object.keys(catalogo).filter(function (k) {
    return k !== codigo && padreDeProductoA3_(k) === padre &&
           claveDenominacion_(catalogo[k].denominacion) === clave;
  });
  return candidatos.length === 1 ? candidatos[0] : null;
}

/**
 * [v4] Equivalencias anterior → nuevo de una pestaña del Anexo 1, leídas de la
 * hoja que escribe AutoAnexo1. Vacío si la hoja no existe todavía.
 * Columnas: FECHA, PESTAÑA, FILA, CÓDIGO ANTERIOR, CÓDIGO NUEVO, DENOMINACIÓN.
 */
function leerEquivalenciasA1_(libro, pestana) {
  const eq = {};
  const hoja = libro.getSheetByName(CONFIG_A3.HOJA_EQUIVALENCIAS_A1);
  if (!hoja || hoja.getLastRow() < 2) return eq;
  hoja.getRange(2, 1, hoja.getLastRow() - 1, 5).getValues().forEach(function (f) {
    if ((f[1] || '').toString().trim() !== pestana) return;
    const anterior = normalizarCodigoA3_(f[3]);
    const nuevo = normalizarCodigoA3_(f[4]);
    if (anterior && nuevo) eq[anterior] = nuevo;
  });
  return eq;
}

/** Sigue la cadena anterior → nuevo (una pestaña renumerada dos veces). */
function resolverEquivalenciaA3_(codigo, equivalencias) {
  let c = codigo;
  for (let i = 0; i < 10 && equivalencias && equivalencias[c]; i++) c = equivalencias[c];
  return c === codigo ? null : c;
}

function construirCotejo_(entradas, anexo1) {
  const vistos = {};
  const filas = [];
  entradas.forEach(function (e) {
    const k = e.tipo + '|' + e.codigo + '|' + normalizar_(e.denominacion);
    if (vistos[k]) { vistos[k].fichas.push(e.ficha); return; }
    vistos[k] = { fichas: [e.ficha] };
    filas.push({ ref: vistos[k], tipo: e.tipo, codigo: e.codigo, denominacion: e.denominacion });
  });

  return filas.map(function (f) {
    let existe = 'No verificable';
    let observacion = '';
    if (!anexo1.disponible) {
      observacion = anexo1.motivo;
    } else {
      let enA1 = anexo1.catalogo[f.codigo];
      let otroFormato = null;
      if (!enA1) {
        // [v4] Durante la renumeración un mismo producto puede estar en el
        // formato viejo en un anexo y con -P## en el otro.
        const traducido = resolverEquivalenciaA3_(f.codigo, anexo1.equivalencias);
        otroFormato = (traducido && anexo1.catalogo[traducido]) ? traducido
          : buscarEnOtroFormato_(f.codigo, f.denominacion, anexo1.catalogo);
        if (otroFormato) enA1 = anexo1.catalogo[otroFormato];
      }
      if (otroFormato) {
        existe = 'Sí (código en otro formato)';
        observacion = 'En el Anexo 1 figura como "' + otroFormato + '". Debe consignarse el mismo ' +
                      'código en ambos anexos (formato PADRE_F##-P##).';
      } else if (!enA1) {
        existe = 'No';
        observacion = f.tipo === 'Registro'
          ? 'Regla 7: producto parcial no registrado en el Anexo 1. Debe incorporarse con la misma denominación en ambos anexos.'
          : 'Regla 5: la salida no figura en el Anexo 1. Use la codificación y denominación ya establecidas allí.';
      } else if (f.denominacion && claveDenominacion_(f.denominacion) !== claveDenominacion_(enA1.denominacion)) {
        existe = 'Sí (denominación distinta)';
        observacion = 'El Anexo 1 lo denomina "' + recortarA3_(enA1.denominacion, 70) +
                      '". Debe consignarse la misma denominación en ambos anexos.';
      } else {
        existe = 'Sí';
      }
      if (enA1 && f.tipo === 'Registro' && enA1.tipo && normalizar_(enA1.tipo).indexOf('PARCIAL') === -1) {
        observacion += (observacion ? ' ' : '') +
          'En el Anexo 1 está tipificado como "' + enA1.tipo + '"; los registros deben ser productos parciales.';
      }
    }
    return {
      tipo: f.tipo, codigo: f.codigo, denominacion: recortarA3_(f.denominacion, 120),
      fichas: f.ref.fichas.join(', '), existe: existe, observacion: observacion
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   ESCRITURA DEL ARCHIVO DE SALIDA
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Abre el libro donde se escribe el reporte. No se crea nada: es el libro de
 * revisión que ya usa el auditor del Anexo 1.
 */
function abrirLibroDestino_() {
  try {
    return SpreadsheetApp.openById(CONFIG_A3.DESTINO_SHEET_ID);
  } catch (e) {
    throw new Error('No se pudo abrir el libro de revisión (' + CONFIG_A3.DESTINO_SHEET_ID +
                    '). Verifique el ID en CONFIG_A3.DESTINO_SHEET_ID y que tenga permiso de ' +
                    'edición sobre él. Detalle: ' + e.message);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEMÁFORO DE ESTADOS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Escala de severidad, de menor a mayor. `opcional` queda fuera: no es un grado
 * de la escala, es un campo que no se computa (la firma).
 *
 *  - `correcto`    → nada que corregir.
 *  - `incompleto`  → falta llenar un campo obligatorio.
 *  - `observacion` → hay algo escrito, pero mal: codificación fuera de
 *                    estructura, fuente indebida, denominación inconsistente.
 *  - `critico`     → compromete la ficha entera: sin producto final, código de
 *                    otra facultad, código duplicado, sección ausente.
 */
const ESCALA_SEVERIDAD = ['correcto', 'incompleto', 'observacion', 'critico'];

/** Devuelve la peor de dos severidades según la escala. */
function peorSeveridad_(a, b) {
  const ia = ESCALA_SEVERIDAD.indexOf(a);
  const ib = ESCALA_SEVERIDAD.indexOf(b);
  if (ia === -1) return b;
  if (ib === -1) return a;
  return ia >= ib ? a : b;
}

/** Peor severidad de una lista de filas del detalle, ignorando lo opcional. */
function severidadDeFicha_(f) {
  let peor = 'correcto';
  f.detalle.forEach(function (d) {
    if (d.severidad === 'opcional') return;
    peor = peorSeveridad_(peor, d.severidad);
  });
  return peor;
}

/** Severidad de una fila del registro maestro de códigos. */
function severidadDeMaestro_(m) {
  return m.consistente === 'No' ? 'observacion' : 'correcto';
}

/**
 * Vocabulario de la columna ESTADO: CONFORME, OBSERVADO, SIN REGISTRAR o
 * CRÍTICO. 'opcional' (la firma de Formalización) no es un defecto, así que
 * se informa como CONFORME; la observación de esa fila ya aclara que el campo
 * es opcional.
 */
const TEXTO_ESTADO_A3 = {
  correcto: 'CONFORME', opcional: 'CONFORME',
  incompleto: 'SIN REGISTRAR',
  observacion: 'OBSERVADO',
  critico: 'CRÍTICO'
};

function estadoTextoA3_(severidad) {
  return TEXTO_ESTADO_A3[severidad] || 'OBSERVADO';
}

/**
 * Ubicación que se muestra en la columna CELDA del detalle: la celda exacta
 * cuando la hay (`B4`); si el hallazgo no cuelga de una celda concreta —una
 * columna entera, una sección ausente— se muestra el rango de filas que ya
 * traía el hallazgo, para no perder la ubicación al quedarse con una sola
 * columna.
 */
function ubicacionCeldaA3_(d) {
  if (d.celda) return d.celda;
  if (d.fila === '' || d.fila === undefined || d.fila === null) return '';
  return 'Fila ' + d.fila;
}

/**
 * Severidad de una fila del cotejo con el Anexo 1. Lo que no se pudo verificar
 * no puede pesar como incumplimiento: se deja en incompleto, no en crítico.
 */
function severidadDeCotejo_(c) {
  if (c.existe === 'Sí') return 'correcto';
  if (c.existe === 'No') return 'observacion';
  return 'incompleto';
}

/**
 * Estado de una facultad en el resumen de las 20. El porcentaje fija el tramo,
 * pero un hallazgo crítico impide considerarla satisfactoria por alto que sea
 * ese porcentaje: baja como mínimo a "En proceso" y el rótulo lo dice.
 */
function estadoDeFacultad_(avance, criticos) {
  let tramo = CONFIG_A3.TRAMOS_AVANCE[CONFIG_A3.TRAMOS_AVANCE.length - 1];
  for (let i = 0; i < CONFIG_A3.TRAMOS_AVANCE.length; i++) {
    if (avance >= CONFIG_A3.TRAMOS_AVANCE[i].desde) { tramo = CONFIG_A3.TRAMOS_AVANCE[i]; break; }
  }
  if (!criticos) return { clave: tramo.clave, rotulo: tramo.rotulo };

  const clave = peorSeveridad_(tramo.clave, 'observacion');
  const rotuloBase = clave === tramo.clave ? tramo.rotulo : 'En proceso';
  return {
    clave: clave,
    rotulo: rotuloBase + ' — ' + criticos + ' hallazgo(s) crítico(s)'
  };
}

/**
 * Escribe una hoja del archivo de salida.
 *
 * `estados` es opcional: una entrada por fila con la clave del semáforo
 * (`ok`, `incompleto`, `error`, `neutro`). Cuando se pasa, se añade la columna
 * ESTADO al final y cada fila se pinta con el color que le corresponde.
 */
/**
 * Escribe una hoja del reporte.
 *
 * `estados` es opcional: un arreglo paralelo a `filas` con la severidad de
 * cada una, para pintar los tramos del semáforo. Por defecto, cuando se pasa
 * `estados`, se agrega además una columna de texto `CLASIFICACIÓN (color)` al
 * final. `agregarColumnaTexto = false` sigue pintando las filas con el mismo
 * semáforo, pero SIN esa columna añadida — para las hojas que ya traen su
 * propia columna ESTADO como un dato más de la fila, y no quieren la
 * clasificación repetida dos veces.
 */
function escribirHoja_(ss, nombre, encabezados, filas, estados, agregarColumnaTexto) {
  agregarColumnaTexto = agregarColumnaTexto === undefined ? true : agregarColumnaTexto;
  let hoja = ss.getSheetByName(nombre);
  if (!hoja) hoja = ss.insertSheet(nombre);
  hoja.clear();
  
  const filtroExistente = hoja.getFilter();
  if (filtroExistente) filtroExistente.remove();

  const conEstado = !!estados;
  const agregaColumna = conEstado && agregarColumnaTexto;
  const cabecera = agregaColumna ? encabezados.concat(['CLASIFICACIÓN (color)']) : encabezados.slice();
  const cuerpo = filas.map(function (fila, i) {
    if (!agregaColumna) return fila;
    const clave = estados[i] || 'correcto';
    return fila.concat([(CONFIG_A3.COLORES[clave] || CONFIG_A3.COLORES.correcto).rotulo]);
  });

  const datos = [cabecera].concat(cuerpo.length ? cuerpo : [cabecera.map(function () { return ''; })]);
  const ancho = cabecera.length;
  hoja.getRange(1, 1, datos.length, ancho).setValues(datos);
  hoja.getRange(1, 1, datos.length, ancho)
      .setFontFamily(CONFIG_A3.FUENTE_REPORTE).setVerticalAlignment('top').setWrap(true);
  hoja.getRange(1, 1, 1, ancho).setFontWeight('bold')
      .setFontColor('#ffffff').setBackground('#1f3864');
  hoja.setFrozenRows(1);

  if (conEstado && cuerpo.length) {
    // Se pintan tramos contiguos del mismo estado en lugar de fila por fila:
    // una hoja de miles de filas haría miles de llamadas al servicio.
    let inicio = 0;
    for (let i = 1; i <= cuerpo.length; i++) {
      if (i < cuerpo.length && estados[i] === estados[inicio]) continue;
      const color = CONFIG_A3.COLORES[estados[inicio]] || CONFIG_A3.COLORES.correcto;
      hoja.getRange(inicio + 2, 1, i - inicio, ancho)
          .setBackground(color.fondo).setFontColor(color.texto);
      inicio = i;
    }
    if (agregaColumna) {
      hoja.getRange(2, ancho, cuerpo.length, 1).setFontWeight('bold').setHorizontalAlignment('center');
    }
  }

  for (let c = 1; c <= ancho; c++) {
    hoja.setColumnWidth(c, c <= 2 ? 140 : (agregaColumna && c === ancho ? 110 : 260));
  }
  if (cuerpo.length) hoja.getRange(1, 1, cuerpo.length + 1, ancho).createFilter();
  return hoja;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUNTO DE ENTRADA
   ═══════════════════════════════════════════════════════════════════════════ */

/** Lee la pestaña CONFIG_A3 del Anexo 3, si existe, y sobrescribe la config. */
function aplicarConfigDeHoja_(libro) {
  const hoja = libro.getSheetByName(CONFIG_A3.TAB_CONFIG);
  if (!hoja || hoja.getLastRow() < 1) return;
  hoja.getRange(1, 1, hoja.getLastRow(), 2).getValues().forEach(function (fila) {
    const clave = (fila[0] || '').toString().trim();
    if (!clave || !(clave in CONFIG_A3)) return;
    let valor = fila[1];
    if (typeof valor === 'string') {
      const t = valor.trim();
      if (t === '') return;
      if (t.toUpperCase() === 'TRUE')  valor = true;
      else if (t.toUpperCase() === 'FALSE') valor = false;
      else valor = t;
    }
    CONFIG_A3[clave] = valor;
  });
}

/**
 * Revisa una pestaña del Anexo 3 y devuelve el resultado consolidado, sin
 * escribir nada. Reutilizable para revisar varias facultades en una corrida.
 */
/**
 * Revisa la pestaña de UNA facultad y devuelve su resultado consolidado, sin
 * escribir nada.
 *
 * `facultad` = { hoja, pestana, codigo, orden, sigla, nombre }, tal como lo
 * entrega `localizarFacultades_`. Toda la pestaña se lee de dos tirones —los
 * valores y las fuentes— y no se escribe nada sobre ella: el script solo
 * revisa, detecta, clasifica y registra.
 */
function revisarFacultad_(facultad) {
  const rango = facultad.hoja.getDataRange();
  const crudos = rango.getValues();

  // Las combinaciones se resuelven una sola vez por pestaña, en memoria: la
  // hoja original no se toca.
  let combinadas = [];
  try { combinadas = rango.getMergedRanges(); } catch (e) { combinadas = []; }
  const valores = expandirCombinadas_(crudos, combinadas, rango.getRow(), rango.getColumn());

  // El número del nombre de la pestaña manda sobre el catálogo: es el
  // formulario que deben llevar todos los códigos de esta facultad.
  const formulario = facultad.codigo ||
                     CONFIG_A3.FORMULARIO ||
                     formularioDominante_(valores);
  const permiteNivel2 = CONFIG_A3.FACULTADES_NIVEL_2.indexOf(facultad.sigla) !== -1;

  const ctx = {
    valores: valores, formulario: formulario,
    permiteNivel2: permiteNivel2, etiquetas: catalogoDeEtiquetas_()
  };

  const bloques = localizarFichas_(valores);
  const fichas = bloques.map(function (b, i) { return revisarFicha_(ctx, b, i + 1); });

  // Los duplicados solo se ven mirando la facultad entera, no ficha por ficha.
  detectarDuplicados_(fichas).forEach(function (h) {
    h.ficha.detalle.push({
      ficha: h.ficha.numero, nombre: h.ficha.nombre, seccion: 'Consistencia',
      campo: h.campo, fila: h.ficha.filaInicio + '–' + h.ficha.filaFin, celda: '',
      codigo: h.codigo, estructura: 'No', completo: 'Sí',
      observacion: h.observacion, severidad: h.severidad
    });
    h.ficha.severidad = peorSeveridad_(h.ficha.severidad, h.severidad);
    if (h.severidad === 'critico') { h.ficha.criticos++; h.ficha.completa = false; }
  });

  const maestroEntradas = [];
  const cotejoEntradas = [];
  fichas.forEach(function (f) {
    f.codigosMaestro.forEach(function (e) { maestroEntradas.push(e); });
    f.cotejo.forEach(function (e) { cotejoEntradas.push(e); });
  });

  const maestro = construirMaestro_(maestroEntradas);

  // El cotejo con el Anexo 1 ya no tiene hoja propia, pero la comprobación se
  // conserva: sus hallazgos (reglas 5 y 7) se vuelcan al detalle, en la ficha
  // donde aparece cada código.
  const anexo1 = leerCatalogoAnexo1_(facultad.sigla);
  const porNumero = {};
  fichas.forEach(function (f) { porNumero[f.numero] = f; });
  construirCotejo_(cotejoEntradas, anexo1).forEach(function (c) {
    const sev = severidadDeCotejo_(c);
    if (sev === 'correcto') return;
    const primera = parseInt((c.fichas || '').toString().split(',')[0], 10);
    const ficha = porNumero[primera];
    if (!ficha) return;
    ficha.detalle.push({
      ficha: ficha.numero, nombre: ficha.nombre, seccion: 'Anexo 1',
      campo: 'Cotejo Anexo 1 — ' + c.tipo, fila: '', celda: '',
      codigo: c.codigo, estructura: 'N/A', completo: 'Sí',
      observacion: c.observacion, severidad: sev
    });
    ficha.severidad = peorSeveridad_(ficha.severidad, sev);
  });

  // Las plantillas que quedaron en blanco no son fichas a medio hacer: no
  // entran en los conteos ni arrastran el porcentaje de la facultad.
  const vacias = fichas.filter(function (f) { return f.vacia; });
  const efectivas = fichas.filter(function (f) { return !f.vacia; });

  const campos = efectivas.reduce(function (a, f) { return a + f.campos; }, 0);
  const completos = efectivas.reduce(function (a, f) { return a + f.completos; }, 0);
  const criticos = efectivas.reduce(function (a, f) { return a + f.criticos; }, 0);
  const avance = campos ? Math.round(completos * 1000 / campos) / 10 : 0;

  return {
    codigo: facultad.codigo,
    orden: facultad.orden,
    sigla: facultad.sigla,
    nombre: facultad.nombre,
    pestana: facultad.pestana,
    formulario: formulario,
    permiteNivel2: permiteNivel2,
    fichas: fichas,
    efectivas: efectivas,
    vacias: vacias.length,
    maestro: maestro,
    campos: campos,
    completos: completos,
    avance: avance,
    criticos: criticos,
    // "Sin producto" cuenta FICHAS; "otros críticos" cuenta el resto de
    // hallazgos críticos (código de otra facultad, código duplicado, sección
    // ausente). Se separan para que ninguna fila se cuente dos veces.
    sinProducto: efectivas.filter(function (f) {
      return f.salidasDeclaradas === 0 ||
             f.detalle.some(function (d) {
               return d.severidad === 'critico' && d.campo === 'Producto final del proceso';
             });
    }).length,
    otrosCriticos: efectivas.reduce(function (a, f) {
      return a + f.detalle.filter(function (d) {
        return d.severidad === 'critico' &&
               d.campo !== 'Producto final del proceso' &&
               d.campo.indexOf('Productos finales') === -1;
      }).length;
    }, 0),
    sinCodificar: efectivas.filter(function (f) {
      return f.salidasDeclaradas > 0 && f.salidas.length < CONFIG_A3.MIN_SALIDAS_POR_FICHA;
    }).length,
    completas: efectivas.filter(function (f) { return f.completa; }).length,
    observaciones: efectivas.reduce(function (a, f) {
      return a + f.detalle.filter(function (d) { return d.severidad === 'observacion'; }).length;
    }, 0) + maestro.filter(function (m) { return severidadDeMaestro_(m) !== 'correcto'; }).length,
    estado: estadoDeFacultad_(avance, criticos)
  };
}

/** Escribe las seis hojas del archivo de salida. */
/**
 * Escribe las siete hojas del archivo de salida con TODAS las facultades
 * revisadas, en el orden F01 → F20.
 */
function escribirResultado_(ss, facultades) {
  const H = CONFIG_A3.HOJAS;
  const marcaFacultad = function (f) { return f.codigo + ' ' + f.sigla; };

  /* Hoja 1 — Detalle de revisión */
  const detalle = [];
  const sevDetalle = [];
  facultades.forEach(function (fac) {
    fac.fichas.forEach(function (f) {
      f.detalle.forEach(function (d) {
        detalle.push([fac.sigla, f.numero + '. ' + f.nombre, d.seccion, d.campo,
                      ubicacionCeldaA3_(d), d.codigo, estadoTextoA3_(d.severidad),
                      d.observacion]);
        sevDetalle.push(d.severidad);
      });
    });
  });
  escribirHoja_(ss, H.DETALLE,
    ['FACULTAD', 'N° FICHA / PROCESO', 'SECCIÓN', 'CAMPO REVISADO', 'CELDA',
     'INFORMACIÓN', 'ESTADO', 'OBSERVACIÓN ESPECÍFICA'],
    detalle, sevDetalle, false);

  /* Hoja 2 — Resumen ejecutivo por ficha técnica */
  const resumen = [];
  const sevResumen = [];
  facultades.forEach(function (fac) {
    fac.fichas.forEach(function (f) {
      const sugerencias = [];
      if (f.salidas.length < CONFIG_A3.MIN_SALIDAS_POR_FICHA) {
        sugerencias.push('CRÍTICO: registre al menos un producto final en "Salidas".');
      }
      if (f.faltantes.length) sugerencias.push('Complete ' + f.faltantes.length + ' campo(s) pendiente(s).');
      if (f.erroresCodificacion) sugerencias.push('Corrija ' + f.erroresCodificacion + ' error(es) de codificación.');
      if (f.excepcionesNivel2) {
        sugerencias.push(f.excepcionesNivel2 + ' código(s) con un nivel adicional, admitidos por ' +
                         'tratarse de una facultad que trabaja procesos y productos de nivel 2.');
      }
      if (!sugerencias.length) sugerencias.push('Sin observaciones.');
      resumen.push([fac.sigla, f.numero + '. ' + f.nombre, f.codigo, f.avance / 100,
                    f.salidas.length, f.faltantes.join('\n') || '—', f.erroresCodificacion,
                    estadoTextoA3_(f.severidad), sugerencias.join(' ')]);
      sevResumen.push(f.severidad);
    });
  });
  const hojaResumen = escribirHoja_(ss, H.RESUMEN,
    ['FACULTAD', 'N° FICHA / PROCESO', 'CÓDIGO', '% AVANCE', 'PRODUCTOS FINALES',
     'CAMPOS/CELDAS FALTANTES', 'ERRORES DE CODIFICACIÓN', 'ESTADO',
     'OBSERVACIONES Y CORRECCIONES'],
    resumen, sevResumen, false);
  if (resumen.length) hojaResumen.getRange(2, 4, resumen.length, 1).setNumberFormat('0.0%');

  /* Hoja 3 — Resumen de las 20 facultades */
  const filas20 = facultades.map(function (fac) {
    const encontradas = fac.efectivas.length;
    const esperadas = CONFIG_A3.FICHAS_ESPERADAS;
    // Que una facultad traiga menos fichas que la plantilla NO es hallazgo: hay
    // procesos que no le aplican y su ficha se eliminó. Solo se informa.
    const nota = [];
    if (esperadas && encontradas < esperadas) {
      nota.push('Trae ' + encontradas + ' de las ' + esperadas + ' fichas de la plantilla; ' +
                'las que no le aplican se eliminaron.');
    }
    if (esperadas && encontradas > esperadas) {
      nota.push('Trae ' + encontradas + ' fichas, más que las ' + esperadas + ' de la plantilla.');
    }
    if (fac.vacias) nota.push(fac.vacias + ' plantilla(s) en blanco, no computadas.');
    if (fac.sinCodificar) {
      nota.push(fac.sinCodificar + ' ficha(s) con productos declarados pero sin codificar.');
    }
    return [fac.sigla, fac.nombre || '(sin nombre en el catálogo)',
            encontradas, esperadas || '—', fac.completas, encontradas - fac.completas,
            fac.sinProducto, fac.otrosCriticos, fac.criticos, fac.observaciones,
            fac.estado.rotulo, nota.join(' '), fac.avance / 100];
  });

  // Fila de cierre: cómo va el Anexo 3 en conjunto. Es el promedio PONDERADO
  // por campos revisados, no el promedio de los porcentajes: una facultad con
  // 16 fichas no puede pesar lo mismo que una con 12.
  const camposTotal = facultades.reduce(function (a, f) { return a + f.campos; }, 0);
  const completosTotal = facultades.reduce(function (a, f) { return a + f.completos; }, 0);
  const avanceTotal = camposTotal ? Math.round(completosTotal * 1000 / camposTotal) / 10 : 0;
  const criticosTotal = facultades.reduce(function (a, f) { return a + f.criticos; }, 0);
  filas20.push(['TOTAL', 'ANEXO 3 — LAS ' + facultades.length + ' FACULTADES',
    facultades.reduce(function (a, f) { return a + f.efectivas.length; }, 0),
    CONFIG_A3.FICHAS_ESPERADAS ? CONFIG_A3.FICHAS_ESPERADAS * facultades.length : '—',
    facultades.reduce(function (a, f) { return a + f.completas; }, 0),
    facultades.reduce(function (a, f) { return a + (f.efectivas.length - f.completas); }, 0),
    facultades.reduce(function (a, f) { return a + f.sinProducto; }, 0),
    facultades.reduce(function (a, f) { return a + f.otrosCriticos; }, 0),
    criticosTotal,
    facultades.reduce(function (a, f) { return a + f.observaciones; }, 0),
    estadoDeFacultad_(avanceTotal, criticosTotal).rotulo,
    'Promedio ponderado por campos revisados.', avanceTotal / 100]);

  const hoja20 = escribirHoja_(ss, H.RESUMEN_20,
    ['SIGLA', 'FACULTAD', 'FICHAS', 'FICHAS ESPERADAS', 'COMPLETAS', 'INCOMPLETAS',
     'SIN PRODUCTO', 'OTROS CRÍTICOS', 'CRÍTICOS (TOTAL)', 'OBSERVACIONES', 'ESTADO', 'NOTAS',
     '% AVANCE'],
    filas20,
    facultades.map(function (fac) { return fac.estado.clave; })
              .concat([estadoDeFacultad_(avanceTotal, criticosTotal).clave]));
  if (filas20.length) {
    hoja20.getRange(2, 13, filas20.length, 1).setNumberFormat('0.0%');
    aplicarSemaforoDeAvance_(hoja20, 13, filas20.length);
    hoja20.getRange(filas20.length + 1, 1, 1, 14).setFontWeight('bold');
  }

  /* Hoja 4 — Registro maestro de códigos */
  const maestro = [];
  const sevMaestro = [];
  facultades.forEach(function (fac) {
    fac.maestro.forEach(function (m) {
      const severidad = severidadDeMaestro_(m);
      maestro.push([fac.sigla, m.tipo, m.codigo, m.denominacion,
                    m.fichas, estadoTextoA3_(severidad), m.observacion]);
      sevMaestro.push(severidad);
    });
  });
  escribirHoja_(ss, H.MAESTRO,
    ['FACULTAD', 'TIPO', 'CÓDIGO', 'DENOMINACIÓN', 'FICHAS EN QUE APARECE',
     'ESTADO', 'OBSERVACIÓN'],
    maestro, sevMaestro, false);

  // El avance general de los dos anexos (RESUMEN_GENERAL) ya no se genera
  // aquí: pasó a su propio script (ResumenGeneral.gs), disparado por su propio
  // ítem del menú, para no recalcularlo en cada corrida del Anexo 3. Si quedó
  // una hoja de una versión anterior, se retira para no dejar datos viejos.
  CONFIG_A3.HOJAS_RETIRADAS.forEach(function (nombre) {
    const sobrante = ss.getSheetByName(nombre);
    if (sobrante && ss.getSheets().length > 1) {
      ss.deleteSheet(sobrante);
      Logger.log('Se retiró la hoja ' + nombre + ', que ya no forma parte de este reporte.');
    }
  });

  // El libro es compartido con la auditoría del Anexo 1: no se borra ninguna
  // otra hoja ajena.
  ss.setActiveSheet(ss.getSheetByName(H.RESUMEN_20));
}


/**
 * Formato condicional sobre la columna de % de avance del resumen de las 20
 * facultades. Se deja como REGLA y no como color fijo para que siga
 * funcionando si alguien edita los porcentajes a mano.
 */
function aplicarSemaforoDeAvance_(hoja, columna, numFilas) {
  const rango = hoja.getRange(2, columna, numFilas, 1);
  const reglas = [];
  CONFIG_A3.TRAMOS_AVANCE.forEach(function (tramo) {
    const color = CONFIG_A3.COLORES[tramo.clave];
    reglas.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThanOrEqualTo(tramo.desde / 100)
      .setBackground(color.fondo).setFontColor(color.texto)
      .setRanges([rango]).build());
  });
  // Las reglas se evalúan en orden: primero 95, luego 80, 60 y 0.
  hoja.setConditionalFormatRules(hoja.getConditionalFormatRules().concat(reglas));
}

/**
 * Libro del Anexo 3.
 *
 * El script vive en el libro de revisión, no en el Anexo 3, así que el libro
 * activo NO sirve como origen. Se usa el activo solo cuando de verdad contiene
 * pestañas de facultad —por si alguien pega este archivo dentro del Anexo 3—; en
 * cualquier otro caso se abre el Anexo 3 por su ID.
 */
function abrirAnexo3_() {
  const activo = SpreadsheetApp.getActiveSpreadsheet();
  if (activo && localizarFacultades_(activo).length) return activo;
  try {
    return SpreadsheetApp.openById(CONFIG_A3.SOURCE_SHEET_ID);
  } catch (e) {
    throw new Error('No se pudo abrir el Anexo 3 (' + CONFIG_A3.SOURCE_SHEET_ID +
                    '). Verifique el ID en CONFIG_A3.SOURCE_SHEET_ID. Detalle: ' + e.message);
  }
}

/**
 * Revisa las pestañas de facultad del Anexo 3 y escribe UN archivo de salida
 * con todas ellas. Devuelve la URL del archivo creado.
 */
function ejecutarRevisionAnexo3() {
  const libro = abrirAnexo3_();
  aplicarConfigDeHoja_(libro);

  const todas = localizarFacultades_(libro);
  if (!todas.length) {
    throw new Error('No se encontró ninguna pestaña de facultad con el formato F##_SIGLA ' +
                    '(F01_FM, F02_FDCP…). Pestañas del libro: ' +
                    libro.getSheets().map(function (h) { return '"' + h.getName() + '"'; }).join(', '));
  }
  const facultades = filtrarFacultades_(todas, CONFIG_A3.SOURCE_TAB_NAME);
  if (!facultades.length) {
    throw new Error('El filtro SOURCE_TAB_NAME ("' + CONFIG_A3.SOURCE_TAB_NAME +
                    '") no coincide con ninguna de las pestañas detectadas: ' +
                    todas.map(function (f) { return f.pestana; }).join(', ') + '.');
  }

  const revisadas = facultades.map(revisarFacultad_);
  const ss = abrirLibroDestino_();
  escribirResultado_(ss, revisadas);
  // El historial de revisiones vive en otro archivo del proyecto. Se protege
  // por partida doble: si la función no está, la revisión se completa igual; y
  // si está pero falla, tampoco se pierde el reporte ya escrito.
  const avanceA3 = calcularPorcentajeGeneralAnexo3_(revisadas);
  if (typeof registrarRevision === 'function') {
    try {
      registrarRevision('Anexo 3', avanceA3);
    } catch (e) {
      Logger.log('No se pudo registrar el avance del Anexo 3 (' + avanceA3 + '%) en el ' +
                 'historial: ' + e.message);
    }
  } else {
    Logger.log('No se encontró la función registrarRevision(): el avance del Anexo 3 (' +
               avanceA3 + '%) no se registró. Falta el archivo HistorialRevisiones.gs ' +
               'en el proyecto.');
  }

  const url = ss.getUrl();
  const fichas = revisadas.reduce(function (a, f) { return a + f.efectivas.length; }, 0);
  const hojas = [CONFIG_A3.HOJAS.DETALLE, CONFIG_A3.HOJAS.RESUMEN,
                 CONFIG_A3.HOJAS.RESUMEN_20, CONFIG_A3.HOJAS.MAESTRO].join(', ');
  Logger.log('Revisión del Anexo 3 — ' + revisadas.length + ' facultad(es), ' +
             fichas + ' ficha(s). Hojas: ' + hojas + '. ' + url);
  notificarA3_('Revisión del Anexo 3 terminada.\n\n' + revisadas.length +
    ' facultad(es) y ' + fichas + ' ficha(s) revisadas.\n\nSe actualizaron las hojas:\n' +
    hojas);
  return url;
}

/**
 * Menú del libro.
 *
 * Si el archivo del Anexo 1 también está en el proyecto, habrá DOS funciones
 * `onOpen` y Apps Script solo ejecutará una de ellas. Por eso las dos arman el
 * MISMO menú: dé igual cuál gane, los ítems disponibles son los mismos. Cada
 * ítem se agrega solo si su función existe.
 */
function onOpen() {
  try {
    const menu = SpreadsheetApp.getUi().createMenu("Auditoría OGPL");

    if (typeof ejecutarAuditoriaAnexo1 === "function") {
      menu.addItem("Ejecutar auditoría del Anexo 1", "ejecutarAuditoriaAnexo1");
    }
    if (typeof ejecutarRevisionAnexo3 === "function") {
      menu.addItem("Ejecutar revisión del Anexo 3", "ejecutarRevisionAnexo3");
    }
    if (typeof ejecutarRevisionAnexo4 === "function") {
      menu.addItem("Ejecutar revisión del Anexo 4", "ejecutarRevisionAnexo4");
    }
    if (typeof actualizarResumenGeneral === "function") {
      menu.addSeparator()
          .addItem("Actualizar resumen general", "actualizarResumenGeneral");
    }
    if (typeof convertirSeparadorAntiguo === "function") {
      menu.addSeparator()
          .addItem("Convertir observaciones antiguas a renglones", "convertirSeparadorAntiguo");
    }
    menu.addToUi();
  } catch (e) {
    // Sin interfaz disponible: no hay menú que crear.
  }
}

/**
 * Alias de compatibilidad: en la v1 esta función recorría las facultades una
 * por una y dejaba un archivo por cada una. Ahora `ejecutarRevisionAnexo3` ya
 * las revisa todas de una vez, así que apunta a ella.
 */
function revisarTodasLasFacultadesA3() {
  return ejecutarRevisionAnexo3();
}

/** Aviso al usuario cuando hay interfaz; al registro cuando no la hay. */
/**
 * Porcentaje general del Anexo 3 (0–100).
 *
 * Se calcula con los mismos datos que produjeron el reporte, NO leyendo la
 * celda del total. Leer `L22` fallaba por tres motivos a la vez:
 *
 *  · La celda lleva formato de porcentaje, así que `getValue()` devuelve la
 *    fracción `0.85`, no el texto `"85%"`. Quitarle el signo con `replace`
 *    dejaba 0.85, que registrado como porcentaje es prácticamente cero.
 *  · La fila 22 solo es la del TOTAL cuando se revisan exactamente 20
 *    facultades. Si alguna pestaña no se detecta o se filtra, el TOTAL se
 *    mueve y L22 cae sobre otra facultad, o sobre una celda vacía.
 *  · Obligaba a releer el libro recién escrito, con lo que cualquier problema
 *    de permiso o de nombre de hoja devolvía 0 en silencio.
 *
 * Es el mismo promedio ponderado por campos revisados que se escribe en la fila
 * TOTAL: campos completos entre campos aplicables de todas las facultades.
 */
function calcularPorcentajeGeneralAnexo3_(facultadesRevisadas) {
  const facultades = facultadesRevisadas || [];
  const campos = facultades.reduce(function (a, f) { return a + (f.campos || 0); }, 0);
  const completos = facultades.reduce(function (a, f) { return a + (f.completos || 0); }, 0);
  return campos ? Math.round(completos * 1000 / campos) / 10 : 0;
}

/**
 * Convierte a número (0–100) un porcentaje escrito de cualquiera de las formas
 * en que puede venir de una celda: `85`, `85%`, `"85 %"`, `0.85` o `85,3`.
 */
function porcentajeANumero_(valor) {
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
 * Respaldo: el mismo porcentaje leído de la hoja ya escrita, para quien lo
 * necesite desde fuera de la corrida. Busca la fila TOTAL por su etiqueta y la
 * columna por su encabezado, y normaliza la fracción a porcentaje.
 */
function leerAvanceTotalA3_() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG_A3.DESTINO_SHEET_ID);
    const hoja = ss.getSheetByName(CONFIG_A3.HOJAS.RESUMEN_20);
    if (!hoja) return null;

    const valores = hoja.getDataRange().getValues();
    if (!valores.length) return null;

    let col = -1;
    valores[0].forEach(function (c, i) {
      if (col === -1 && normalizar_(c) === '% AVANCE') col = i;
    });
    if (col === -1) return null;

    for (let f = valores.length - 1; f > 0; f--) {
      if (normalizar_(valores[f][0]) === 'TOTAL') return porcentajeANumero_(valores[f][col]);
    }
    return null;
  } catch (e) {
    return null;
  }
}


function notificarA3_(mensaje) {
  try {
    SpreadsheetApp.getUi().alert(mensaje);
  } catch (e) {
    Logger.log(mensaje);   // ejecución desde el editor o por disparador
  }
}

/**
 * Lista en el registro las pestañas del libro y cuáles se reconocen como
 * facultad. Útil cuando alguna no aparece en el reporte: casi siempre es que su
 * nombre no sigue el formato `F##_SIGLA`.
 */
function listarPestanasA3() {
  const libro = abrirAnexo3_();
  const lineas = libro.getSheets().map(function (h, i) {
    const f = leerPestanaFacultad_(h.getName());
    return (i + 1) + '. "' + h.getName() + '"' +
           (f ? '  → ' + f.codigo + ' ' + f.sigla : '  → (no es pestaña de facultad)');
  });
  Logger.log('Pestañas del Anexo 3:\n' + lineas.join('\n'));
  return lineas;
}

