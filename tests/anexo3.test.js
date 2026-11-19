/**
 * Pruebas de los validadores del Anexo 3.
 *
 * Apps Script no corre fuera de Google, así que el .gs se carga en Node con
 * stubs de SpreadsheetApp, DriveApp, Utilities, Session y Logger. Solo se
 * prueban las funciones puras: validadores de codificación, parseo de la
 * pestaña en fichas técnicas, registro maestro y cotejo con el Anexo 1.
 *
 *   node tests/anexo3.test.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const FUENTE = path.join(__dirname, "..", "apps-script", "Anexo3_Revision_v4.gs");

const SHIM = `
var SpreadsheetApp = {
  getUi: function () { throw new Error("sin interfaz"); },
  getActiveSpreadsheet: function () { return null; },
  openById: function () { throw new Error("sin Anexo 1"); }
};
var DriveApp = {};
var Utilities = { formatDate: function () { return "2026-01-01 00:00"; } };
var Session = { getScriptTimeZone: function () { return "America/Lima"; } };
var Logger = { log: function () {} };
module.exports = {
  CONFIG_A3, padreDeProductoA3_, buscarEnOtroFormato_, resolverEquivalenciaA3_, leerEquivalenciasA1_, normalizar_, esVacio_, esEtiqueta_, nivelDeCodigo_, extraerCodigosA3_,
  denominacionDeA3_, nivelesEsperados_, validarCodigoA3_, validarCeldaA3_,
  siglaDePestana_, facultadPorSigla_, formularioDominante_, esInicioDeFicha_,
  localizarFichas_, buscarFilaEtiqueta_, valorDeEtiqueta_, catalogoDeEtiquetas_,
  construirMaestro_, construirCotejo_, revisarFicha_, letraColumna_,
  leerPestanaFacultad_, localizarFacultades_, filtrarFacultades_, detectarDuplicados_,
  peorSeveridad_, severidadPorDefecto_, severidadDeErrorDeCodigo_, severidadDeFicha_,
  severidadDeMaestro_, severidadDeCotejo_, estadoDeFacultad_, ESCALA_SEVERIDAD,
  emparejarCodigosYDenominaciones_, limpiarDenominacion_, revisarFilasDeDescripcion_,
  claveDenominacion_, leerCatalogoAnexo1_, expandirCombinadas_,
  porcentajeANumero_, calcularPorcentajeGeneralAnexo3_,
  estadoTextoA3_, ubicacionCeldaA3_
};
module.exports.SpreadsheetApp = SpreadsheetApp;
`;

function cargarModulo() {
  const destino = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "a3-")), "modulo.js");
  fs.writeFileSync(destino, fs.readFileSync(FUENTE, "utf8") + SHIM);
  return require(destino);
}

const M = cargarModulo();

let total = 0;
let fallas = 0;

function chequear(descripcion, condicion) {
  total++;
  if (!condicion) {
    fallas++;
    console.log("  ✗ " + descripcion);
  }
}

function bloque(titulo, fn) {
  console.log("\n" + titulo);
  const antes = fallas;
  fn();
  console.log(antes === fallas ? "  todo correcto" : "  " + (fallas - antes) + " fallas");
}

/* ────────────────────────────────────────────────────────────────────────── */

bloque("Normalización y celdas vacías", function () {
  chequear("quita tildes y mayúsculiza", M.normalizar_("Definición") === "DEFINICION");
  chequear("quita los dos puntos finales", M.normalizar_("DEFINICIÓN DEL PROCESO:") === "DEFINICION DEL PROCESO");
  chequear("colapsa espacios", M.normalizar_("  NOMBRE   Y  APELLIDOS ") === "NOMBRE Y APELLIDOS");
  chequear("celda en blanco es vacía", M.esVacio_("   "));
  chequear("NINGUNO cuenta como vacío", M.esVacio_("Ninguno"));
  chequear("un guion cuenta como vacío", M.esVacio_("-"));
  chequear("el cero NO es vacío (versión 0)", !M.esVacio_("0"));
  chequear("un texto normal no es vacío", !M.esVacio_("Decano de Facultad"));
  chequear("etiqueta reconocida sin tildes", M.esEtiqueta_("Vinculación", ["VINCULACION"]));
  chequear("etiqueta no coincide por subcadena", !M.esEtiqueta_("NOMBRE Y APELLIDOS", ["NOMBRE"]));
});

bloque("Extracción de códigos y denominación", function () {
  chequear("código suelto", M.extraerCodigosA3_("PR.01_F02").length === 1);
  chequear("dos códigos en una celda",
    M.extraerCodigosA3_("PE.03.01.01_F02  PE.03.01.04_F02").length === 2);
  chequear("código con denominación pegada",
    M.extraerCodigosA3_("PR.122_F02 OFICINA DE PLANES Y PROGRAMAS - OGPL")[0] === "PR.122_F02");
  chequear("celda sin código", M.extraerCodigosA3_("Rectorado, Unidad de Matrícula").length === 0);
  chequear("denominación separada del código",
    M.denominacionDeA3_("PR.122_F02 OFICINA DE PLANES") === "OFICINA DE PLANES");
  chequear("denominación vacía si solo hay código",
    M.denominacionDeA3_("PM.01.05.01_F02") === "");
  chequear("nivel 1", M.nivelDeCodigo_("PE.02_F02") === 1);
  chequear("nivel 2", M.nivelDeCodigo_("PE.02.01_F02") === 2);
  chequear("nivel 3", M.nivelDeCodigo_("PM.01.03.02_F02") === 3);
  chequear("nivel 4 de la FDCP", M.nivelDeCodigo_("PM.01.01.02.05_F02") === 4);
  chequear("un texto no es código", M.nivelDeCodigo_("GESTIÓN DE PLANES") === 0);
  chequear("A → 1 en la letra de columna", M.letraColumna_(1) === "A");
  chequear("K → 11", M.letraColumna_(11) === "K");
  chequear("AA → 27", M.letraColumna_(27) === "AA");
});

bloque("Reglas 2, 3 y 6 — PR / EN / BE", function () {
  chequear("proveedor válido", M.validarCodigoA3_("PR.01_F02", "PR", "F02", true).ok);
  chequear("correlativo de tres dígitos", M.validarCodigoA3_("PR.122_F02", "PR", "F02", true).ok);
  chequear("entrada válida", M.validarCodigoA3_("EN.196_F02", "EN", "F02", true).ok);
  chequear("beneficiario válido", M.validarCodigoA3_("BE.07_F02", "BE", "F02", true).ok);
  chequear("prefijo cambiado se rechaza", !M.validarCodigoA3_("BE.01_F02", "PR", "F02", true).ok);
  chequear("formulario de otra facultad se rechaza",
    !M.validarCodigoA3_("PR.01_F05", "PR", "F02", true).ok);
  chequear("sin sufijo de formulario se rechaza", !M.validarCodigoA3_("PR.01", "PR", "F02", true).ok);
  chequear("guion en lugar de guion bajo se rechaza",
    !M.validarCodigoA3_("PR.01-F02", "PR", "F02", true).ok);
  chequear("el motivo nombra la estructura esperada",
    M.validarCodigoA3_("PR1_F02", "PR", "F02", true).motivo.indexOf("PR.XX_FYY") !== -1);
  chequear("la corrección propone el formulario de la facultad",
    M.validarCodigoA3_("PR1_F02", "PR", "F02", true).correccion.indexOf("F02") !== -1);
});

bloque("Niveles esperados por campo", function () {
  chequear("definición › código: un nivel",
    M.nivelesEsperados_("PROCESO_N1", false).join() === "1");
  chequear("descripción › procesos: dos niveles",
    M.nivelesEsperados_("PROCESO_N2", false).join() === "2");
  chequear("descripción › salidas: tres niveles",
    M.nivelesEsperados_("SALIDA", false).join() === "3");
  chequear("registros: tres niveles", M.nivelesEsperados_("REGISTRO", false).join() === "3");
  chequear("facultad de nivel 2: procesos admiten 2 y 3",
    M.nivelesEsperados_("PROCESO_N2", true).join() === "2,3");
  chequear("facultad de nivel 2: salidas admiten 3 y 4",
    M.nivelesEsperados_("SALIDA", true).join() === "3,4");
});

bloque("Reglas 4 y 5 — procesos y salidas", function () {
  chequear("proceso de nivel 1 válido en la definición",
    M.validarCodigoA3_("PE.02_F02", "PROCESO_N1", "F02", true).ok);
  chequear("la definición NO admite el desagregado de salidas",
    !M.validarCodigoA3_("PE.02.01_F02", "PROCESO_N1", "F02", true).ok);
  chequear("proceso de la columna F válido",
    M.validarCodigoA3_("PE.01.01_F02", "PROCESO_N2", "F02", false).ok);
  chequear("salida de la columna H válida",
    M.validarCodigoA3_("PE.01.01.01_F02", "SALIDA", "F02", false).ok);
  chequear("salida de un solo nivel se rechaza",
    !M.validarCodigoA3_("PE.01_F02", "SALIDA", "F02", false).ok);

  const varios = M.validarCeldaA3_("PE.03.01_F02 GESTIÓN DE CONVENIOS  PE.03.02_F02 PRÁCTICAS",
                                   "PROCESO_N2", "F02", true, true);
  chequear("regla 4: dos procesos en una celda es error", varios.errores.length === 1);
  chequear("regla 4: el mensaje cita la regla", varios.errores[0].correccion.indexOf("Regla 4") !== -1);

  const salidas = M.validarCeldaA3_("PE.03.01.01_F02  PE.03.01.04_F02", "SALIDA", "F02", true, false);
  chequear("varias salidas en una celda son válidas", salidas.errores.length === 0);
  chequear("se recuperan las dos salidas", salidas.codigos.length === 2);

  const sinCodigo = M.validarCeldaA3_("Rectorado, Unidad de Matrícula", "PR", "F02", true, false);
  chequear("celda sin código se observa", sinCodigo.errores.length === 1);

  const vacia = M.validarCeldaA3_("", "PR", "F02", true, false);
  chequear("celda vacía se marca como vacía, no como error", vacia.vacio && vacia.errores.length === 0);
});

bloque("Excepción de la FDCP — facultad de nivel 2", function () {
  const conExcepcion = M.validarCodigoA3_("PM.01.01.02.05_F02", "REGISTRO", "F02", true);
  chequear("registro de cuatro niveles se admite", conExcepcion.ok);
  chequear("y queda marcado como excepción", conExcepcion.excepcionNivel2 === true);
  chequear("el mismo código en una facultad de nivel 1 es error",
    !M.validarCodigoA3_("PM.01.01.02.05_F02", "REGISTRO", "F02", false).ok);

  const proceso = M.validarCodigoA3_("PE.01.01.01_F02", "PROCESO_N2", "F02", true);
  chequear("proceso de tres niveles convive con los de dos", proceso.ok && proceso.excepcionNivel2);

  const celda = M.validarCeldaA3_("PM.01.01.02.05_F02 CONSTANCIA OFICIAL", "REGISTRO", "F02", true, false);
  chequear("la celda no acumula errores por la excepción", celda.errores.length === 0);
  chequear("pero sí deja nota", celda.notas.length === 1);

  const dosNiveles = M.validarCodigoA3_("PE.02.01_F02", "PROCESO_N2", "F02", true);
  chequear("el nivel normal sigue sin generar nota", dosNiveles.ok && !dosNiveles.excepcionNivel2);
});

bloque("Detección automática de las pestañas de facultad", function () {
  chequear("F01_FM se reconoce", M.leerPestanaFacultad_("F01_FM").sigla === "FM");
  chequear("y trae su código", M.leerPestanaFacultad_("F01_FM").codigo === "F01");
  chequear("y su orden numérico", M.leerPestanaFacultad_("F20_FII").orden === 20);
  chequear("F02_FDCP se reconoce", M.leerPestanaFacultad_("F02_FDCP").sigla === "FDCP");
  chequear("trae el nombre del catálogo",
    M.leerPestanaFacultad_("F02_FDCP").nombre.indexOf("DERECHO") !== -1);
  chequear("admite minúsculas", M.leerPestanaFacultad_("f03_flch").sigla === "FLCH");
  chequear("admite guion y espacios", M.leerPestanaFacultad_(" F04 - FFB ").sigla === "FFB");
  chequear("una sigla fuera del catálogo igual se acepta",
    M.leerPestanaFacultad_("F17_FXX").sigla === "FXX");
  chequear("y queda sin nombre en vez de inventarlo",
    M.leerPestanaFacultad_("F17_FXX").nombre === "");
  chequear("DASHBOARD no es facultad", M.leerPestanaFacultad_("DASHBOARD") === null);
  chequear("CONFIG_A3 no es facultad", M.leerPestanaFacultad_("CONFIG_A3") === null);
  chequear("el formato antiguo 2.FDCP ya no se toma por facultad",
    M.leerPestanaFacultad_("2.FDCP") === null);

  function libroCon(nombres) {
    return {
      getSheets: function () {
        return nombres.map(function (n) { return { getName: function () { return n; } }; });
      }
    };
  }
  const libro = libroCon(["DASHBOARD", "F03_FLCH", "F01_FM", "CONFIG_A3", "F20_FII", "F02_FDCP"]);
  const detectadas = M.localizarFacultades_(libro);
  chequear("se detectan solo las pestañas de facultad", detectadas.length === 4);
  chequear("y se ordenan F01 → F20, no por el orden de las pestañas",
    detectadas.map(function (f) { return f.codigo; }).join(",") === "F01,F02,F03,F20");
  chequear("cada una conserva su hoja", typeof detectadas[0].hoja.getName === "function");

  chequear("sin filtro se revisan todas",
    M.filtrarFacultades_(detectadas, "").length === 4);
  chequear("null también significa todas",
    M.filtrarFacultades_(detectadas, null).length === 4);
  chequear("se puede filtrar por sigla",
    M.filtrarFacultades_(detectadas, "FDCP").map(function (f) { return f.sigla; }).join() === "FDCP");
  chequear("por código de formulario",
    M.filtrarFacultades_(detectadas, "F01").map(function (f) { return f.sigla; }).join() === "FM");
  chequear("por nombre completo de la pestaña",
    M.filtrarFacultades_(detectadas, "F03_FLCH").length === 1);
  chequear("y por varias a la vez",
    M.filtrarFacultades_(detectadas, "FDCP, F20_FII").length === 2);
  chequear("un filtro que no coincide devuelve vacío",
    M.filtrarFacultades_(detectadas, "FZZ").length === 0);
});

bloque("Facultad y formulario", function () {
  chequear("sigla desde 2.FDCP", M.siglaDePestana_("2.FDCP") === "FDCP");
  // El Anexo 1 y el Anexo 3 se renombraron a F##_SIGLA: el guion bajo es
  // carácter de palabra, así que sin tratarlo como separador la pestaña no se
  // encontraba y todo el cotejo salía "no verificable".
  chequear("sigla desde el formato vigente F02_FDCP",
    M.siglaDePestana_("F02_FDCP") === "FDCP");
  chequear("F01_FM no se confunde con FMV", M.siglaDePestana_("F01_FM") === "FM");
  chequear("F08_FMV se resuelve bien", M.siglaDePestana_("F08_FMV") === "FMV");
  chequear("F11_FCC no se confunde con FCCSS", M.siglaDePestana_("F11_FCC") === "FCC");
  chequear("F15_FCCSS se resuelve bien", M.siglaDePestana_("F15_FCCSS") === "FCCSS");
  chequear("sigla desde 1.FM", M.siglaDePestana_("1.FM") === "FM");
  chequear("FMV no se confunde con FM", M.siglaDePestana_("8.FMV") === "FMV");
  chequear("FCCSS no se confunde con FCC", M.siglaDePestana_("15.FCCSS") === "FCCSS");
  chequear("pestaña ajena no devuelve sigla", M.siglaDePestana_("DASHBOARD") === null);
  chequear("formulario oficial de la FDCP", M.facultadPorSigla_("FDCP").formulario === "F02");
  chequear("sufijo dominante de la pestaña",
    M.formularioDominante_([["PR.01_F02"], ["EN.02_F02"], ["BE.03_F05"]]) === "F02");
  chequear("sin códigos no hay dominante", M.formularioDominante_([["texto"]]) === null);
});

/* ── Pestaña de prueba con la forma real de la hoja 2.FDCP ──────────────── */

const V = [
  ["", "", "", "", "", "", "", "", "", "", ""],
  ["", "F02- FACULTAD DE DERECHO Y CIENCIAS POLÍTICAS - ANEXO 3", "", "", "", "", "", "", "", "", ""],
  ["Nombre", "Gestión de la Calidad y Mejora Continua", "", "", "", "", "Codigo", "PE.02_F02", "", "", ""],
  ["Responsable", "Jefe de Oficina de Calidad", "", "", "", "", "Tipo", "Estratégico", "", "", ""],
  ["Alcance", "El proceso abarca…", "", "", "", "", "Versión", "1", "", "", ""],
  ["Vinculación", "OEI.01 - Mejorar la formación", "", "", "", "", "", "", "", "", ""],
  ["Objetivo", "Gestionar la mejora continua", "", "", "", "", "", "", "", "", ""],
  ["DESCRIPCIÓN DEL PROCESO", "", "", "", "", "", "", "", "", "", ""],
  ["", "Proveedores", "", "Entradas", "", "Proceso", "", "Salidas", "", "Beneficiarios", ""],
  ["", "PR.04_F02", "SINEACE", "EN.07_F02", "Modelo de acreditación", "PE.02.01_F02", "Gestión de la cultura",
   "PE.02.01.01_F02", "Plan de capacitación", "BE.01_F02", "Autoridades"],
  ["", "PR.05_F02", "OCCAA", "EN.08_F02", "Lineamientos", "PE.02.02_F02", "Aseguramiento",
   "PE.02.02.02_F02", "Programas acreditados", "BE.02_F02", "Docentes"],
  ["EJECUCIÓN DEL PROCESO", "", "", "", "", "", "", "", "", "", ""],
  ["RECURSOS", "Humanos", "1 jefe 1 técnico", "Registros", "PE.02.01.02_F02 Informe de desarrollo", "",
   "Indicadores", "- Porcentaje de informes", "", "", ""],
  ["RECURSOS", "Físicos", "1 oficina", "", "", "", "", "", "", "", ""],
  ["RECURSOS", "Tecnológicos", "2 computadoras", "Riesgos", "- Baja participación", "", "Controles",
   "- Registro de asistencia", "", "", ""],
  ["RECURSOS", "Informáticos", "Quipucamayoc, SGD", "", "", "", "", "", "", "", ""],
  ["FORMALIZACIÓN DEL PROCESO", "", "", "", "", "", "", "", "", "", ""],
  ["", "Unidad", "", "Cargo", "", "Nombre y Apellidos", "", "Firma", "", "", ""],
  ["Elaboración", "Unidad de Planificación", "", "Jefe", "", "Juan Reyes", "", "", "", "", ""],
  ["Revisión", "Oficina de Calidad", "", "Jefe", "", "Ana Torres", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", "", ""],
  ["FICHA TÉCNICA DE PRODUCTO Y PROCESO", "", "", "", "", "", "", "", "", "", ""],
  ["DEFINICIÓN DEL PROCESO:", "Gestión de Relaciones Interinstitucionales", "", "", "", "", "", "", "", "", ""],
  ["Nombre", "Gestión de Relaciones Interinstitucionales", "", "", "", "", "Codigo", "PE.03_F02", "", "", ""],
  ["Responsable", "Decano de Facultad", "", "", "", "", "Tipo", "Estratégico", "", "", ""],
  ["Alcance", "", "", "", "", "", "Versión", "1", "", "", ""],
  ["Vinculación", "OEI.02 – Fortalecer la investigación", "", "", "", "", "", "", "", "", ""],
  ["Objetivo", "Gestionar alianzas", "", "", "", "", "", "", "", "", ""],
  ["DESCRIPCIÓN DEL PROCESO", "", "", "", "", "", "", "", "", "", ""],
  ["", "Proveedores", "", "Entradas", "", "Proceso", "", "Salidas", "", "Beneficiarios", ""],
  ["", "PR.04_F02", "SINEACE Perú", "EN.12_F02", "Solicitud de convenio",
   "PE.03.01_F02 Gestión de convenios  PE.03.02_F02 Prácticas", "",
   "PE.03.01.01_F02", "Convenios firmados", "BE.01_F05", "Autoridades"],
  ["EJECUCIÓN DEL PROCESO", "", "", "", "", "", "", "", "", "", ""],
  ["RECURSOS", "Humanos", "1 director", "Registros", "PM.01.01.02.05_F02 Constancia de ayudantía", "",
   "Indicadores", "- Porcentaje de convenios", "", "", ""],
  ["RECURSOS", "Físicos", "1 oficina", "", "", "", "", "", "", "", ""],
  ["RECURSOS", "Tecnológicos", "", "Riesgos", "", "", "Controles", "", "", "", ""],
  ["RECURSOS", "Informáticos", "SGD", "", "", "", "", "", "", "", ""],
  ["FORMALIZACIÓN DEL PROCESO", "", "", "", "", "", "", "", "", "", ""],
  ["", "Unidad", "", "Cargo", "", "Nombre y Apellidos", "", "Firma", "", "", ""],
  ["Elaboración", "Unidad de Planificación", "", "", "", "", "", "", "", "", ""],
  ["Revisión", "", "", "", "", "", "", "", "", "", ""]
];

const CTX = {
  valores: V,
  formulario: "F02",
  permiteNivel2: true,
  etiquetas: M.catalogoDeEtiquetas_()
};

const BLOQUES = M.localizarFichas_(V);
const F1 = M.revisarFicha_(CTX, BLOQUES[0], 1);
const F2 = M.revisarFicha_(CTX, BLOQUES[1], 2);

bloque("Partición de la pestaña en fichas técnicas", function () {
  chequear("dos fichas técnicas", BLOQUES.length === 2);
  chequear("la primera empieza en la fila del NOMBRE", BLOQUES[0].inicio === 2);
  chequear("la primera no invade el título de la segunda", BLOQUES[0].fin === 19);
  chequear("la segunda empieza en su fila de NOMBRE", BLOQUES[1].inicio === 23);
  chequear("una ficha se reconoce sin el título", M.esInicioDeFicha_(V[2]));
  chequear("una fila cualquiera no abre ficha", !M.esInicioDeFicha_(V[9]));
  chequear("se ubica la sección de ejecución",
    M.buscarFilaEtiqueta_(V, 2, 20, ["EJECUCION DEL PROCESO"]).fila === 11);
  chequear("valor a la derecha de la etiqueta",
    M.valorDeEtiqueta_(V[3], 0, CTX.etiquetas).valor === "Jefe de Oficina de Calidad");
  chequear("una etiqueta contigua no se toma por valor",
    M.valorDeEtiqueta_(V[25], 0, CTX.etiquetas).valor === "");
});

bloque("Ficha completa — sin hallazgos", function () {
  chequear("nombre recuperado", F1.nombre === "Gestión de la Calidad y Mejora Continua");
  chequear("código recuperado", F1.codigo === "PE.02_F02");
  chequear("sin campos faltantes", F1.faltantes.length === 0);
  chequear("sin errores de codificación", F1.erroresCodificacion === 0);
  chequear("marcada como completa", F1.completa === true);
  chequear("avance del 100%", F1.avance === 100);
  chequear("todas las secciones aparecen en el detalle",
    ["Definición", "Descripción", "Ejecución", "Formalización"].every(function (s) {
      return F1.detalle.some(function (d) { return d.seccion === s; });
    }));
  chequear("la firma no cuenta como campo faltante",
    !F1.faltantes.some(function (x) { return x.indexOf("Firma") !== -1; }));
  chequear("la firma sí se informa como opcional",
    F1.detalle.some(function (d) { return d.campo.indexOf("Firma") !== -1 && d.completo === "Opcional"; }));
  chequear("los proveedores llegan al registro maestro",
    F1.codigosMaestro.filter(function (c) { return c.tipo === "Proveedores"; }).length === 2);
  chequear("salidas y registros llegan al cotejo",
    F1.cotejo.filter(function (c) { return c.tipo === "Salida"; }).length === 2 &&
    F1.cotejo.filter(function (c) { return c.tipo === "Registro"; }).length === 1);
});

bloque("Ficha con defectos", function () {
  function faltaReportada(nombre) {
    return F2.faltantes.some(function (x) { return x.indexOf(nombre) === 0; });
  }
  chequear("el alcance vacío se reporta", faltaReportada("Definición › Alcance"));
  chequear("los riesgos vacíos se reportan", faltaReportada("Ejecución › Riesgos"));
  chequear("los controles vacíos se reportan", faltaReportada("Ejecución › Controles"));
  chequear("el cargo faltante en Elaboración se reporta",
    faltaReportada("Formalización › Elaboracion › Cargo"));
  chequear("la unidad faltante en Revisión se reporta",
    faltaReportada("Formalización › Revision › Unidad"));
  chequear("dos procesos en una celda cuentan como error",
    F2.detalle.some(function (d) { return d.observacion.indexOf("Regla 4") !== -1; }));
  chequear("el beneficiario con formulario ajeno cuenta como error",
    F2.detalle.some(function (d) { return d.observacion.indexOf("F05") !== -1; }));
  chequear("hay al menos dos errores de codificación", F2.erroresCodificacion >= 2);
  chequear("no está completa", F2.completa === false);
  chequear("el avance queda por debajo del 100%", F2.avance < 100);
  chequear("el registro de cuatro niveles no suma error",
    !F2.detalle.some(function (d) {
      return d.campo === "Registros" && d.estructura === "No";
    }));
  chequear("y se cuenta como excepción de nivel 2, una sola vez por código",
    F2.excepcionesNivel2 >= 1);
  chequear("sin repetir la misma frase en cada fila del detalle",
    F2.detalle.filter(function (d) {
      return d.observacion.indexOf("nivel 2") !== -1;
    }).length === 0);
});

bloque("Ubicación de cada campo revisado", function () {
  function buscar(ficha, seccion, campo) {
    let hallada = null;
    ficha.detalle.forEach(function (d) {
      if (!hallada && d.seccion === seccion && d.campo === campo) hallada = d;
    });
    return hallada;
  }

  chequear("la fila del campo es la que se ve en la hoja (base 1)",
    buscar(F1, "Definición", "Responsable").fila === 4);
  chequear("y la celda apunta al valor, no a la etiqueta",
    buscar(F1, "Definición", "Responsable").celda === "B4");
  chequear("el código de la definición se ubica en su propia celda",
    buscar(F1, "Definición", "Código").celda === "H3");
  chequear("un campo de ejecución trae su celda",
    buscar(F1, "Ejecución", "Registros").celda === "E13");
  chequear("un campo de formalización trae su celda",
    buscar(F1, "Formalización", "Elaboracion › Unidad").celda === "B19");
  chequear("una columna de la descripción informa el rango de filas",
    buscar(F1, "Descripción", "Proveedores").fila === "10–11");
  chequear("un hallazgo de una celda de la descripción trae la celda exacta",
    (function () {
      let d = null;
      F2.detalle.forEach(function (x) {
        if (!d && x.seccion === "Descripción" && x.estructura === "No") d = x;
      });
      return d && d.celda === "F31";
    })());
  chequear("un campo vacío también trae su ubicación",
    buscar(F2, "Definición", "Alcance").fila === 26);
  chequear("la ubicación ya no se repite dentro del texto de la observación",
    buscar(F2, "Definición", "Alcance").observacion.indexOf("fila") === -1);
  chequear("el campo revisado ya no arrastra la fila en su nombre",
    F2.detalle.every(function (d) { return d.campo.indexOf("(fila") === -1; }));
  chequear("el resumen de faltantes indica dónde completar",
    F2.faltantes.some(function (x) { return x.indexOf("(celda ") !== -1; }));
  chequear("toda fila del detalle trae fila o rango",
    F1.detalle.every(function (d) { return d.fila !== "" && d.fila !== undefined; }));
});

bloque("Hoja 4 — registro maestro de códigos", function () {
  const maestro = M.construirMaestro_([
    { tipo: "Proveedores", codigo: "PR.04_F02", denominacion: "SINEACE", ficha: 1 },
    { tipo: "Proveedores", codigo: "PR.04_F02", denominacion: "SINEACE Perú", ficha: 2 },
    { tipo: "Proveedores", codigo: "PR.05_F02", denominacion: "OCCAA", ficha: 1 },
    { tipo: "Beneficiarios", codigo: "BE.01_F02", denominacion: "Autoridades", ficha: 1 },
    { tipo: "Beneficiarios", codigo: "BE.09_F02", denominacion: "Autoridades", ficha: 3 }
  ]);
  const porCodigo = {};
  maestro.forEach(function (m) { porCodigo[m.tipo + "|" + m.codigo] = m; });

  chequear("una fila por código y tipo", maestro.length === 4);
  chequear("un código con dos denominaciones es inconsistente",
    porCodigo["Proveedores|PR.04_F02"].consistente === "No");
  chequear("y se explica el defecto",
    porCodigo["Proveedores|PR.04_F02"].observacion.indexOf("denominaciones distintas") !== -1);
  chequear("un código usado igual siempre es consistente",
    porCodigo["Proveedores|PR.05_F02"].consistente === "Sí");
  chequear("una denominación con dos códigos también se detecta",
    porCodigo["Beneficiarios|BE.01_F02"].consistente === "No");
  chequear("se listan las fichas donde aparece",
    porCodigo["Proveedores|PR.04_F02"].fichas === "1, 2");
});

const SpreadsheetApp = M.SpreadsheetApp;

bloque("Localización de la pestaña del Anexo 1", function () {
  function libroAnexo1(nombres) {
    return {
      getSheetByName: function () { return null; },
      getSheets: function () {
        return nombres.map(function (n) {
          return {
            getName: function () { return n; },
            getLastRow: function () { return 2; },
            getRange: function () {
              return { getValues: function () {
                return [["PE.01_F02 GESTIÓN ESTRATÉGICA", ""],
                        ['PE.01.01.01_F02 PLAN ESTRATÉGICO "FDCP"', "Final / Salida"]];
              } };
            }
          };
        });
      }
    };
  }
  const original = SpreadsheetApp.openById;

  SpreadsheetApp.openById = function () { return libroAnexo1(["F01_FM", "F02_FDCP", "F03_FLCH"]); };
  const nuevo = M.leerCatalogoAnexo1_("FDCP");
  chequear("con el formato vigente se ubica la pestaña", nuevo.disponible === true);
  chequear("y es la de la facultad pedida", nuevo.hoja === "F02_FDCP");
  chequear("se lee su catálogo de productos",
    nuevo.catalogo["PE.01.01.01_F02"] !== undefined);
  chequear("con su denominación",
    nuevo.catalogo["PE.01.01.01_F02"].denominacion.indexOf("PLAN ESTRATÉGICO") !== -1);

  SpreadsheetApp.openById = function () { return libroAnexo1(["1. FM", "2. FDCP"]); };
  chequear("el formato antiguo sigue funcionando",
    M.leerCatalogoAnexo1_("FDCP").hoja === "2. FDCP");

  SpreadsheetApp.openById = function () { return libroAnexo1(["F01_FM", "F03_FLCH"]); };
  const ausente = M.leerCatalogoAnexo1_("FDCP");
  chequear("si la facultad no está, se dice", ausente.disponible === false);
  chequear("y el motivo enumera las pestañas del Anexo 1",
    ausente.motivo.indexOf('"F01_FM"') !== -1);

  SpreadsheetApp.openById = original;

  chequear("las comillas no hacen distintas dos denominaciones iguales",
    M.claveDenominacion_('PLAN ESTRATÉGICO "FDCP"') === M.claveDenominacion_("PLAN ESTRATEGICO FDCP"));
  chequear("ni los guiones ni los puntos",
    M.claveDenominacion_("- PLAN OPERATIVO.") === M.claveDenominacion_("PLAN OPERATIVO"));
  chequear("pero dos productos distintos siguen siendo distintos",
    M.claveDenominacion_("PLAN OPERATIVO") !== M.claveDenominacion_("PLAN ESTRATEGICO"));
});

bloque("Cotejo de los registros contra el Anexo 1", function () {
  // Los registros vienen como los beneficiarios: un código por línea con su
  // denominación. Atribuirles el texto entero de la celda hacía fallar el
  // cotejo de todos ellos aunque estuvieran bien en ambos anexos.
  const pares = M.emparejarCodigosYDenominaciones_(
    "PM.01.01.02.05_F02 CONSTANCIA OFICIAL DE AYUDANTÍA\n" +
    "PM.01.01.03.01_F02 SÍLABOS DE CURSOS DE PREGRADO", "");
  chequear("se separan los dos registros", pares.length === 2);
  chequear("cada uno con su denominación",
    pares[0].denominacion === "CONSTANCIA OFICIAL DE AYUDANTÍA" &&
    pares[1].denominacion === "SÍLABOS DE CURSOS DE PREGRADO");

  const anexo1 = {
    disponible: true, hoja: "F02_FDCP",
    catalogo: {
      "PM.01.01.02.05_F02": { denominacion: "CONSTANCIA OFICIAL DE AYUDANTÍA", tipo: "Parcial / Registro" },
      "PM.01.01.03.01_F02": { denominacion: "SÍLABOS DE CURSOS DE PREGRADO", tipo: "Parcial / Registro" }
    }
  };
  const cotejo = M.construirCotejo_(pares.map(function (par) {
    return { tipo: "Registro", codigo: par.codigo, denominacion: par.denominacion, ficha: 4 };
  }), anexo1);
  chequear("los dos registros cotejan contra el Anexo 1",
    cotejo.every(function (c) { return c.existe === "Sí"; }));
  chequear("y no queda observación", cotejo.every(function (c) { return c.observacion === ""; }));

  // Cómo fallaba antes: el texto entero de la celda como denominación de ambos.
  const comoAntes = M.construirCotejo_(pares.map(function (par) {
    return { tipo: "Registro", codigo: par.codigo, ficha: 4,
             denominacion: "CONSTANCIA OFICIAL DE AYUDANTÍA SÍLABOS DE CURSOS DE PREGRADO" };
  }), anexo1);
  chequear("con la denominación de toda la celda, el cotejo fallaba",
    comoAntes.every(function (c) { return c.existe !== "Sí"; }));
});

bloque("Hoja 5 — cotejo contra el Anexo 1", function () {
  const anexo1 = {
    disponible: true,
    hoja: "FDCP",
    catalogo: {
      "PE.02.01.01_F02": { denominacion: "Plan de capacitación", tipo: "Final / Salida (producto final)" },
      "PE.02.01.02_F02": { denominacion: "Informe de desarrollo", tipo: "Parcial / Registro" },
      "PE.02.02.02_F02": { denominacion: "Programas acreditados y certificados", tipo: "Final / Salida" }
    }
  };
  const cotejo = M.construirCotejo_([
    { tipo: "Salida",   codigo: "PE.02.01.01_F02", denominacion: "Plan de capacitación", ficha: 1 },
    { tipo: "Salida",   codigo: "PE.02.02.02_F02", denominacion: "Programas acreditados", ficha: 1 },
    { tipo: "Salida",   codigo: "PE.03.01.01_F02", denominacion: "Convenios firmados", ficha: 2 },
    { tipo: "Registro", codigo: "PE.02.01.02_F02", denominacion: "Informe de desarrollo", ficha: 1 },
    { tipo: "Registro", codigo: "PE.02.01.01_F02", denominacion: "Plan de capacitación", ficha: 2 }
  ], anexo1);
  const por = {};
  cotejo.forEach(function (c) { por[c.tipo + "|" + c.codigo] = c; });

  chequear("la salida que coincide se marca Sí", por["Salida|PE.02.01.01_F02"].existe === "Sí");
  chequear("la denominación distinta se distingue del ausente",
    por["Salida|PE.02.02.02_F02"].existe === "Sí (denominación distinta)");
  chequear("y se transcribe la denominación del Anexo 1",
    por["Salida|PE.02.02.02_F02"].observacion.indexOf("Programas acreditados y certificados") !== -1);
  chequear("la salida ausente se marca No", por["Salida|PE.03.01.01_F02"].existe === "No");
  chequear("y se cita la regla 5", por["Salida|PE.03.01.01_F02"].observacion.indexOf("Regla 5") !== -1);
  chequear("el registro que coincide se marca Sí", por["Registro|PE.02.01.02_F02"].existe === "Sí");
  chequear("un registro tipificado como final se observa",
    por["Registro|PE.02.01.01_F02"].observacion.indexOf("productos parciales") !== -1);

  const sinA1 = M.construirCotejo_(
    [{ tipo: "Salida", codigo: "PE.01.01.01_F02", denominacion: "X", ficha: 1 }],
    { disponible: false, motivo: "No se pudo leer el Anexo 1: sin permiso." });
  chequear("sin Anexo 1 no se afirma nada", sinA1[0].existe === "No verificable");
  chequear("y se explica por qué", sinA1[0].observacion.indexOf("sin permiso") !== -1);

  const repetida = M.construirCotejo_([
    { tipo: "Salida", codigo: "PE.02.01.01_F02", denominacion: "Plan de capacitación", ficha: 1 },
    { tipo: "Salida", codigo: "PE.02.01.01_F02", denominacion: "Plan de capacitación", ficha: 3 }
  ], anexo1);
  chequear("una salida repetida da una sola fila", repetida.length === 1);
  chequear("con las dos fichas listadas", repetida[0].fichas === "1, 3");
});

bloque("Clasificación de hallazgos — cuatro niveles", function () {
  chequear("la escala va de menor a mayor",
    M.ESCALA_SEVERIDAD.join() === "correcto,incompleto,observacion,critico");
  chequear("manda la más grave", M.peorSeveridad_("incompleto", "critico") === "critico");
  chequear("y da igual el orden de los argumentos",
    M.peorSeveridad_("critico", "incompleto") === "critico");
  chequear("observación pesa más que incompleto",
    M.peorSeveridad_("observacion", "incompleto") === "observacion");
  chequear("lo opcional no arrastra a la ficha",
    M.peorSeveridad_("correcto", "opcional") === "correcto");

  chequear("campo correcto", M.severidadPorDefecto_("Sí", "Sí") === "correcto");
  chequear("campo vacío es incompleto", M.severidadPorDefecto_("N/A", "No") === "incompleto");
  chequear("codificación mal escrita es observación",
    M.severidadPorDefecto_("No", "Sí") === "observacion");
  chequear("la firma es opcional", M.severidadPorDefecto_("N/A", "Opcional") === "opcional");

  chequear("un código con el formulario de otra facultad es crítico",
    M.severidadDeErrorDeCodigo_([{ motivo: 'Sufijo de formulario "F05" distinto del de la facultad (F02).' }]) === "critico");
  chequear("una errata de estructura se queda en observación",
    M.severidadDeErrorDeCodigo_([{ motivo: 'El código "PR1" no sigue la estructura PR.XX_FYY.' }]) === "observacion");

  chequear("código consistente", M.severidadDeMaestro_({ consistente: "Sí" }) === "correcto");
  chequear("código inconsistente es observación",
    M.severidadDeMaestro_({ consistente: "No" }) === "observacion");
  chequear("salida que coincide con el Anexo 1", M.severidadDeCotejo_({ existe: "Sí" }) === "correcto");
  chequear("salida ausente del Anexo 1 es observación",
    M.severidadDeCotejo_({ existe: "No" }) === "observacion");
  chequear("lo no verificable no pesa como incumplimiento",
    M.severidadDeCotejo_({ existe: "No verificable" }) === "incompleto");

  chequear("la ficha correcta del ejemplo queda en correcto", F1.severidad === "correcto");
  chequear("la ficha con defectos del ejemplo queda en crítico", F2.severidad === "critico");
  chequear("porque su beneficiario lleva el formulario de otra facultad",
    F2.detalle.some(function (d) {
      return d.severidad === "critico" && d.observacion.indexOf("F05") !== -1;
    }));
  chequear("toda fila del detalle trae una clasificación conocida",
    F2.detalle.every(function (d) {
      return ["correcto", "incompleto", "observacion", "critico", "opcional"].indexOf(d.severidad) !== -1;
    }));
  chequear("la paleta cubre los cinco rótulos",
    ["correcto", "incompleto", "observacion", "critico", "opcional"].every(function (k) {
      const c = M.CONFIG_A3.COLORES[k];
      return c && c.fondo && c.texto && c.rotulo;
    }));
});

bloque("Código y denominación en celdas de varias líneas", function () {
  // Tal como vienen en la hoja: los códigos en una celda, uno por línea, y las
  // denominaciones en la celda contigua, también una por línea.
  const pares = M.emparejarCodigosYDenominaciones_(
    "BE.15_F02\nBE.16_F02\nBE.17_F02",
    "- DOCENTES DE LA FACULTAD\n- ESTUDIANTES DE PREGRADO\n- EGRESADOS");

  chequear("se recuperan los tres códigos", pares.length === 3);
  chequear("cada uno se queda con SU denominación, no con la celda entera",
    pares[0].denominacion === "DOCENTES DE LA FACULTAD" &&
    pares[1].denominacion === "ESTUDIANTES DE PREGRADO" &&
    pares[2].denominacion === "EGRESADOS");
  chequear("la viñeta inicial se descarta", pares[0].denominacion.indexOf("-") !== 0);

  const pegada = M.emparejarCodigosYDenominaciones_(
    "PR.122_F02 OFICINA DE PLANES Y PROGRAMAS - OGPL", "");
  chequear("la denominación pegada al código en la misma línea se respeta",
    pegada[0].denominacion === "OFICINA DE PLANES Y PROGRAMAS OGPL");

  const mezcla = M.emparejarCodigosYDenominaciones_(
    "PR.01_F02 SINEACE\nPR.02_F02", "SINEACE\nOCCAA");
  chequear("la línea con denominación propia la conserva",
    mezcla[0].denominacion === "SINEACE");

  const desparejo = M.emparejarCodigosYDenominaciones_(
    "BE.15_F02\nBE.16_F02\nBE.17_F02", "- DOCENTES Y ESTUDIANTES");
  chequear("si los conteos no cuadran no se adivina",
    desparejo.every(function (p) { return p.denominacion === ""; }));
  chequear("pero los códigos igual se recuperan", desparejo.length === 3);

  const unaLinea = M.emparejarCodigosYDenominaciones_("BE.01_F02", "AUTORIDADES");
  chequear("un código con una denominación se empareja", unaLinea[0].denominacion === "AUTORIDADES");
  chequear("celda vacía no da pares", M.emparejarCodigosYDenominaciones_("", "X").length === 0);
  chequear("la limpieza quita viñetas y puntos finales",
    M.limpiarDenominacion_("  - DOCENTES DE LA FACULTAD.  ") === "DOCENTES DE LA FACULTAD");

  // El falso positivo que motivó el arreglo: tres códigos distintos con tres
  // nombres distintos no deben aparecer como "la misma denominación repetida".
  const maestro = M.construirMaestro_(pares.map(function (par) {
    return { tipo: "Beneficiarios", codigo: par.codigo, denominacion: par.denominacion, ficha: 1 };
  }));
  chequear("tres beneficiarios distintos no generan inconsistencia",
    maestro.every(function (m) { return m.consistente === "Sí"; }));
  chequear("y cada código conserva su nombre",
    maestro.map(function (m) { return m.denominacion; }).join("|") ===
      "DOCENTES DE LA FACULTAD|ESTUDIANTES DE PREGRADO|EGRESADOS");

  const sinDenominacion = M.construirMaestro_(desparejo.map(function (par) {
    return { tipo: "Beneficiarios", codigo: par.codigo, denominacion: par.denominacion, ficha: 1 };
  }));
  chequear("sin denominación no se inventa una inconsistencia",
    sinDenominacion.every(function (m) { return m.consistente === "Sí"; }));
});

bloque("Producto final obligatorio", function () {
  chequear("la ficha con salidas las registra", F1.salidas.length === 2);
  chequear("y no genera hallazgo crítico por ese motivo",
    !F1.detalle.some(function (d) { return d.observacion.indexOf("ningún producto final") !== -1; }));

  // Misma ficha, pero con la columna de salidas vacía.
  const sinSalida = V.map(function (fila) { return fila.slice(); });
  sinSalida[9][7] = ""; sinSalida[9][8] = "";
  sinSalida[10][7] = ""; sinSalida[10][8] = "";
  const f = M.revisarFicha_(Object.assign({}, CTX, { valores: sinSalida }), BLOQUES[0], 1);

  chequear("sin salidas no se registra ningún producto", f.salidas.length === 0);
  chequear("se levanta el hallazgo crítico",
    f.detalle.some(function (d) {
      return d.severidad === "critico" && d.observacion.indexOf("ningún producto final") !== -1;
    }));
  chequear("la ficha entera pasa a crítica", f.severidad === "critico");
  chequear("y deja de considerarse completa", f.completa === false);
  chequear("el hallazgo se cuenta en el contador de críticos", f.criticos >= 1);
  chequear("el mensaje nombra la columna H",
    f.detalle.some(function (d) { return d.observacion.indexOf("columna H") !== -1; }));

  // Caso distinto: la ficha SÍ declara sus productos, pero sin codificarlos.
  const sinCodigo = V.map(function (fila) { return fila.slice(); });
  sinCodigo[9][7] = "- PLAN ESTRATÉGICO DE LA FACULTAD";
  sinCodigo[10][7] = "- PLAN OPERATIVO DE LA FACULTAD";
  const g = M.revisarFicha_(Object.assign({}, CTX, { valores: sinCodigo }), BLOQUES[0], 1);

  chequear("los productos sin código se cuentan como declarados", g.salidasDeclaradas === 2);
  chequear("pero ninguno queda codificado", g.salidas.length === 0);
  chequear("no se dice que la ficha no declara productos",
    !g.detalle.some(function (d) { return d.observacion.indexOf("ningún producto final") !== -1; }));
  chequear("se observa que están sin codificar",
    g.detalle.some(function (d) { return d.observacion.indexOf("ninguno lleva codificación") !== -1; }));
  chequear("y no se marca como crítica por ese motivo",
    !g.detalle.some(function (d) {
      return d.severidad === "critico" && d.campo.indexOf("Productos finales") !== -1;
    }));
});

bloque("Celdas combinadas — el proceso que abarca varias filas", function () {
  function rangoCombinado(fila, col, filas, cols) {
    return {
      getRow: function () { return fila; }, getColumn: function () { return col; },
      getNumRows: function () { return filas; }, getNumColumns: function () { return cols; }
    };
  }

  // getValues() deja en blanco todo el rango combinado salvo la esquina: así
  // llega una columna "Proceso" combinada sobre tres filas de salidas.
  const crudo = [
    ["PM.01.04_F02", "GESTIÓN DE GRADOS", "PM.01.04.01.01_F02", "REGLAMENTO INTERNO"],
    ["", "", "PM.01.04.01.02_F02", "SÍLABOS DE PREGRADO"],
    ["", "", "PM.01.04.02.01_F02", "RESOLUCIONES DECANALES"]
  ];
  // Dos combinaciones verticales independientes: el código y su denominación.
  const expandido = M.expandirCombinadas_(
    crudo, [rangoCombinado(1, 1, 3, 1), rangoCombinado(1, 2, 3, 1)], 1, 1);

  chequear("la esquina conserva su valor", expandido[0][0] === "PM.01.04_F02");
  chequear("la segunda fila hereda el proceso", expandido[1][0] === "PM.01.04_F02");
  chequear("y la tercera también", expandido[2][0] === "PM.01.04_F02");
  chequear("la denominación combinada también se arrastra",
    expandido[2][1] === "GESTIÓN DE GRADOS");
  chequear("lo que no está combinado no se toca",
    expandido[1][2] === "PM.01.04.01.02_F02");
  chequear("la matriz original no se modifica", crudo[1][0] === "");
  chequear("sin combinaciones devuelve lo mismo",
    M.expandirCombinadas_(crudo, [], 1, 1)[1][0] === "");
  chequear("una combinación de varias columnas lleva el único valor que tiene",
    M.expandirCombinadas_([["PE.01_F02", ""], ["", ""]],
                          [rangoCombinado(1, 1, 2, 2)], 1, 1)[1][1] === "PE.01_F02");
  chequear("un ancla que solo dice \"X\" cuenta como vacía y no se propaga",
    M.expandirCombinadas_([["X", ""], ["", ""]], [rangoCombinado(1, 1, 2, 2)], 1, 1)[1][1] === "");
  chequear("un rango combinado vacío no propaga nada",
    M.expandirCombinadas_([["", "x"], ["", ""]], [rangoCombinado(1, 1, 2, 1)], 1, 1)[1][0] === "");

  // El falso positivo que motivó el arreglo: filas 89, 92, 100 y 105 de la FDCP.
  const conMerge = V.map(function (fila) { return fila.slice(); });
  conMerge[10][5] = ""; conMerge[10][6] = "";        // el proceso viene combinado desde arriba
  const sinExpandir = M.revisarFicha_(Object.assign({}, CTX, { valores: conMerge }), BLOQUES[0], 1);
  chequear("sin expandir, la fila parece no tener proceso",
    sinExpandir.detalle.some(function (d) { return d.campo === "Proceso de la salida"; }));

  const expandidoV = M.expandirCombinadas_(
    conMerge, [rangoCombinado(10, 6, 2, 1), rangoCombinado(10, 7, 2, 1)], 1, 1);
  const conExpansion = M.revisarFicha_(Object.assign({}, CTX, { valores: expandidoV }), BLOQUES[0], 1);
  chequear("expandiendo la combinación, el falso positivo desaparece",
    !conExpansion.detalle.some(function (d) { return d.campo === "Proceso de la salida"; }));
  chequear("y tampoco se inventa un producto final faltante",
    !conExpansion.detalle.some(function (d) { return d.campo === "Producto final del proceso"; }));
});

bloque("Coherencia fila por fila de la descripción", function () {
  function conFila(cambios) {
    const W = V.map(function (fila) { return fila.slice(); });
    Object.keys(cambios).forEach(function (col) { W[9][Number(col)] = cambios[col]; });
    return M.revisarFicha_(Object.assign({}, CTX, { valores: W }), BLOQUES[0], 1);
  }
  function hallazgo(ficha, campo) {
    let d = null;
    ficha.detalle.forEach(function (x) { if (!d && x.campo === campo) d = x; });
    return d;
  }

  chequear("una fila con las cinco columnas llenas no genera hallazgos",
    !hallazgo(F1, "Entrada del proveedor") && !hallazgo(F1, "Producto final del proceso"));

  // Proveedor sin entrada: el caso de D314/E314.
  const sinEntrada = conFila({ 3: "", 4: "" });
  chequear("proveedor sin entrada se detecta", !!hallazgo(sinEntrada, "Entrada del proveedor"));
  chequear("se clasifica como incompleto",
    hallazgo(sinEntrada, "Entrada del proveedor").severidad === "incompleto");
  chequear("y apunta a la celda vacía, no a la del proveedor",
    hallazgo(sinEntrada, "Entrada del proveedor").celda === "D10");
  chequear("el mensaje explica la correspondencia",
    hallazgo(sinEntrada, "Entrada del proveedor").observacion.indexOf("todo proveedor") !== -1);
  chequear("baja el avance de la ficha", sinEntrada.avance < 100);

  const sinProveedor = conFila({ 1: "", 2: "" });
  chequear("entrada sin proveedor se detecta", !!hallazgo(sinProveedor, "Proveedor de la entrada"));
  chequear("y apunta a la celda del proveedor",
    hallazgo(sinProveedor, "Proveedor de la entrada").celda === "B10");

  // Proceso sin producto final: el caso de H114, H431, H436 y H437.
  const sinSalida = conFila({ 7: "", 8: "" });
  chequear("proceso sin producto final se detecta",
    !!hallazgo(sinSalida, "Producto final del proceso"));
  chequear("y es crítico",
    hallazgo(sinSalida, "Producto final del proceso").severidad === "critico");
  chequear("apunta a la celda H de esa fila",
    hallazgo(sinSalida, "Producto final del proceso").celda === "H10");
  chequear("cita la regla 5",
    hallazgo(sinSalida, "Producto final del proceso").observacion.indexOf("Regla 5") !== -1);
  chequear("la ficha entera pasa a crítica", sinSalida.severidad === "critico");
  chequear("aunque la columna Salidas tenga otros registros",
    sinSalida.salidasDeclaradas === 1);
  chequear("y ya no puede llegar al 100%", sinSalida.avance < 100);

  const salidaHuerfana = conFila({ 5: "", 6: "" });
  chequear("un producto sin proceso se observa",
    !!hallazgo(salidaHuerfana, "Proceso de la salida"));
  chequear("pero no es crítico",
    hallazgo(salidaHuerfana, "Proceso de la salida").severidad === "observacion");

  const filaVacia = conFila({ 1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "", 8: "", 9: "", 10: "" });
  chequear("una fila totalmente vacía no genera hallazgos",
    !hallazgo(filaVacia, "Entrada del proveedor") &&
    !hallazgo(filaVacia, "Producto final del proceso") &&
    !hallazgo(filaVacia, "Proveedor de la entrada"));
});

bloque("Fichas de más y de menos en la plantilla", function () {
  chequear("la plantilla trae 16 fichas", M.CONFIG_A3.FICHAS_ESPERADAS === 16);

  // Una plantilla sobrante: conserva los rótulos, pero ni un dato.
  const enBlanco = V.map(function (fila) { return fila.slice(); });
  const ROTULOS = ["DESCRIPCIÓN DEL PROCESO", "EJECUCIÓN DEL PROCESO", "FORMALIZACIÓN DEL PROCESO",
    "Nombre", "Codigo", "Responsable", "Tipo", "Alcance", "Versión", "Vinculación", "Objetivo",
    "Proveedores", "Entradas", "Proceso", "Salidas", "Beneficiarios", "RECURSOS", "Humanos",
    "Físicos", "Tecnológicos", "Informáticos", "Registros", "Riesgos", "Indicadores", "Controles",
    "Unidad", "Cargo", "Nombre y Apellidos", "Firma", "Elaboración", "Revisión"];
  for (let f = 2; f <= 20; f++) {
    for (let c = 0; c < enBlanco[f].length; c++) {
      const v = (enBlanco[f][c] || "").toString().trim();
      if (ROTULOS.indexOf(v) === -1) enBlanco[f][c] = "";
    }
  }
  const vacia = M.revisarFicha_(Object.assign({}, CTX, { valores: enBlanco }), BLOQUES[0], 1);
  chequear("una ficha sin nada llenado se reconoce como plantilla en blanco",
    vacia.vacia === true);
  chequear("y se la señala como tal en el nombre",
    vacia.nombre.indexOf("en blanco") !== -1);
  chequear("la ficha con datos no se confunde con una plantilla", F1.vacia === false);
  chequear("una ficha a medio llenar tampoco", F2.vacia === false);
});

bloque("Códigos duplicados dentro de la facultad", function () {
  function fichaFalsa(numero, codigo, salidas) {
    return {
      numero: numero, nombre: "Ficha " + numero, codigo: codigo,
      salidas: salidas.map(function (c) { return { codigo: c }; })
    };
  }
  const hallazgos = M.detectarDuplicados_([
    fichaFalsa(1, "PE.01_F02", ["PE.01.01.01_F02"]),
    fichaFalsa(2, "PE.01_F02", ["PE.01.02.01_F02"]),
    fichaFalsa(3, "PM.01_F02", ["PE.01.01.01_F02"])
  ]);
  const criticos = hallazgos.filter(function (h) { return h.severidad === "critico"; });
  const observaciones = hallazgos.filter(function (h) { return h.severidad === "observacion"; });

  chequear("el código de ficha repetido es crítico", criticos.length === 2);
  chequear("y se reporta en las dos fichas implicadas",
    criticos.map(function (h) { return h.ficha.numero; }).join() === "1,2");
  chequear("el mensaje nombra las fichas",
    criticos[0].observacion.indexOf("(1, 2)") !== -1);
  chequear("una salida declarada por dos procesos es observación, no error",
    observaciones.length === 2);
  chequear("y se explica qué verificar",
    observaciones[0].observacion.indexOf("un solo proceso") !== -1);

  const sinDuplicados = M.detectarDuplicados_([
    fichaFalsa(1, "PE.01_F02", ["PE.01.01.01_F02"]),
    fichaFalsa(2, "PE.02_F02", ["PE.02.01.01_F02"])
  ]);
  chequear("sin duplicados no hay hallazgos", sinDuplicados.length === 0);

  const repetidaEnLaMisma = M.detectarDuplicados_([
    fichaFalsa(1, "PE.01_F02", ["PE.01.01.01_F02", "PE.01.01.01_F02"])
  ]);
  chequear("la misma salida repetida dentro de una ficha no es duplicado entre fichas",
    repetidaEnLaMisma.length === 0);
});

bloque("Semáforo de avance por facultad", function () {
  chequear("95% es satisfactorio", M.estadoDeFacultad_(95, 0).clave === "correcto");
  chequear("100% también", M.estadoDeFacultad_(100, 0).rotulo === "Satisfactorio");
  chequear("94% es aceptable", M.estadoDeFacultad_(94, 0).clave === "incompleto");
  chequear("80% sigue siendo aceptable", M.estadoDeFacultad_(80, 0).clave === "incompleto");
  chequear("79% está en proceso", M.estadoDeFacultad_(79, 0).clave === "observacion");
  chequear("60% está en proceso", M.estadoDeFacultad_(60, 0).clave === "observacion");
  chequear("59% es crítico", M.estadoDeFacultad_(59, 0).clave === "critico");
  chequear("0% es crítico", M.estadoDeFacultad_(0, 0).clave === "critico");

  const alto = M.estadoDeFacultad_(99, 3);
  chequear("con hallazgos críticos, un 99% NO puede ser satisfactorio",
    alto.clave !== "correcto");
  chequear("baja a en proceso", alto.clave === "observacion");
  chequear("y el rótulo dice cuántos son",
    alto.rotulo.indexOf("3 hallazgo(s) crítico(s)") !== -1);
  chequear("un tramo ya bajo no mejora por tener críticos",
    M.estadoDeFacultad_(30, 2).clave === "critico");
  chequear("y conserva el aviso",
    M.estadoDeFacultad_(30, 2).rotulo.indexOf("crítico") !== -1);
});

bloque("Porcentaje general del Anexo 3 para el historial", function () {
  chequear("se calcula con los campos de la corrida",
    M.calcularPorcentajeGeneralAnexo3_([{ campos: 300, completos: 255 },
                                        { campos: 200, completos: 170 }]) === 85);
  chequear("es el ponderado, no el promedio de porcentajes",
    // 10% sobre 300 campos y 90% sobre 10: el ponderado es 12,6, no 50.
    M.calcularPorcentajeGeneralAnexo3_([{ campos: 300, completos: 30 },
                                        { campos: 10, completos: 9 }]) === 12.6);
  chequear("devuelve 0 a 100, no una fracción",
    M.calcularPorcentajeGeneralAnexo3_([{ campos: 100, completos: 85 }]) === 85);
  chequear("sin facultades no divide por cero",
    M.calcularPorcentajeGeneralAnexo3_([]) === 0);
  chequear("sin argumento tampoco revienta",
    M.calcularPorcentajeGeneralAnexo3_() === 0);
  chequear("una facultad sin campos no rompe el total",
    M.calcularPorcentajeGeneralAnexo3_([{ campos: 0, completos: 0 },
                                        { campos: 100, completos: 50 }]) === 50);

  // El defecto que traía la v3: la celda con formato de porcentaje devuelve la
  // fracción, así que quitarle el signo dejaba 0.85 en vez de 85.
  chequear("una fracción leída de celda se normaliza a porcentaje",
    M.porcentajeANumero_(0.85) === 85);
  chequear("mientras que el replace de la versión anterior devolvía 0.85",
    Number((0.85).toString().replace("%", "")) === 0.85);
});

bloque("Vocabulario de la columna ESTADO", function () {
  chequear("correcto es CONFORME", M.estadoTextoA3_("correcto") === "CONFORME");
  chequear("incompleto es SIN REGISTRAR", M.estadoTextoA3_("incompleto") === "SIN REGISTRAR");
  chequear("observacion es OBSERVADO", M.estadoTextoA3_("observacion") === "OBSERVADO");
  chequear("critico es CRÍTICO", M.estadoTextoA3_("critico") === "CRÍTICO");
  chequear("opcional (la firma) no es un defecto: se informa como CONFORME",
    M.estadoTextoA3_("opcional") === "CONFORME");
  chequear("una severidad desconocida no revienta, cae a OBSERVADO",
    M.estadoTextoA3_("algo-raro") === "OBSERVADO");
});

bloque("Ubicación mostrada en la columna CELDA", function () {
  chequear("con celda exacta, se muestra la celda",
    M.ubicacionCeldaA3_({ celda: "B4", fila: 4 }) === "B4");
  chequear("sin celda pero con fila, se muestra la fila",
    M.ubicacionCeldaA3_({ celda: "", fila: 12 }) === "Fila 12");
  chequear("sin celda pero con un rango, se muestra el rango",
    M.ubicacionCeldaA3_({ celda: "", fila: "10–11" }) === "Fila 10–11");
  chequear("sin celda y sin fila, queda vacío",
    M.ubicacionCeldaA3_({ celda: "", fila: "" }) === "");
  chequear("la celda exacta manda sobre la fila cuando hay ambas",
    M.ubicacionCeldaA3_({ celda: "H10", fila: 10 }) === "H10");
});

/* ────────────────────────────────────────────────────────────────────────── */

bloque("v4 — código de producto PADRE_F##-P##", function () {
  chequear("barrido extrae el -P completo",
    M.extraerCodigosA3_("PE.01.01_F18-P03 PLAN OPERATIVO").join() === "PE.01.01_F18-P03");
  chequear("con espacios alrededor del guion",
    M.extraerCodigosA3_("PE.01.01_F18 - P03 PLAN").join() === "PE.01.01_F18-P03");
  chequear("un guion seguido de la denominación no se confunde con -P",
    M.extraerCodigosA3_("PE.01.01_F18 - PLAN OPERATIVO").join() === "PE.01.01_F18");
  chequear("la denominación queda limpia",
    M.denominacionDeA3_("PE.01.01_F18-P03 PLAN OPERATIVO") === "PLAN OPERATIVO");

  chequear("-P vale como el nivel del padre más uno", M.nivelDeCodigo_("PE.01.01_F18-P03") === 3);
  chequear("salida -P bajo subproceso es válida",
    M.validarCodigoA3_("PE.01.01_F18-P03", "SALIDA", "F18", false).ok);
  chequear("registro -P bajo subproceso es válido",
    M.validarCodigoA3_("PE.01.01_F18-P03", "REGISTRO", "F18", false).ok);
  chequear("salida -P bajo nivel 2 es error en facultad de nivel 1",
    !M.validarCodigoA3_("PE.01.01.01_F18-P01", "SALIDA", "F18", false).ok);
  const n2 = M.validarCodigoA3_("PE.01.01.01_F18-P01", "SALIDA", "F18", true);
  chequear("y válida como excepción en facultad de nivel 2", n2.ok && n2.excepcionNivel2);
  chequear("producto colgado directo del nivel 0 es válido",
    M.validarCodigoA3_("PS.10_F18-P01", "SALIDA", "F18", false).ok);
  const enProceso = M.validarCodigoA3_("PE.01.01_F18-P01", "PROCESO_N2", "F18", false);
  chequear("-P en el campo de procesos es error", !enProceso.ok && /es de un producto/.test(enProceso.motivo));
  chequear("el sufijo ajeno se sigue detectando",
    !M.validarCodigoA3_("PE.01.01_F02-P01", "SALIDA", "F18", false).ok);
  chequear("el formato viejo sigue siendo válido",
    M.validarCodigoA3_("PE.01.01.03_F18", "SALIDA", "F18", false).ok);

  chequear("padre de un -P", M.padreDeProductoA3_("PM.01.03_F02-P05") === "PM.01.03");
  chequear("padre de un código viejo", M.padreDeProductoA3_("PM.01.03.05_F02") === "PM.01.03");
});

bloque("v4 — cotejo con el Anexo 1 durante la renumeración", function () {
  const catalogo = {
    "PE.01.01_F18-P01": { denominacion: "PLAN ESTRATÉGICO DE LA FACULTAD", tipo: "Final" },
    "PE.01.01_F18-P02": { denominacion: "PLAN OPERATIVO", tipo: "Final" },
    "PE.01.02.01_F18":  { denominacion: "MANUAL DE PROCESOS", tipo: "Final" }
  };
  const a1 = { disponible: true, catalogo: catalogo };
  const c = M.construirCotejo_([
    { tipo: "Salida", codigo: "PE.01.01_F18-P01", denominacion: "PLAN ESTRATÉGICO DE LA FACULTAD", ficha: 1 },
    { tipo: "Salida", codigo: "PE.01.01.02_F18", denominacion: "Plan operativo", ficha: 1 },
    { tipo: "Salida", codigo: "PE.01.02_F18-P01", denominacion: "MANUAL DE PROCESOS", ficha: 2 },
    { tipo: "Salida", codigo: "PE.01.03.01_F18", denominacion: "PLAN OPERATIVO", ficha: 3 },
    { tipo: "Salida", codigo: "PE.01.01.09_F18", denominacion: "INEXISTENTE", ficha: 3 }
  ], a1);
  chequear("mismo código: Sí", c[0].existe === "Sí");
  chequear("A3 viejo, A1 con -P: se encuentra en otro formato",
    c[1].existe === "Sí (código en otro formato)" && /PE\.01\.01_F18-P02/.test(c[1].observacion));
  chequear("A3 con -P, A1 viejo: también", c[2].existe === "Sí (código en otro formato)");
  chequear("misma denominación pero otro padre: no se empareja", c[3].existe === "No");
  chequear("producto inexistente: No", c[4].existe === "No");
  chequear("buscarEnOtroFormato_ exige un solo candidato",
    M.buscarEnOtroFormato_("PE.01.01.05_F18", "X", {
      "PE.01.01_F18-P01": { denominacion: "X" }, "PE.01.01_F18-P02": { denominacion: "X" } }) === null);
});

bloque("v4 — equivalencias anterior → nuevo del Anexo 1", function () {
  const libro = { getSheetByName: function () { return {
    getLastRow: function () { return 4; },
    getRange: function () { return { getValues: function () { return [
      ["", "F01_FM", 30, "PE.02.02.05_F01", "PE.02.02_F01-P05", "X"],
      ["", "F01_FM", 31, "PE.02.02_F01-P05", "PE.02.02_F01-P04", "X"],
      ["", "F02_FDCP", 9, "PE.01.02.01_F02", "PE.01.02_F02-P01", "Y"]
    ]; } }; } }; } };
  const eq = M.leerEquivalenciasA1_(libro, "F01_FM");
  chequear("solo lee las de su pestaña", Object.keys(eq).length === 2);
  chequear("sigue la cadena hasta el código vigente",
    M.resolverEquivalenciaA3_("PE.02.02.05_F01", eq) === "PE.02.02_F01-P04");
  chequear("sin equivalencia devuelve null", M.resolverEquivalenciaA3_("PE.09_F01", eq) === null);

  const c = M.construirCotejo_([
    { tipo: "Salida", codigo: "PE.02.02.05_F01", denominacion: "", ficha: 1 }
  ], { disponible: true, catalogo: { "PE.02.02_F01-P04": { denominacion: "INFORMES", tipo: "Final" } },
       equivalencias: eq });
  chequear("un código viejo sin denominación se encuentra por la equivalencia",
    c[0].existe === "Sí (código en otro formato)" && /PE\.02\.02_F01-P04/.test(c[0].observacion));
});

console.log("\n" + total + " comprobaciones, " + fallas + " fallas.");
process.exit(fallas ? 1 : 0);
