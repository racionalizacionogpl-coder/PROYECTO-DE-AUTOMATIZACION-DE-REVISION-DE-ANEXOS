/**
 * Pruebas de ResumenGeneral.gs.
 *
 * Este script no vuelve a auditar nada: solo lee RESUMEN_EJECUTIVO_A1 y
 * RESUMEN_EJECUTIVO_A3, ya escritas por los otros dos auditores, y las combina
 * 50/50. Las pruebas fijan esas dos hojas tal como las dejan sus auditores.
 *
 *   node tests/resumengeneral.test.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const FUENTE = path.join(__dirname, "..", "apps-script", "ResumenGeneral.gs");

const SHIM = `
var SpreadsheetApp = {
  getUi: function () { throw new Error("sin interfaz"); },
  openById: function () { throw new Error("sin libro"); },
  getActiveSpreadsheet: function () { return null; },
  newConditionalFormatRule: function () {
    const r = { whenNumberGreaterThanOrEqualTo: function () { return r; },
                setBackground: function () { return r; }, setFontColor: function () { return r; },
                setRanges: function () { return r; }, build: function () { return {}; } };
    return r;
  }
};
var Logger = { log: function () {} };
module.exports = {
  CONFIG_GENERAL, normalizarRG_, porcentajeARG_, enteroRG_, leerResumenPorFacultadRG_,
  combinarRG_, estadoRG_, construirFilasResumenGeneralRG_
};
`;

function cargarModulo() {
  const destino = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "rg-")), "modulo.js");
  fs.writeFileSync(destino, fs.readFileSync(FUENTE, "utf8") + SHIM);
  return require(destino);
}

const M = cargarModulo();

let total = 0;
let fallas = 0;

function chequear(descripcion, condicion) {
  total++;
  if (!condicion) { fallas++; console.log("  ✗ " + descripcion); }
}

function bloque(titulo, fn) {
  console.log("\n" + titulo);
  const antes = fallas;
  fn();
  console.log(antes === fallas ? "  todo correcto" : "  " + (fallas - antes) + " fallas");
}

/* ── Las dos hojas, tal como las dejan sus auditores ─────────────────────── */

const HOJA_A1 = [
  ["", "", ""],
  ["FACULTAD", "NOMBRE", "AVANCE GENERAL DEL ANEXO 1"],
  ["FM", "FACULTAD DE MEDICINA", "72%"],
  ["FDCP", "FACULTAD DE DERECHO Y CIENCIA POLÍTICA", "90%"],
  ["FLCH", "FACULTAD DE LETRAS Y CIENCIAS HUMANAS", ""],
  ["TOTAL", "LAS 20 FACULTADES", "68%"]
];

const HOJA_A3 = [
  ["SIGLA", "FACULTAD", "FICHAS", "FICHAS ESPERADAS", "COMPLETAS", "INCOMPLETAS",
   "SIN PRODUCTO", "OTROS CRÍTICOS", "CRÍTICOS (TOTAL)", "OBSERVACIONES", "ESTADO", "NOTAS", "% AVANCE"],
  ["FM", "FACULTAD DE MEDICINA", 16, 16, 10, 6, 0, 1, 1, 4, "En proceso", "", 0.7],
  ["FDCP", "FACULTAD DE DERECHO Y CIENCIA POLÍTICA", 15, 16, 15, 0, 0, 0, 0, 0, "Satisfactorio", "", 0.82],
  ["TOTAL", "ANEXO 3 — LAS 20 FACULTADES", 31, 32, 25, 6, 0, 1, 1, 4, "En proceso", "", 0.76]
];

/* ────────────────────────────────────────────────────────────────────────── */

bloque("Configuración", function () {
  chequear("los pesos son mitad y mitad",
    M.CONFIG_GENERAL.PESOS.A1 === 0.5 && M.CONFIG_GENERAL.PESOS.A3 === 0.5);
  chequear("apunta al mismo libro de revisión que los otros auditores",
    M.CONFIG_GENERAL.ID_LIBRO === "1oYBAHp-Bd0V8un5hUAWdK1jKbcbdsROH4IOyM0MAmFk");
});

bloque("Normalización de porcentajes", function () {
  chequear("lee un porcentaje con signo", M.porcentajeARG_("85%") === 85);
  chequear("con espacio y coma decimal", M.porcentajeARG_(" 85,5 % ") === 85.5);
  chequear("un número suelto se toma tal cual", M.porcentajeARG_(85) === 85);
  chequear("una celda con formato de porcentaje llega como fracción",
    M.porcentajeARG_(0.85) === 85);
  chequear("el 100% no se confunde con una fracción", M.porcentajeARG_(100) === 100);
  chequear("el cero es un dato, no un vacío", M.porcentajeARG_(0) === 0);
  chequear("una celda vacía no es cero", M.porcentajeARG_("") === null);
  chequear("un guion tampoco", M.porcentajeARG_("—") === null);
  chequear("ni un texto cualquiera", M.porcentajeARG_("NO INICIADO") === null);
  chequear("enteroRG_ lee un conteo simple, sin escalar como porcentaje",
    M.enteroRG_(1) === 1 && M.enteroRG_(2) === 2);
  chequear("un conteo con coma se redondea", M.enteroRG_("3,0") === 3);
  chequear("enteroRG_ de un vacío es null", M.enteroRG_("") === null);
});

bloque("Lectura de una hoja de resumen", function () {
  const a1 = M.leerResumenPorFacultadRG_(HOJA_A1, "FACULTAD", "NOMBRE", "AVANCE GENERAL DEL ANEXO 1");
  chequear("se ubica el encabezado aunque no esté en la primera fila",
    a1.porSigla["FM"].avance === 72);
  chequear("y se leen las demás facultades", a1.porSigla["FDCP"].avance === 90);
  chequear("una facultad sin dato queda con avance null", a1.porSigla["FLCH"].avance === null);
  chequear("la fila TOTAL no se toma por facultad", a1.porSigla["TOTAL"] === undefined);
  chequear("se conserva el orden de aparición", a1.orden.join(",") === "FM,FDCP,FLCH");
  chequear("trae el nombre completo", a1.porSigla["FM"].nombre === "FACULTAD DE MEDICINA");

  const a3 = M.leerResumenPorFacultadRG_(HOJA_A3, "SIGLA", "FACULTAD", "% AVANCE", "CRÍTICOS (TOTAL)");
  chequear("lee el avance del Anexo 3", a3.porSigla["FM"].avance === 70);
  chequear("y sus críticos", a3.porSigla["FM"].criticos === 1);
  chequear("una facultad sin críticos queda en 0", a3.porSigla["FDCP"].criticos === 0);
  chequear("la fila TOTAL tampoco se toma por facultad", a3.porSigla["TOTAL"] === undefined);

  const movida = [["NOMBRE", "AVANCE GENERAL DEL ANEXO 1", "FACULTAD"],
                  ["FACULTAD DE MEDICINA", "72%", "FM"]];
  chequear("las columnas se buscan por nombre, no por posición",
    M.leerResumenPorFacultadRG_(movida, "FACULTAD", "NOMBRE", "AVANCE GENERAL DEL ANEXO 1")
      .porSigla["FM"].avance === 72);
  chequear("sin la columna esperada no se inventa nada",
    M.leerResumenPorFacultadRG_([["FACULTAD", "OTRA COSA"], ["FM", "72%"]],
      "FACULTAD", "NOMBRE", "AVANCE GENERAL DEL ANEXO 1").orden.length === 0);
  chequear("una hoja vacía no revienta",
    M.leerResumenPorFacultadRG_([], "FACULTAD", "NOMBRE", "AVANCE").orden.length === 0);

  const conLeyenda = HOJA_A1.concat([
    [],
    ["LEYENDA", "", ""],
    ["TIPOS DE PRODUCTO", "Se registran en la columna C del Anexo 1.", ""],
    ["CONFORME", "Avance del 100 %.", ""]
  ]);
  const a1ConLeyenda = M.leerResumenPorFacultadRG_(conLeyenda, "FACULTAD", "NOMBRE", "AVANCE GENERAL DEL ANEXO 1");
  chequear("la leyenda que el Anexo 1 agrega debajo de TOTAL no se lee como facultades",
    a1ConLeyenda.orden.join(",") === "FM,FDCP,FLCH");
  chequear("ni 'LEYENDA' ni sus bloques aparecen como sigla",
    !a1ConLeyenda.porSigla["LEYENDA"] && !a1ConLeyenda.porSigla["TIPOS DE PRODUCTO"] &&
    !a1ConLeyenda.porSigla["CONFORME"]);
});

bloque("Combinación 50/50", function () {
  const ambos = M.combinarRG_(90, 70);
  chequear("con los dos anexos se promedia 50/50", ambos.general === 80);
  chequear("y se marca como completo", ambos.completo === true);
  chequear("sin nota que aclarar", ambos.nota === "");

  chequear("el 50/50 no pondera por tamaño: 100 y 0 dan 50",
    M.combinarRG_(100, 0).general === 50);
  chequear("otros pesos también funcionan",
    M.combinarRG_(100, 0, { A1: 0.4, A3: 0.6 }).general === 40);

  const soloA3 = M.combinarRG_(null, 70);
  chequear("si falta el Anexo 1 NO se promedia con cero", soloA3.general === 70);
  chequear("y se dice que falta", soloA3.nota.indexOf("Sin dato del Anexo 1") !== -1);
  chequear("marcándolo como incompleto", soloA3.completo === false);

  const soloA1 = M.combinarRG_(90, null);
  chequear("lo mismo al revés", soloA1.general === 90 && soloA1.completo === false);
  chequear("sin ninguno de los dos no hay general",
    M.combinarRG_(null, null).general === null);

  chequear("un cero real sí se promedia", M.combinarRG_(0, 80).general === 40);
});

bloque("Estado y semáforo", function () {
  chequear("95% es satisfactorio", M.estadoRG_(95, 0).clave === "correcto");
  chequear("40% es crítico", M.estadoRG_(40, 0).clave === "critico");
  const conCriticos = M.estadoRG_(99, 2);
  chequear("con críticos del Anexo 3 no puede ser satisfactorio", conCriticos.clave !== "correcto");
  chequear("y el rótulo dice cuántos son y de dónde vienen",
    conCriticos.rotulo.indexOf("2 hallazgo(s) crítico(s) del Anexo 3") !== -1);
  chequear("un tramo ya bajo no mejora por tener críticos",
    M.estadoRG_(30, 2).clave === "critico");
});

bloque("Construcción de las filas del resumen general", function () {
  const a1 = M.leerResumenPorFacultadRG_(HOJA_A1, "FACULTAD", "NOMBRE", "AVANCE GENERAL DEL ANEXO 1");
  const a3 = M.leerResumenPorFacultadRG_(HOJA_A3, "SIGLA", "FACULTAD", "% AVANCE", "CRÍTICOS (TOTAL)");
  const r = M.construirFilasResumenGeneralRG_(a1, a3, { hayHojaA1: true, hayHojaA3: true });

  chequear("una fila por facultad presente en A3, más las que solo están en A1",
    r.filas.map(function (f) { return f.sigla; }).join(",") === "FM,FDCP,FLCH");
  chequear("el orden es el de la hoja del Anexo 3 (F01→F20)",
    r.filas[0].sigla === "FM" && r.filas[1].sigla === "FDCP");

  const fm = r.filas[0];
  chequear("FM combina 72 y 70 en 71", fm.general === 71);
  chequear("y lleva sus críticos del Anexo 3", fm.notas.indexOf("1 hallazgo(s) crítico(s)") !== -1);

  const flch = r.filas[2];
  chequear("FLCH solo tiene Anexo 1 (avance vacío) y no aparece en el Anexo 3",
    flch.avanceA3 === null);
  chequear("y lo dice en la nota", flch.notas.indexOf("no aparece en " + M.CONFIG_GENERAL.HOJA_A3) !== -1);

  chequear("el total es el promedio simple de las facultades con ambos anexos",
    r.total.general === Math.round(((71 + 86) / 2) * 10) / 10);
  chequear("la nota del total explica el criterio",
    r.total.nota.indexOf("Promedio simple") !== -1 && r.total.nota.indexOf("50 %") !== -1);

  const sinA1 = M.construirFilasResumenGeneralRG_({ orden: [], porSigla: {} }, a3,
    { hayHojaA1: false, hayHojaA3: true });
  chequear("sin la hoja del Anexo 1 se avisa por facultad",
    sinA1.filas[0].notas.indexOf("No se encontró la hoja " + M.CONFIG_GENERAL.HOJA_A1) !== -1);
  chequear("y aun así se muestra el avance del Anexo 3 disponible",
    sinA1.filas[0].avanceA3 === 70);
});

/* ────────────────────────────────────────────────────────────────────────── */

console.log("\n" + total + " comprobaciones, " + fallas + " fallas.");
process.exit(fallas ? 1 : 0);
