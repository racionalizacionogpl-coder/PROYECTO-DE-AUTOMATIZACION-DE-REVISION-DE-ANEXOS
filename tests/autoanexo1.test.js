/**
 * Pruebas de AutoAnexo1_v2.gs (codificación de productos con -P##).
 *
 *   node tests/autoanexo1.test.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const FUENTE = path.join(__dirname, "..", "apps-script", "AutoAnexo1_v2.gs");
const SHIM = `
var SpreadsheetApp = { getUi: function () { throw new Error("sin interfaz"); } };
module.exports = { CONFIG_AUTO_A1, sufijoDePestanaAuto_, tieneDatosDeProductoAuto_,
                   calcularCodigosAuto_, codigoDeProductoAuto_ };
`;
const destino = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "auto-")), "m.js");
fs.writeFileSync(destino, fs.readFileSync(FUENTE, "utf8") + SHIM);
const M = require(destino);

let total = 0, fallas = 0;
function chequear(d, c) { total++; if (!c) { fallas++; console.log("  ✗ " + d); } }
function bloque(t, fn) {
  console.log("\n" + t); const a = fallas; fn();
  console.log(a === fallas ? "  todo correcto" : "  " + (fallas - a) + " fallas");
}

const COLOR = "#c9daf8", BLANCO = "#ffffff", AMARILLO = "#ffff00";
const NOTA = "(No combinar las celdas de esta columna)";
const vacias = ["", "", "", "", "", ""];                 // D..I
const prod = ["AE 01.01 x", "AO x", "Servicio", "Calidad", "Claridad", "misión"];

function correr(filas) {
  const valores = filas.map(function (f) { return [f[0], f[1] || ""].concat(f[2] || vacias); });
  const fondos = filas.map(function (f) { return [f[3]]; });
  return M.calcularCodigosAuto_(valores, fondos, "_F18", 5);
}

bloque("Sufijo desde el nombre de la pestaña", function () {
  chequear("F18_FPSIC → _F18", M.sufijoDePestanaAuto_("F18_FPSIC") === "_F18");
  chequear("Copia de 11. FCC → no se renumera", M.sufijoDePestanaAuto_("Copia de 11. FCC") === null);
  chequear("Copia de F14_FCM → no se renumera", M.sufijoDePestanaAuto_("Copia de F14_FCM") === null);
});

bloque("Qué cuenta como dato de producto", function () {
  chequear("Final en C", M.tieneDatosDeProductoAuto_(["x", "Final / Salida"].concat(vacias)));
  chequear("Parcial en C", M.tieneDatosDeProductoAuto_(["x", "Parcial / Registro"].concat(vacias)));
  chequear("algo en D..I", M.tieneDatosDeProductoAuto_(["x", ""].concat(prod)));
  chequear("la nota de la plantilla en C NO es dato de producto",
    !M.tieneDatosDeProductoAuto_(["x", NOTA].concat(vacias)));
});

bloque("Secuencia pedida", function () {
  const r = correr([
    ["PE.01_F18 GESTIÓN ESTRATÉGICA", NOTA, null, COLOR],
    ["PE.01.01_F18 GESTIÓN DE PLANES", "", null, COLOR],
    ["PE.01.01.01_F18 Plan estratégico", "Final / Salida", prod, BLANCO],
    ["PE.01.01.02_F18 Plan operativo", "Final / Salida", prod, BLANCO],
    ["Informe de evaluación", "Parcial / Registro", prod, BLANCO],
    ["PE.01.02_F18 MODERNIZACIÓN", "", null, COLOR],
    ["PE.01.02.01_F18 Manual de procesos", "Final / Salida", prod, BLANCO],
    ["PE.01.02.01_F18 NIVEL 2", "", null, COLOR],
    ["PE.01.02.01.01_F18 Ficha de proceso", "Final / Salida", prod, BLANCO]
  ]);
  const b = r.columnaB.map(function (x) { return x[0]; });
  chequear("el proceso queda igual", b[0] === "PE.01_F18 GESTIÓN ESTRATÉGICA");
  chequear("producto 1 del subproceso", b[2] === "PE.01.01_F18-P01 PLAN ESTRATÉGICO");
  chequear("producto 2", b[3] === "PE.01.01_F18-P02 PLAN OPERATIVO");
  chequear("producto sin código recibe el siguiente", b[4] === "PE.01.01_F18-P03 INFORME DE EVALUACIÓN");
  chequear("con un subproceso nuevo vuelve a P01", b[6] === "PE.01.02_F18-P01 MANUAL DE PROCESOS");
  chequear("nivel 2: su producto cuelga de él", b[8] === "PE.01.02.01_F18-P01 FICHA DE PROCESO");
  chequear("informe: 5 productos y 4 procesos",
    r.informe.productos === 5 && r.informe.procesos === 4);
});

bloque("Producto colgando directo del nivel 0", function () {
  const r = correr([
    ["PS.10_F18 GESTIÓN DE LA COMUNICACIÓN", NOTA, null, COLOR],
    ["PS.10.01_F18 Boletín", "Final / Salida", prod, BLANCO]
  ]);
  chequear("toma el último nivel disponible", r.columnaB[1][0] === "PS.10_F18-P01 BOLETÍN");
});

bloque("Rehacer es idempotente y corrige sufijos", function () {
  const r = correr([
    ["PM.01.01_F02 SUBPROCESO", "", null, COLOR],
    ["PM.01.01_F18-P07 Producto ya numerado", "Final", prod, BLANCO],
    ["PM.01.01.03_F02 Producto con sufijo ajeno", "Final", prod, BLANCO]
  ]);
  const b = r.columnaB.map(function (x) { return x[0]; });
  chequear("el sufijo ajeno del proceso se corrige", b[0] === "PM.01.01_F18 SUBPROCESO");
  chequear("un -P07 viejo se renumera a P01", b[1] === "PM.01.01_F18-P01 PRODUCTO YA NUMERADO");
  chequear("el sufijo ajeno del producto se corrige", b[2] === "PM.01.01_F18-P02 PRODUCTO CON SUFIJO AJENO");
  const otra = correr([
    ["PM.01.01_F18 SUBPROCESO", "", null, COLOR],
    ["PM.01.01_F18-P01 PRODUCTO YA NUMERADO", "Final", prod, BLANCO]
  ]);
  chequear("correrlo dos veces no cambia nada", otra.informe.cambiadas === 0);
});

bloque("Un producto resaltado sigue siendo producto", function () {
  const r = correr([
    ["PE.01.01_F18 SUBPROCESO", "", null, COLOR],
    ["PE.01.01.04_F18 Docentes beneficiados", "Final", prod, AMARILLO],
    ["PE.01.01.05_F18 Informe", "Final", prod, "#00ff00"]
  ]);
  chequear("amarillo → producto", r.columnaB[1][0] === "PE.01.01_F18-P01 DOCENTES BENEFICIADOS");
  chequear("verde → producto", r.columnaB[2][0] === "PE.01.01_F18-P02 INFORME");
  chequear("sin conflictos", r.informe.conflictos.length === 0);
});

bloque("Avisa si el código viejo no cuelga del padre por posición", function () {
  const r = correr([
    ["PM.01.04_F18 SUBPROCESO", "", null, COLOR],
    ["PM.01.03.01_F18 Plan curricular", "Final", prod, BLANCO],
    ["PM.01.04.02_F18 Silabo", "Final", prod, BLANCO]
  ]);
  chequear("se numera por posición", r.columnaB[1][0] === "PM.01.04_F18-P01 PLAN CURRICULAR");
  chequear("y se reporta la fila 6 con su código anterior",
    r.informe.padreDistinto.length === 1 && /^6 \(PM\.01\.03\.01 → PM\.01\.04\)$/.test(r.informe.padreDistinto[0]));
});

bloque("Casos que no se tocan y se reportan", function () {
  const r = correr([
    ["Producto huérfano", "Final", prod, BLANCO],
    ["PE.01_F18 GESTIÓN ESTRATÉGICA", "Final / Salida", prod, COLOR],
    ["SIN CÓDIGO PERO CON COLOR", "", null, COLOR],
    ["PROCESOS MISIONALES", "", null, COLOR],
    ["** Plan estratégico 2026 - 2030 en validación", "", null, BLANCO]
  ]);
  chequear("producto sin padre: fila 5", r.informe.sinPadre.join() === "5");
  chequear("color de proceso con datos de producto: fila 6", r.informe.conflictos.join() === "6");
  chequear("y esa fila no se modifica", r.columnaB[1][0] === "PE.01_F18 GESTIÓN ESTRATÉGICA");
  chequear("proceso sin código: fila 7", r.informe.procesosSinCodigo.join() === "7");
  chequear("la catalogación no se toca", r.columnaB[3][0] === "PROCESOS MISIONALES");
  chequear("una nota suelta no recibe código", r.informe.notas.join() === "9" &&
    r.columnaB[4][0] === "** Plan estratégico 2026 - 2030 en validación");
});

console.log("\n" + total + " comprobaciones, " + fallas + " fallas.");
process.exit(fallas ? 1 : 0);
