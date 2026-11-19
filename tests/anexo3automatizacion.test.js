/**
 * Pruebas de Anexo3_Automatizacion_v2.gs (herramientas del libro del Anexo 3).
 *
 *   node tests/anexo3automatizacion.test.js
 */
const fs = require("fs"), os = require("os"), path = require("path");
const FUENTE = path.join(__dirname, "..", "apps-script", "Anexo3_Automatizacion_v2.gs");
const destino = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "a3auto-")), "m.js");
fs.writeFileSync(destino, fs.readFileSync(FUENTE, "utf8") + `
var SpreadsheetApp = {};
module.exports = { codigoBaseA3Auto_, separarCodigoA3Auto_, esProductoDeA3Auto_,
  productosDeProcesoA3Auto_, estructuraSubprocesosA3Auto_, procesoDeFilaA3Auto_ };`);
const M = require(destino);

let total = 0, fallas = 0;
function chequear(d, c) { total++; if (!c) { fallas++; console.log("  ✗ " + d); } }
function bloque(t, fn) { console.log("\n" + t); const a = fallas; fn();
  console.log(a === fallas ? "  todo correcto" : "  " + (fallas - a) + " fallas"); }

// Columnas B y C del Anexo 1: un subproceso sin nivel 2 y otro con nivel 2.
const VIEJO = [
  ["PM.01_F02 GESTIÓN DE LA FORMACIÓN ACADÉMICA", ""],
  ["PM.01.01_F02 GESTIÓN CURRICULAR Y NORMATIVA", ""],
  ["PM.01.01.01_F02 DISEÑO Y ACTUALIZACIÓN CURRICULAR", ""],
  ["PM.01.01.01.01_F02 PLAN CURRICULAR DE PREGRADO", "Final / Salida"],
  ["PM.01.01.01.02_F02 PLAN CURRICULAR DE MAESTRÍA", "Final / Salida"],
  ["PM.01.01.01.03_F02 ACTA DE REVISIÓN", "Parcial / Registro"],
  ["PM.01.01.02_F02 REGULACIÓN ACADÉMICA", ""],
  ["PM.01.01.02.01_F02 REGLAMENTO INTERNO", "Final / Salida"],
  ["PM.02_F02 GESTIÓN DE LA INVESTIGACIÓN", ""],
  ["PM.02.01_F02 FOMENTO Y DESARROLLO DE GRUPOS", ""],
  ["PM.02.01.01_F02 SERVICIO DE ASISTENCIA TÉCNICA", "Final / Salida"],
  ["PM.02.01.02_F02 PROGRAMA DE CAPACITACIÓN", "Final / Salida"],
  ["PM.02.05_F02 PRODUCTO COLGADO DEL NIVEL 0", "Final / Salida"],
  ["PM.02.01.04_F02 PRODUCTO AÚN SIN TIPO", "Por llenar"]
];
const NUEVO = VIEJO.map(function (f) {
  const m = f[0].match(/^((?:PM)(?:\.\d{2})+)\.(\d{2})_F02 (.*)$/);
  if (!f[1] || !m) return f;
  return [m[1] + "_F02-P" + m[2] + " " + m[3], f[1]];
});

bloque("Utilidades de código", function () {
  chequear("base sin sufijo", M.codigoBaseA3Auto_("PM.01.01_F02 GESTIÓN") === "PM.01.01");
  const s = M.separarCodigoA3Auto_("PM.01.01_F02-P03 PLAN OPERATIVO");
  chequear("separa código -P y nombre", s.code === "PM.01.01_F02-P03" && s.name === "PLAN OPERATIVO");
  chequear("producto formato anterior", M.esProductoDeA3Auto_("PM.02.01.01_F02 X", "PM.02.01"));
  chequear("producto formato -P", M.esProductoDeA3Auto_("PM.02.01_F02-P01 X", "PM.02.01"));
  chequear("un nieto no es producto directo", !M.esProductoDeA3Auto_("PM.01.01.01.01_F02 X", "PM.01.01"));
  chequear("PM.02.01 no arrastra a PM.02.010", !M.esProductoDeA3Auto_("PM.02.010.01_F02 X", "PM.02.01"));
});

[["formato anterior", VIEJO], ["formato -P##", NUEVO]].forEach(function (caso) {
  const datos = caso[1];
  bloque("Estructura de subprocesos — " + caso[0], function () {
    const pm01 = M.estructuraSubprocesosA3Auto_("PM.01", datos);
    chequear("PM.01.01 tiene dos niveles 2 → dos bloques", pm01.length === 2);
    chequear("F lleva el nivel 1 con su nombre",
      pm01[0].f === "PM.01.01_F02 GESTIÓN CURRICULAR Y NORMATIVA" && pm01[1].f === pm01[0].f);
    chequear("G lleva cada nivel 2 con su nombre",
      pm01[0].g === "PM.01.01.01_F02 DISEÑO Y ACTUALIZACIÓN CURRICULAR" &&
      pm01[1].g === "PM.01.01.02_F02 REGULACIÓN ACADÉMICA");
    chequear("los productos son los del nivel 2", pm01[0].proceso === "PM.01.01.01");

    const pm02 = M.estructuraSubprocesosA3Auto_("PM.02", datos);
    chequear("PM.02.01 sin nivel 2 → código en F y nombre en G",
      pm02.length === 1 && pm02[0].f === "PM.02.01_F02" &&
      pm02[0].g === "FOMENTO Y DESARROLLO DE GRUPOS" && pm02[0].proceso === "PM.02.01");
    chequear("un producto colgado del nivel 0 no se importa como subproceso",
      pm02.every(function (e) { return e.f.indexOf("PM.02.05") === -1; }));

    const fin = M.productosDeProcesoA3Auto_("PM.01.01.01", datos, "FINAL");
    chequear("solo los finales del nivel 2", fin.length === 2 &&
      fin[1].name === "PLAN CURRICULAR DE MAESTRÍA");
    chequear("un producto sin tipo no se vuelve subproceso ni nivel 2",
      pm02.length === 1);
    chequear("los productos de PM.02.01",
      M.productosDeProcesoA3Auto_("PM.02.01", datos, "FINAL").length === 2);
  });
});

bloque("De qué columna sale el proceso de cada fila", function () {
  chequear("nivel 2 en G manda",
    M.procesoDeFilaA3Auto_("PM.01.01_F02 GESTIÓN", "PM.01.01.01_F02 DISEÑO").codigo === "PM.01.01.01");
  chequear("sin nivel 2, F",
    M.procesoDeFilaA3Auto_("PM.02.01_F02", "FOMENTO").codigo === "PM.02.01");
  chequear("fila de un bloque de nivel 2 con F combinada (vacía)",
    M.procesoDeFilaA3Auto_("", "PM.01.01.02_F02 REGULACIÓN").codigo === "PM.01.01.02");
  chequear("fila sin códigos", M.procesoDeFilaA3Auto_("", "") === null);
});

console.log("\n" + total + " comprobaciones, " + fallas + " fallas.");
process.exit(fallas ? 1 : 0);
