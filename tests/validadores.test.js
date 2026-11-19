/**
 * Pruebas de los validadores del Anexo 1.
 *
 * Apps Script no se puede ejecutar fuera de Google, así que se carga el .gs en
 * Node con stubs de SpreadsheetApp y Logger. Solo se prueban las funciones
 * puras (validadores, localización de pestañas, jerarquía y cobertura); la
 * lectura y escritura de hojas queda fuera de alcance.
 *
 *   node tests/validadores.test.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const FUENTE = path.join(__dirname, "..", "apps-script", "Anexo1_Auditoria_v19.gs");

const SHIM = `
var SpreadsheetApp = { getUi: function () { throw new Error("sin interfaz"); },
                       openById: function () { return null; }, BorderStyle: {} };
var Logger = { log: function () {} };
var Utilities = { formatDate: function () { return ""; } };
var Session = { getScriptTimeZone: function () { return "UTC"; } };
var Charts = { ChartType: { COLUMN: "COLUMN" } };
module.exports = {
  CONFIG_A1, validarCodigo_, validarTipoProducto_, validarAccionEstrategica_,
  validarActividadOperativa_, validarListaCerrada_, validarListaAbierta_,
  esDenominacionDeProcesoN0_, buscarNivel0PorNombre_, facultadDeLaHoja_,
  localizarHoja_, esValorNulo_, normalizarTexto_, normalizarCodigo_,
  clasificarFila_, extraerCodigos_, denominacionDe_, rescatarColumnasManuales_,
  filasNivel0_, filaDeProceso_, puntuarProceso_, sufijoDe_, CRITERIOS_PROCESO,
  TOTAL_CRITERIOS, TOTAL_CRITERIOS_PROCESO, celdaFormulario_, avanceSobreCriterios_, estadoGeneral_,
  esCatalogacion_, abrePorProceso_, unirObservaciones_, SEPARADOR_OBS,
  ordenarPorFacultadYEstado_, avanceCombinado_, avancePorProceso_, filaDeTotales_,
  avanceGeneralAnexo1_, calcularPorcentajeGeneralAnexo1_, procesarFacultad_
};
`;

function cargarModulo() {
  const destino = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "a1-")), "modulo.js");
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

bloque("Columna D — Acción Estratégica", function () {
  const validos = [
    "AE.04.01 Simplificación administrativa",
    "AE 04.01 Simplificación administrativa",
    "AE.02.02: Programa de fortalecimiento",
    "AE 01.01Actualización continua para la formación",
    "AE-01-02 Difusión del conocimiento",
    // [C44] Sigla del PEI, tal como la registran hoy las facultades.
    "AEI.04.02 Simplificación administrativa implementada para la comunidad universitaria.",
    "AEI.01.02 Enseñanza académica en programas de estudio acreditados"
  ];
  validos.forEach(function (v) {
    chequear("acepta " + JSON.stringify(v), M.validarAccionEstrategica_(v).ok);
  });

  const invalidos = [
    ["", "vacía"],
    ["NINGUNO", "marcador de vacío"],
    ["AE.04.02", "código sin descripción"],
    ["AE.02", "numeración de un solo nivel"],
    ["AEI.04.03", "AEI sin descripción"],
    ["AEI.04", "AEI de un solo nivel"],
    ["AOI00008801072 - GESTIÓN DEL PLANEAMIENTO", "código AOI en la columna D"],
    ["OE.02", "objetivo en vez de acción"],
    ["AS.06.01", "sigla AS"],
    ["AM.01.01", "sigla AM"],
    ["AO. Gestión del Planeamiento", "actividad operativa en la columna D"]
  ];
  invalidos.forEach(function (par) {
    chequear("rechaza " + par[1], !M.validarAccionEstrategica_(par[0]).ok);
  });
});

bloque("Columna D — el diagnóstico explica el error", function () {
  const aei = M.validarAccionEstrategica_("AEI.04.03").obs;
  chequear("AEI sin descripción pide el texto de la acción", /omite la descripción/.test(aei));
  chequear("el formato exigido menciona AE y AEI", /AE\.##\.## o AEI\.##\.##/.test(aei));
  chequear("AOI en la columna D se manda a la columna E",
    /COLUMNA E/i.test(M.validarAccionEstrategica_("AOI00008801072 GESTIÓN").obs));

  const oe = M.validarAccionEstrategica_("OE.02").obs;
  chequear("OE explica el nivel jerárquico", /Objetivo Estratégico/.test(oe));
  chequear("OE indica la corrección concreta", /AE\.02\.01/.test(oe));

  const ao = M.validarAccionEstrategica_("AO. Gestión del Planeamiento").obs;
  chequear("AO señala la columna correcta", /COLUMNA E/i.test(ao));

  const as = M.validarAccionEstrategica_("AS.06.01").obs;
  chequear("AS indica el formato exigido", /AE\.##\.##/.test(as));

  const unNivel = M.validarAccionEstrategica_("AE.02").obs;
  chequear("un nivel explica objetivo vs acción", /dos niveles/.test(unNivel));
});

bloque("Columna E — Actividad Operativa (contra observación: solo exige texto)", function () {
  chequear("acepta texto real", M.validarActividadOperativa_("Gestión del planeamiento institucional").ok);
  chequear("acepta NINGUNO", M.validarActividadOperativa_("NINGUNO").ok);
  chequear("acepta N/A", M.validarActividadOperativa_("N/A").ok);
  chequear("rechaza vacía", !M.validarActividadOperativa_("").ok);
  chequear("rechaza una AE mal ubicada", !M.validarActividadOperativa_("AE.01.02 algo").ok);
  chequear("rechaza un texto de dos caracteres", !M.validarActividadOperativa_("ok").ok);
  chequear("rechaza una AEI mal ubicada", !M.validarActividadOperativa_("AEI.01.02 algo").ok);
});

bloque("Columna E — código AOI de la Actividad Operativa [C44]", function () {
  chequear("acepta AOI con guion",
    M.validarActividadOperativa_("AOI00008801072 - GESTIÓN DEL PLANEAMIENTO INSTITUCIONAL Y PRESUPUESTO").ok);
  chequear("acepta AOI sin guion",
    M.validarActividadOperativa_("AOI00008800304 GESTIÓN ADMINISTRATIVA PARA SOPORTE").ok);
  chequear("sigue aceptando texto libre sin código",
    M.validarActividadOperativa_("EJECUCIÓN DE ACTIVIDADES DE MOVILIDAD DOCENTE").ok);

  const sinTexto = M.validarActividadOperativa_("AOI00008801072");
  chequear("rechaza el código sin descripción", !sinTexto.ok && /omite su descripción/.test(sinTexto.obs));
  const corto = M.validarActividadOperativa_("AOI0000880107 - GESTIÓN");
  chequear("rechaza un código con 10 dígitos", !corto.ok && /tiene 10 dígitos/.test(corto.obs));
  chequear("rechaza un código con 12 dígitos",
    !M.validarActividadOperativa_("AOI000088010720 - GESTIÓN").ok);
});

bloque("Columnas C, F, G, H, I", function () {
  chequear("C acepta Final", M.validarTipoProducto_("Final / Salida (Programa)").ok);
  chequear("C acepta Parcial", M.validarTipoProducto_("Parcial /  Registro (Informes)").ok);
  chequear("C rechaza la nota de proceso",
    !M.validarTipoProducto_("(No combinar las celdas de los procesos ni de los sub porcesos)").ok);

  chequear("F acepta Regulación", M.validarListaCerrada_("Regulación", M.CONFIG_A1.TIPOS_ENTREGABLE, "Col F", "x").ok);
  chequear("F rechaza un valor libre", !M.validarListaCerrada_("Producto", M.CONFIG_A1.TIPOS_ENTREGABLE, "Col F", "x").ok);
  chequear("G acepta Ente rector", M.validarListaCerrada_("Ente rector", M.CONFIG_A1.ROLES_INSTITUCIONALES, "Col G", "x").ok);

  chequear("H tolera el prefijo numérico",
    M.validarListaAbierta_("2. Cumplimiento de plazos, 3. Claridad", M.CONFIG_A1.VARIABLES_CALIDAD, "Col H", "x").ok);
  chequear("H rechaza NINGUNO",
    !M.validarListaAbierta_("NINGUNO", M.CONFIG_A1.VARIABLES_CALIDAD, "Col H", "x").ok);
  chequear("I reconoce el criterio c",
    M.validarListaAbierta_("3. Contribuye al cumplimiento de la misión, estrategia, objetivos y metas",
      M.CONFIG_A1.CRITERIOS_IMPACTO, "Col I", "x").ok);
});

bloque("Localización de pestañas — títulos reales del Anexo 1", function () {
  const titulos = [
    ["Facultad de Medicina", "FM"],
    ["Facultad de Medicina Veterinaria", "FMV"],
    ["Facultad de Derecho y Ciencia Política", "FDCP"],
    ["Facultad de Letras y Ciencias Humanas", "FLCH"],
    ["Facultad de Farmacia y Bioquimica", "FFB"],
    ["Facultad de Odontologia", "FO"],
    ["Facultad de Educación", "FE"],
    ["Facultad de Química e Ingeniería Química", "FQIQ"],
    ["Facultad de Ciencias Administrativa", "FCA"],
    ["Facultad de Ciencias Biológicas", "FCB"],
    ["Facultad de Ciencias Contables", "FCC"],
    ["Facultad de Ciencias Económicas", "FCE"],
    ["Facultad de Ciencias Fisicas", "FCF"],
    ["Facultad de Ciencias Matemáticas", "FCM"],
    ["Facultad de Ciencias Sociales", "FCCSS"],
    ["Facultad de Ingeniería Geológica", "FIGMMG"],
    ["Facultad de Ingeniería Industrial", "FII"],
    ["Facultad de Psicología", "FPSIC"],
    ["Facultad de Ingeniería Eléctrica Electrónica", "FIEE"],
    ["Facultad de Ingeniería de Sistemas e Informática", "FISI"]
  ];
  titulos.forEach(function (par) {
    const f = M.facultadDeLaHoja_(par[0]);
    chequear(par[0] + " → " + par[1], f !== null && f.sigla === par[1]);
  });

  chequear("las 20 pestañas se asignan a facultades distintas",
    new Set(titulos.map(function (p) { return M.facultadDeLaHoja_(p[0]).sigla; })).size === 20);
});

bloque("Localización de pestañas — colisiones de la v2", function () {
  const hoja = function (n, id) { return { getName: function () { return n; }, getSheetId: function () { return id; } }; };
  const fac = function (s) { return M.CONFIG_A1.FACULTADES.find(function (f) { return f.sigla === s; }); };

  const hojas = [hoja("Facultad de Medicina Veterinaria", 1), hoja("Facultad de Medicina", 2)];
  const asignadas = {};
  const hFM = M.localizarHoja_(hojas, fac("FM"), asignadas);
  chequear("FM no captura la pestaña de FMV", hFM.getName() === "Facultad de Medicina");
  asignadas[hFM.getSheetId()] = true;
  chequear("FMV conserva la suya",
    M.localizarHoja_(hojas, fac("FMV"), asignadas).getName() === "Facultad de Medicina Veterinaria");

  chequear("ANEXO 1 - FCCSS no lo toma FCC", M.facultadDeLaHoja_("ANEXO 1 - FCCSS").sigla === "FCCSS");
  chequear("ANEXO 1 - FCC va a FCC", M.facultadDeLaHoja_("ANEXO 1 - FCC").sigla === "FCC");
  chequear("la sigla prevalece sobre el alias", M.facultadDeLaHoja_("FMV - Medicina").sigla === "FMV");
});

bloque("Jerarquía — procesos con código de producto", function () {
  const procesos = [
    "GESTIÓN DE CALIDAD Y MEJORA CONTINUA",
    "GESTIÓN DE LA CALIDAD Y MEJORA CONTINUA",
    "GESTIÓN DE LA FORMACIÓN ACADÉMICA",
    "GESTIÓN DE LA INVESTIGACIÓN",
    "GESTIÓN DE RECURSOS BIBLIOGRAFICOS",
    "GESTIÓN DE RESPONSABILIDAD Y VINCULACIÓN SOCIAL",
    "GESTIÓN DE TECNOLOGÍA DE LA INFORMACIÓN Y COMUNICACIÓN"
  ];
  procesos.forEach(function (n) {
    chequear("reconoce el proceso N0 " + JSON.stringify(n), M.esDenominacionDeProcesoN0_(n));
  });

  const productos = [
    "PLAN ESTRATÉGICO APROBADO", "MAGPROF APROBADO", "CONVENIOS DE COOPERACIÓN",
    "TUTORIAS ACADÉMICAS", "SILABO DE ESTUDIOS", "GESTIÓN DE GRADOS Y TÍTULOS"
  ];
  productos.forEach(function (n) {
    chequear("no confunde el producto " + JSON.stringify(n), !M.esDenominacionDeProcesoN0_(n));
  });
});

bloque("Cobertura de los 16 procesos de Nivel 0", function () {
  const vacia = M.filasNivel0_("FM", {}, {});
  const porCodigo = function (c) { return vacia.find(function (f) { return f[1] === c; }); };

  chequear("son 16 procesos", vacia.length === 16);
  chequear("PE.03 se reporta como NO APLICA", porCodigo("PE.03")[6] === "NO APLICA");
  chequear("PS.08 se reporta como NO APLICA", porCodigo("PS.08")[6] === "NO APLICA");
  chequear("quedan 14 obligatorios sin registrar",
    vacia.filter(function (f) { return f[6] === "SIN REGISTRAR"; }).length === 14);
  chequear("un faltante puntúa 0", porCodigo("PE.01")[8] === "0/" + M.TOTAL_CRITERIOS_PROCESO);
  chequear("un opcional ausente no puntúa", porCodigo("PE.03")[8] === "—");

  const conforme = M.clasificarFila_("PE.01_F01 GESTIÓN ESTRATÉGICA", function () { return true; }, "F01");
  const llena = M.filasNivel0_("FM", { "PE.01": { fila: 7, cls: conforme } }, {});
  chequear("un Nivel 0 correcto sale CONFORME al 100%",
    llena[0][6] === "CONFORME" && llena[0][7] === "100%");
  chequear("y registra la fila del Anexo 1", llena[0][5] === 7);
});


/* ─── Bloques añadidos en la v4, a partir de las contra observaciones ─────── */

/** Construye el predicado `esPadre` a partir de una lista de códigos. */
function padreEntre(codigos) {
  const normalizados = codigos.map(M.normalizarCodigo_);
  return function (base) {
    const b = M.normalizarCodigo_(base);
    return normalizados.some(function (x) { return x !== b && x.indexOf(b + ".") === 0; });
  };
}

bloque("Jerarquía de profundidad variable (contra observación FDCP)", function () {
  const fdcp = padreEntre([
    "PM.01", "PM.01.01", "PM.01.01.01", "PM.01.01.01.01", "PM.01.01.01.02",
    "PM.01.02.02", "PM.01.02.02.05"
  ]);

  const subproceso = M.clasificarFila_("PM.01.01.01_F02 DISEÑO Y ACTUALIZACIÓN CURRICULAR", fdcp);
  chequear("un código con descendientes es proceso, no producto", subproceso.tipo === "proceso");

  const cinco = M.clasificarFila_("PM.01.01.01.01_F02 PLAN CURRICULAR DE PREGRADO DE LAS ESCUELAS", fdcp);
  chequear("un código de cinco niveles es producto", cinco.tipo === "producto");
  chequear("y conserva su código", cinco.codigo && cinco.codigo.indexOf("PM.01.01.01.01") === 0);

  const hoja = M.clasificarFila_("PM.01.02.02.05_F02 INFORME DE ACTIVIDADES DEL DOCENTE CONTRATADO VALIDADO", fdcp);
  chequear("PM.01.02.02.05 es producto con código", hoja.tipo === "producto" && !!hoja.codigo);

  const fm = padreEntre(["PE.01", "PE.01.01", "PE.01.01.01", "PE.01.02", "PE.01.02.01"]);
  chequear("regresión FM: PE.01.01.01 sigue siendo producto",
    M.clasificarFila_("PE.01.01.01_F01 PLAN ESTRATÉGICO APROBADO", fm).tipo === "producto");
  chequear("regresión FM: PE.01.02 sigue siendo proceso",
    M.clasificarFila_("PE.01.02_F01 MODERNIZACIÓN DE LA FACULTAD", fm).tipo === "proceso");
  chequear("FO: un código de dos niveles sin hijos es producto",
    M.clasificarFila_("PM.02.01_F05 ARTÍCULOS CIENTÍFICOS PUBLICADOS.", padreEntre(["PM.02", "PM.02.01"])).tipo === "producto");
  chequear("un código de un solo nivel sin hijos no es producto",
    M.clasificarFila_("PS.11_F03 ALGO NO CATALOGADO", padreEntre(["PS.11"])).tipo === "proceso");
  chequear("un código de Nivel 0 sin hijos se clasifica como nivel0",
    M.clasificarFila_("PS.08_F03 GESTIÓN DE ACTIVIDADES PRODUCTIVAS", padreEntre(["PS.08"])).tipo === "nivel0");
});

bloque("Nivel 0 por código embebido o denominación (contra observaciones de cobertura)", function () {
  const fo = M.clasificarFila_("PM.03.19_F05 PS.01 GESTIÓN DE ADMISIÓN Y MATRÍCULA", padreEntre(["PM.03", "PM.03.19"]));
  chequear("FO: reconoce PS.01 pese al código PM.03.19", fo.tipo === "nivel0" && fo.nivel0.codigo === "PS.01");
  chequear("FO: declara la codificación errónea",
    fo.observaciones.some(function (o) { return /CODIFICACIÓN ERRÓNEA/.test(o); }));

  const ffb = M.clasificarFila_("PE.01.03.06_F04 PE.02_04 GESTIÓN DE LA CALIDAD Y MEJORA CONTINUA",
    padreEntre(["PE.01", "PE.01.03", "PE.01.03.06"]));
  chequear("FFB: reconoce PE.02", ffb.tipo === "nivel0" && ffb.nivel0.codigo === "PE.02");

  const fqiq = M.clasificarFila_("PM.01.04.07_F07 PM.02.F07 GESTIÓN DE LA INVESTIGACIÓN",
    padreEntre(["PM.01", "PM.01.04", "PM.01.04.07"]));
  chequear("FQIQ: reconoce PM.02 con sufijo .F07", fqiq.tipo === "nivel0" && fqiq.nivel0.codigo === "PM.02");

  const fe = M.clasificarFila_("PS.09_F06 Gestión de Comunicación", padreEntre(["PS.09"]));
  chequear("FE: la denominación manda sobre el código", fe.tipo === "nivel0" && fe.nivel0.codigo === "PS.10");
  chequear("FE: reporta la discrepancia código/denominación",
    fe.observaciones.some(function (o) { return /Discrepancia entre código y denominación/.test(o); }));

  chequear("acepta el sufijo _04 sin la F",
    M.extraerCodigos_("PE.02_04 GESTIÓN").length === 1);
  chequear("la denominación sale limpia de códigos",
    M.denominacionDe_("PM.03.19_F05 PS.01 GESTIÓN DE ADMISIÓN Y MATRÍCULA",
      M.extraerCodigos_("PM.03.19_F05 PS.01 GESTIÓN DE ADMISIÓN Y MATRÍCULA")) === "GESTIÓN DE ADMISIÓN Y MATRÍCULA");
});

bloque("Denominación de proceso en MAYÚSCULAS (regla pedida por el revisor)", function () {
  const minuscula = M.clasificarFila_("PS.09_F06 Gestión de Comunicación", padreEntre(["PS.09"]));
  chequear("detecta la denominación en minúsculas",
    minuscula.observaciones.some(function (o) { return /MAYÚSCULAS/.test(o); }));

  const correcta = M.clasificarFila_("PE.01_F05 GESTIÓN ESTRATÉGICA", padreEntre(["PE.01"]));
  chequear("no marca las que ya están bien",
    !correcta.observaciones.some(function (o) { return /MAYÚSCULAS/.test(o); }));

  const subproceso = M.clasificarFila_("PE.02.01_F05 Aseguramiento de la Calidad",
    padreEntre(["PE.02.01", "PE.02.01.01"]));
  chequear("también aplica a los subprocesos",
    subproceso.tipo === "proceso" && subproceso.observaciones.some(function (o) { return /MAYÚSCULAS/.test(o); }));
});

bloque("Preservación de las columnas del revisor", function () {
  const hojaSimulada = function (valores) {
    return {
      getLastRow: function () { return valores.length; },
      getLastColumn: function () { return valores[0].length; },
      getRange: function (r, c, nr, nc) {
        return { getValues: function () {
          return valores.slice(r - 1, r - 1 + nr).map(function (f) { return f.slice(c - 1, c - 1 + nc); });
        } };
      }
    };
  };

  const encabezados = ["FACULTAD", "CÓDIGO", "PROCESO NIVEL 0", "EXIGENCIA", "ESTADO", "OBSERVACIÓN"];
  const clave = function (f) { return f[0] + "␟" + f[1]; };

  const previas = [
    encabezados.concat(["CONTRA OBSERVACIÓN"]),
    ["FFB", "PE.02", "GESTIÓN DE LA CALIDAD", "Obligatorio", "FALTANTE", "obs", "Sí tiene la denominación"],
    ["FO", "PS.01", "GESTIÓN DE ADMISIÓN", "Obligatorio", "FALTANTE", "obs", ""]
  ];
  const rescate = M.rescatarColumnasManuales_(hojaSimulada(previas), encabezados, clave);

  chequear("detecta la columna añadida a mano",
    rescate.encabezados.length === 1 && rescate.encabezados[0] === "CONTRA OBSERVACIÓN");
  chequear("recupera el texto del revisor", rescate.porClave["FFB␟PE.02"][0] === "Sí tiene la denominación");
  chequear("ignora las filas sin contra observación", rescate.porClave["FO␟PS.01"] === undefined);

  const sinExtras = M.rescatarColumnasManuales_(
    hojaSimulada([encabezados, ["FFB", "PE.02", "a", "b", "c", "d"]]), encabezados, clave);
  chequear("sin columnas extra no rescata nada", sinExtras.encabezados.length === 0);

  chequear("una hoja inexistente no rompe el rescate",
    M.rescatarColumnasManuales_(null, encabezados, clave).encabezados.length === 0);
});


bloque("Codificación errónea con el código correcto en la misma celda", function () {
  const fo = M.clasificarFila_("PM.03.173_F05 PS.08 GESTIÓN DE ACTIVIDADES PRODUCTIVAS",
    padreEntre(["PM.03", "PM.03.173"]), "F05");

  chequear("reconoce PS.08", fo.tipo === "nivel0" && fo.nivel0.codigo === "PS.08");

  const obs = fo.observaciones.join(" ");
  chequear("declara la codificación errónea", /CODIFICACIÓN ERRÓNEA/.test(obs));
  chequear("nombra el código que sobra", /PM\.03\.173_F05/.test(obs));
  chequear("nombra el código que debe quedar", /PS\.08_F05/.test(obs));
  chequear("marca fallado el criterio de código único", fo.checks.unico === false);

  const ps10 = M.clasificarFila_("PM.03.180_F05 PS.10 GESTIÓN DE LA COMUNICACIÓN",
    padreEntre(["PM.03", "PM.03.180"]), "F05");
  chequear("el mismo diagnóstico aplica a PS.10",
    ps10.nivel0.codigo === "PS.10" && /CODIFICACIÓN ERRÓNEA/.test(ps10.observaciones.join(" ")));

  const corregido = M.clasificarFila_("PS.10_F05 GESTIÓN DE LA COMUNICACIÓN", padreEntre(["PS.10"]), "F05");
  chequear("una vez corregido el código, no hay observación",
    corregido.tipo === "nivel0" && corregido.nivel0.codigo === "PS.10" && corregido.observaciones.length === 0);
});

bloque("Sufijo de formulario consistente en la pestaña", function () {
  chequear("extrae el sufijo con guion bajo", M.sufijoDe_("PS.10_F04") === "F04");
  chequear("extrae el sufijo con punto", M.sufijoDe_("PM.02.F07") === "F07");
  chequear("acepta el sufijo sin la F tras guion bajo", M.sufijoDe_("PE.02_04") === "F04");
  chequear("no confunde el último grupo del código con un sufijo", M.sufijoDe_("PM.03.173") === null);
  chequear("sin sufijo devuelve null", M.sufijoDe_("PS.10") === null);

  const ajeno = M.clasificarFila_("PS.10_F04 GESTIÓN DE LA COMUNICACIÓN", padreEntre(["PS.10"]), "F05");
  chequear("detecta el sufijo que no corresponde a la hoja", ajeno.checks.sufijo === false);
  chequear("y lo explica", /Sufijo de formulario incorrecto/.test(ajeno.observaciones.join(" ")));

  const propio = M.clasificarFila_("PS.10_F05 GESTIÓN DE LA COMUNICACIÓN", padreEntre(["PS.10"]), "F05");
  chequear("no marca el sufijo correcto", propio.checks.sufijo === true);

  const sinEsperado = M.clasificarFila_("PS.10_F04 GESTIÓN DE LA COMUNICACIÓN", padreEntre(["PS.10"]), null);
  chequear("sin sufijo dominante no inventa observaciones", sinEsperado.checks.sufijo === true);
});

bloque("Puntuación de las filas de proceso", function () {
  chequear("son 5 criterios", M.TOTAL_CRITERIOS_PROCESO === 5 && M.CRITERIOS_PROCESO.length === 5);

  const todoBien = { unico: true, coherente: true, sufijo: true, mayusculas: true };
  chequear("todo correcto y registrado puntúa 5", M.puntuarProceso_(todoBien, true) === 5);
  chequear("no registrado pierde un punto", M.puntuarProceso_(todoBien, false) === 4);
  chequear("dos fallos restan dos puntos",
    M.puntuarProceso_({ unico: false, coherente: true, sufijo: false, mayusculas: true }, true) === 3);

  const cls = M.clasificarFila_("PS.09_F04 Gestión de Recursos Bibliográficos", padreEntre(["PS.09"]), "F05");
  const fila = M.filaDeProceso_("FO", "PS.09", "GESTIÓN DE RECURSOS BIBLIOGRÁFICOS", "Nivel 0", "Obligatorio", 292, cls);
  chequear("una fila con dos fallos sale OBSERVADO", fila[6] === "OBSERVADO");
  chequear("y muestra el detalle puntuado", fila[8] === "3/5");
  chequear("con el porcentaje correspondiente", fila[7] === "60%");
  chequear("y las observaciones en la misma fila",
    /Sufijo de formulario/.test(fila[9]) && /MAYÚSCULAS/.test(fila[9]));
});

bloque("Rescate de columnas tras el cambio de formato de la hoja", function () {
  const hojaSimulada = function (valores) {
    return {
      getLastRow: function () { return valores.length; },
      getLastColumn: function () { return valores[0].length; },
      getRange: function (r, c, nr, nc) {
        return { getValues: function () {
          return valores.slice(r - 1, r - 1 + nr).map(function (f) { return f.slice(c - 1, c - 1 + nc); });
        } };
      }
    };
  };

  // Hoja COBERTURA_PROCESOS_A1 de la v4: 6 columnas generadas + la del revisor.
  const previaV4 = [
    ["FACULTAD", "CÓDIGO", "PROCESO NIVEL 0", "EXIGENCIA", "ESTADO", "OBSERVACIÓN", "CONTRA OBSERVACIÓN"],
    ["FO", "PS.09", "GESTIÓN DE RECURSOS BIBLIOGRÁFICOS", "Obligatorio", "FALTANTE", "obs", "Corregido en B292"],
    ["FO", "PS.10", "GESTIÓN DE LA COMUNICACIÓN", "Obligatorio", "FALTANTE", "obs", "Corregido en B324"]
  ];
  // La hoja nueva tiene 10 columnas generadas: más que la previa.
  const encabezadosV5 = ["FACULTAD", "CÓDIGO", "PROCESO", "NIVEL", "EXIGENCIA", "FILA",
                         "ESTADO", "CUMPLIMIENTO", "CRITERIOS", "OBSERVACIONES Y CORRECCIONES"];
  const clave = function (f) { return f[0] + "␟" + M.normalizarCodigo_(f[1]); };

  const rescate = M.rescatarColumnasManuales_(hojaSimulada(previaV4), encabezadosV5, clave);

  chequear("rescata aunque la hoja previa sea más angosta que la nueva",
    rescate.encabezados.length === 1 && rescate.encabezados[0] === "CONTRA OBSERVACIÓN");
  chequear("conserva la contra observación de PS.09", rescate.porClave["FO␟PS.09"][0] === "Corregido en B292");
  chequear("conserva la contra observación de PS.10", rescate.porClave["FO␟PS.10"][0] === "Corregido en B324");
  chequear("no confunde PROCESO NIVEL 0 ni OBSERVACIÓN con columnas del revisor",
    rescate.encabezados.indexOf("PROCESO NIVEL 0") === -1 && rescate.encabezados.indexOf("OBSERVACIÓN") === -1);
});



bloque("El formulario oficial manda sobre el uso de la pestaña", function () {
  const F = function (sigla) {
    return M.CONFIG_A1.FACULTADES.find(function (f) { return f.sigla === sigla; });
  };
  const fo = F("FO");

  const ajeno = M.clasificarFila_("PS.10_F04 GESTIÓN DE LA COMUNICACIÓN",
    padreEntre(["PS.10"]), fo.formulario);
  chequear("_F04 en una hoja de la FO se marca", ajeno.checks.sufijo === false);
  chequear("y el mensaje nombra el que usa el resto de la pestaña",
    /resto de la pestaña usa "_F05"/.test(ajeno.observaciones.join(" ")));

  const propio = M.clasificarFila_("PS.10_F05 GESTIÓN DE LA COMUNICACIÓN",
    padreEntre(["PS.10"]), fo.formulario);
  chequear("_F05 no se marca", propio.checks.sufijo === true);

  // [C41] Sufijo que cada pestaña usa mayoritariamente HOY en el Anexo 1,
  // medido sobre las 3 668 filas del libro. Cinco no coinciden con el oficial.
  const usoReal = {
    FM: "F01", FDCP: "F02", FLCH: "F03", FFB: "F04", FO: "F05", FE: "F06",
    FQIQ: "F07", FMV: "F08", FCA: "F09", FCB: "F10", FCC: "F11", FCE: "F12",
    FCF: "F02", FCM: "F14", FCCSS: "F02", FIGMMG: "F06", FII: "F17",
    FPSIC: "F18", FIEE: "F17", FISI: "F02"
  };
  const ajenas = M.CONFIG_A1.FACULTADES
    .filter(function (f) { return usoReal[f.sigla] !== f.formulario; })
    .map(function (f) { return f.sigla; });

  chequear("solo cinco pestañas usan un formulario ajeno",
    ajenas.join(",") === "FCF,FCCSS,FIGMMG,FIEE,FISI");

  // Estas dos se marcaban por el desfase del catálogo, no por la hoja.
  chequear("la FII deja de marcarse: usa _F17 y su oficial es _F17",
    M.celdaFormulario_(F("FII"), usoReal.FII) === "F17");
  chequear("la FPSIC deja de marcarse: usa _F18 y su oficial es _F18",
    M.celdaFormulario_(F("FPSIC"), usoReal.FPSIC) === "F18");

  // Estas dos siguen marcadas, pero contra el número oficial corregido.
  chequear("la FIEE sigue marcada contra su oficial corregido _F19",
    M.celdaFormulario_(F("FIEE"), usoReal.FIEE) === "F19 (la hoja usa F17)");
  chequear("la FISI sigue marcada contra su oficial corregido _F20",
    M.celdaFormulario_(F("FISI"), usoReal.FISI) === "F20 (la hoja usa F02)");
});

bloque("Los nombres oficiales no rompen la localización de pestañas", function () {
  const titulos = [
    ["Facultad de Ingeniería Eléctrica Electrónica", "FIEE"],
    ["FACULTAD DE INGENIERÍA ELECTRÓNICA Y ELÉCTRICA", "FIEE"],
    ["FACULTAD DE INGENIERÍA DE SISTEMAS E INFORMÁTICA", "FISI"],
    ["FACULTAD DE INGENIERÍA INDUSTRIAL", "FII"],
    ["FACULTAD DE PSICOLOGÍA", "FPSIC"],
    ["FACULTAD DE CIENCIAS FÍSICAS", "FCF"],
    ["FACULTAD DE CIENCIAS SOCIALES", "FCCSS"],
    ["FACULTAD DE INGENIERÍA GEOLÓGICA, MINERA, METALÚRGICA Y GEOGRÁFICA", "FIGMMG"],
    ["FACULTAD DE MEDICINA", "FM"],
    ["FACULTAD DE MEDICINA VETERINARIA", "FMV"]
  ];
  titulos.forEach(function (par) {
    const f = M.facultadDeLaHoja_(par[0]);
    chequear(par[0].slice(0, 46) + " → " + par[1], f !== null && f.sigla === par[1]);
  });

  const siglas = M.CONFIG_A1.FACULTADES.map(function (f) {
    return M.facultadDeLaHoja_(f.nombre) ? M.facultadDeLaHoja_(f.nombre).sigla : null;
  });
  chequear("cada nombre oficial resuelve a su propia facultad",
    siglas.join(",") === M.CONFIG_A1.FACULTADES.map(function (f) { return f.sigla; }).join(","));
});



bloque("La pestaña titulada con el nombre oficial también resuelve", function () {
  M.CONFIG_A1.FACULTADES.forEach(function (f) {
    const hallada = M.facultadDeLaHoja_(f.nombre);
    chequear(f.nombre.slice(0, 40) + " → " + f.sigla, hallada !== null && hallada.sigla === f.sigla);
  });
  chequear("la FIEE resuelve con el orden invertido del título real",
    M.facultadDeLaHoja_("Facultad de Ingeniería Eléctrica Electrónica").sigla === "FIEE");
});


bloque("Formularios oficiales por facultad", function () {
  const F = function (sigla) {
    return M.CONFIG_A1.FACULTADES.find(function (f) { return f.sigla === sigla; });
  };

  chequear("son 20 facultades", M.CONFIG_A1.FACULTADES.length === 20);

  const oficiales = {
    FM: "F01", FDCP: "F02", FLCH: "F03", FFB: "F04", FO: "F05", FE: "F06",
    FQIQ: "F07", FMV: "F08", FCA: "F09", FCB: "F10", FCC: "F11", FCE: "F12",
    FCF: "F13", FCM: "F14", FCCSS: "F15", FIGMMG: "F16", FII: "F17",
    FPSIC: "F18", FIEE: "F19", FISI: "F20"
  };
  Object.keys(oficiales).forEach(function (sigla) {
    chequear(sigla + " = " + oficiales[sigla], F(sigla).formulario === oficiales[sigla]);
  });

  chequear("los 20 formularios están declarados",
    M.CONFIG_A1.FACULTADES.every(function (f) { return !!f.formulario; }));
  chequear("la numeración es posicional: cada facultad lleva el F de su puesto",
    M.CONFIG_A1.FACULTADES.every(function (f, i) {
      const n = i + 1;
      return f.formulario === "F" + (n < 10 ? "0" + n : n);
    }));

  chequear("los 20 formularios son distintos",
    new Set(M.CONFIG_A1.FACULTADES.map(function (f) { return f.formulario; })).size === 20);
  chequear("cubren F01..F20 sin huecos", (function () {
    const n = M.CONFIG_A1.FACULTADES.map(function (f) { return parseInt(f.formulario.slice(1), 10); })
      .sort(function (a, b) { return a - b; });
    return n.every(function (v, i) { return v === i + 1; });
  })());

  chequear("los nombres oficiales están en mayúsculas",
    M.CONFIG_A1.FACULTADES.every(function (f) { return f.nombre === f.nombre.toUpperCase(); }));
  chequear("FIEE lleva el nombre oficial",
    F("FIEE").nombre === "FACULTAD DE INGENIERÍA ELECTRÓNICA Y ELÉCTRICA");
  chequear("FCA lleva el nombre oficial en plural",
    F("FCA").nombre === "FACULTAD DE CIENCIAS ADMINISTRATIVAS");

  // El título de la pestaña no coincide con el nombre oficial en varias hojas.
  chequear("FIEE se localiza pese al orden invertido del título",
    M.facultadDeLaHoja_("Facultad de Ingeniería Eléctrica Electrónica").sigla === "FIEE");
  chequear("FIEE también con el nombre oficial",
    M.facultadDeLaHoja_("FACULTAD DE INGENIERÍA ELECTRÓNICA Y ELÉCTRICA").sigla === "FIEE");
  chequear("FCA se localiza con el título en singular",
    M.facultadDeLaHoja_("Facultad de Ciencias Administrativa").sigla === "FCA");
});

bloque("Celda FORMULARIO del resumen", function () {
  const fo = { sigla: "FO", formulario: "F05" };
  chequear("coincidencia: solo el oficial", M.celdaFormulario_(fo, "F05") === "F05");
  chequear("discrepancia: señala el que usa la hoja",
    M.celdaFormulario_(fo, "F02") === "F05 (la hoja usa F02)");

  const sinDeclarar = { sigla: "FISI", formulario: null };
  chequear("sin declarar: muestra el dominante",
    M.celdaFormulario_(sinDeclarar, "F02") === "F02 (oficial sin declarar)");
  chequear("sin declarar y sin códigos", M.celdaFormulario_(sinDeclarar, null) === "— (oficial sin declarar)");
});

bloque("Hoja mal numerada: hallazgo de hoja, no de fila", function () {
  // La FII usa _F17 en toda la pestaña y su formulario oficial es _F20.
  // Ninguna fila debe salir observada por el sufijo: el defecto es de la hoja.
  const fila = M.clasificarFila_("PM.01_F17 GESTIÓN DE LA FORMACIÓN ACADÉMICA",
    padreEntre(["PM.01"]), "F17", "F20");
  chequear("la fila no se marca por el sufijo", fila.checks.sufijo === true);
  chequear("ni genera observación de sufijo",
    !fila.observaciones.some(function (o) { return /Sufijo de formulario/.test(o); }));

  // Una fila suelta que se aparta del dominante sí se marca.
  const suelta = M.clasificarFila_("PS.10_F04 GESTIÓN DE LA COMUNICACIÓN",
    padreEntre(["PS.10"]), "F05", "F05");
  chequear("la fila suelta sí se marca", suelta.checks.sufijo === false);

  // El código sugerido usa el formulario OFICIAL, no el dominante equivocado.
  const erronea = M.clasificarFila_("PM.03.173_F17 PS.08 GESTIÓN DE ACTIVIDADES PRODUCTIVAS",
    padreEntre(["PM.03", "PM.03.173"]), "F17", "F20");
  chequear("la corrección sugerida usa el formulario oficial",
    /PS\.08_F20/.test(erronea.observaciones.join(" ")));
});

bloque("Coherencia entre encabezados y filas del dashboard", function () {
  // Un desajuste entre encabezados y celdas desplaza las columnas del revisor.
  // Se cuentan los elementos de cada literal respetando comillas y paréntesis.
  const fuente = require("fs").readFileSync(FUENTE, "utf8");

  function contarElementos(literal) {
    let nivel = 0, comillas = null, n = 1;
    for (let i = 0; i < literal.length; i++) {
      const c = literal[i];
      if (comillas) {
        if (c === "\\") i++;
        else if (c === comillas) comillas = null;
      } else if (c === '"' || c === "'") comillas = c;
      else if (c === "(" || c === "[") nivel++;
      else if (c === ")" || c === "]") nivel--;
      else if (c === "," && nivel === 0) n++;
    }
    return n;
  }

  function literalTras(marca) {
    const i = fuente.indexOf(marca);
    if (i === -1) return null;
    const ini = fuente.indexOf("[", i);
    let nivel = 0;
    for (let j = ini; j < fuente.length; j++) {
      if (fuente[j] === "[") nivel++;
      else if (fuente[j] === "]") { nivel--; if (!nivel) return fuente.slice(ini + 1, j); }
    }
    return null;
  }

  const enc = literalTras('volcarHoja_(ss, "RESUMEN_EJECUTIVO_A1"');
  chequear("se encuentran los encabezados del resumen", enc !== null);
  const nEnc = contarElementos(enc);
  chequear("el resumen declara 21 columnas", nEnc === 21);

  const construcciones = [];
  let desde = 0;
  while (true) {
    const i = fuente.indexOf("resumenFila", desde);
    if (i === -1) break;
    desde = i + 1;
    if (fuente.slice(i - 20, i).indexOf("r.") !== -1) continue;
    const ini = fuente.indexOf("[", i);
    if (ini === -1 || ini - i > 40) continue;
    let nivel = 0;
    for (let j = ini; j < fuente.length; j++) {
      if (fuente[j] === "[") nivel++;
      else if (fuente[j] === "]") { nivel--; if (!nivel) { construcciones.push(fuente.slice(ini + 1, j)); break; } }
    }
  }
  const pushResumen = literalTras("resumen.push(");
  if (pushResumen) construcciones.push(pushResumen);

  chequear("se localizan las tres construcciones de fila", construcciones.length === 3);
  construcciones.forEach(function (c, i) {
    const n = contarElementos(c);
    chequear("la fila de resumen #" + (i + 1) + " tiene " + nEnc + " celdas (tiene " + n + ")", n === nEnc);
  });
});


bloque("Vocabulario único CONFORME / OBSERVADO", function () {
  chequear("estadoGeneral_ al 100 % es CONFORME, no COMPLETO", M.estadoGeneral_(100) === "CONFORME");
  chequear("75 % es AVANZADO", M.estadoGeneral_(75) === "AVANZADO");
  chequear("40 % es EN DESARROLLO", M.estadoGeneral_(40) === "EN DESARROLLO");
  chequear("39 % es CRÍTICO", M.estadoGeneral_(39) === "CRÍTICO");

  const fuente = require("fs").readFileSync(FUENTE, "utf8");
  const cuerpo = fuente.replace(/VALORES_NULOS:[\s\S]*?\],/, "");
  ["COMPLETO", "PARCIAL", "PENDIENTE"].forEach(function (t) {
    chequear("ya no se usa el estado " + t, cuerpo.indexOf('"' + t + '"') === -1);
  });
  chequear("los colores cubren CONFORME y OBSERVADO",
    /"CONFORME":/.test(fuente) && /"OBSERVADO":/.test(fuente));
});

bloque("Avance sobre criterios cumplidos", function () {
  chequear("todo cumplido es 100 %", M.avanceSobreCriterios_([8, 8, 8], 8) === 100);
  chequear("nada cumplido es 0 %", M.avanceSobreCriterios_([0, 0], 8) === 0);
  chequear("mitad de criterios es 50 %", M.avanceSobreCriterios_([4, 4], 8) === 50);
  chequear("sin filas devuelve 0", M.avanceSobreCriterios_([], 8) === 0);

  // Lo que la ponderación por estado no distinguía: a un producto le falta un
  // criterio y el otro está vacío. Ambos eran "observados"; ahora pesan distinto.
  const casiCompleto = M.avanceSobreCriterios_([7], 8);
  const vacio = M.avanceSobreCriterios_([1], 8);
  chequear("un producto casi completo pesa mucho más que uno vacío",
    casiCompleto === 88 && vacio === 13);

  chequear("los procesos se miden sobre 5 criterios",
    M.avanceSobreCriterios_([5, 5], M.TOTAL_CRITERIOS_PROCESO) === 100 &&
    M.avanceSobreCriterios_([3], M.TOTAL_CRITERIOS_PROCESO) === 60);
});



bloque("Prefijo de las observaciones (contra observación de la FFB)", function () {
  const muestras = [
    M.validarAccionEstrategica_("").obs,
    M.validarAccionEstrategica_("AEI.04.03").obs,
    M.validarActividadOperativa_("").obs,
    M.validarTipoProducto_("").obs,
    M.validarListaCerrada_("", M.CONFIG_A1.TIPOS_ENTREGABLE, "Columna F", "Clasificación").obs,
    M.validarListaAbierta_("", M.CONFIG_A1.VARIABLES_CALIDAD, "Columna H", "Variables").obs,
    M.clasificarFila_("PS.10_F04 GESTIÓN DE LA COMUNICACIÓN", function () { return false; }, "F05")
      .observaciones.join(" ")
  ];

  muestras.forEach(function (o, i) {
    chequear("la observación #" + (i + 1) + " usa \"Columna X -->\"", /Columna [A-I] -->/.test(o));
    chequear("la observación #" + (i + 1) + " ya no usa \"Col X —\"", !/\bCol [A-I] —/.test(o));
  });

  const fuente = require("fs").readFileSync(FUENTE, "utf8");
  const cuerpo = fuente.slice(fuente.indexOf("const CONFIG_A1"));
  chequear("no queda ningún \"Col X —\" en el código", !/'Col [A-I] — /.test(cuerpo));
  chequear("las etiquetas de columna son \"Columna X\"",
    /"Columna F"/.test(cuerpo) && /"Columna I"/.test(cuerpo));
});



bloque("Catalogaciones y procesos mal codificados (contra observaciones del detallado)", function () {
  // Las 13 filas que el revisor marcó en DETALLADO_PRODUCTOS_A1, con la lista de
  // códigos que existe en su pestaña para poder resolver la relación padre-hijo.
  const casos = [
    [397,  "PE.02.01.05_F04 PE.02.01_04 ASEGURAMIENTO DE LA CALIDAD", "proceso",
     ["PE.02.01", "PE.02.01.01", "PE.02.01.05"]],
    [470,  "PM.03.04.04_F04 PROCESOS DE SOPORTE", "categoria", []],
    [630,  "PS.10.02_F04 PROCESO DE ARTICULACIÓN Y DIFUSIÓN INFORMATIVA", "proceso", ["PS.10.02"]],
    [633,  "PS.10.03_F04 PROCESO DE COBERTURA Y SOPORTE PROTOCOLAR", "proceso", ["PS.10.03"]],
    [666,  "PE.03.02.05_F05 PROCESOS MISIONALES", "categoria", []],
    [712,  "PM.03.18_F05 PROCESOS DE SOPORTE", "categoria", []],
    [928,  "F06 PROCESOS MISIONALES", "categoria", []],
    [942,  "PM.03.05_F06 PROCESOS DE SOPORTE", "categoria", []],
    [1087, "PM.03.03.04_F07 PROCESOS DE SOPORTE", "categoria", []],
    [1224, "PROCESO MISIONAL", "categoria", []],
    [1244, "PROCESO DE SOPORTE", "categoria", []],
    [2327, "PE.03.02.07_F17 PROCESOS MISIONALES", "categoria", []],
    [1420, "PE.02.01.01_F10 PE.02.01.01 — MANTENIMIENTO DEL SISTEMA DE GESTIÓN DE CALIDAD",
     "producto", ["PE.02.01", "PE.02.01.01"]]
  ];

  casos.forEach(function (c) {
    const r = M.clasificarFila_(c[1], padreEntre(c[3]), "F04", "F04");
    chequear("fila " + c[0] + " se clasifica como " + c[2] + " (sale " + r.tipo + ")", r.tipo === c[2]);
  });

  // Una catalogación con código debe pedir que se retire.
  const conCodigo = M.clasificarFila_("PM.03.04.04_F04 PROCESOS DE SOPORTE", padreEntre([]), "F04", "F04");
  chequear("la catalogación con código lo reporta",
    /NO LE CORRESPONDE UNA CODIFICACIÓN/.test(conCodigo.observaciones.join(" ")));
  chequear("y nombra el código que sobra", /PM\.03\.04\.04_F04/.test(conCodigo.observaciones.join(" ")));
  chequear("marca fallado el criterio de código", conCodigo.checks.unico === false);

  // Sin código no hay nada que corregir.
  const sinCodigo = M.clasificarFila_("PROCESO DE SOPORTE", padreEntre([]), "F04", "F04");
  chequear("la catalogación sin código no se observa", sinCodigo.observaciones.length === 0);

  // El número de formulario suelto también es una codificación que no toca.
  const sueltoF = M.clasificarFila_("F06 PROCESOS MISIONALES", padreEntre([]), "F06", "F06");
  chequear("el F## suelto se reporta",
    /NO LE CORRESPONDE UNA CODIFICACIÓN/.test(sueltoF.observaciones.join(" ")));

  // Un proceso codificado como producto pide corregir la codificación.
  const malCod = M.clasificarFila_("PS.10.03_F04 PROCESO DE COBERTURA Y SOPORTE PROTOCOLAR",
    padreEntre(["PS.10.03"]), "F04", "F04");
  chequear("el proceso mal codificado lo dice",
    /CODIFICACIÓN A CORREGIR/.test(malCod.observaciones.join(" ")));
});

bloque("Singular y plural en las catalogaciones", function () {
  ["PROCESOS ESTRATÉGICOS", "PROCESOS MISIONALES", "PROCESOS DE SOPORTE",
   "PROCESO MISIONAL", "PROCESO DE SOPORTE", "PROCESO ESTRATÉGICO"
  ].forEach(function (t) {
    chequear("reconoce la catalogación " + JSON.stringify(t), M.esCatalogacion_(t));
  });

  ["PLAN ESTRATÉGICO APROBADO", "GESTIÓN DE LA INVESTIGACIÓN",
   "PROCESOS DE ADQUISICIÓN TRAMITADOS", "PROCESO DE COBERTURA Y SOPORTE PROTOCOLAR"
  ].forEach(function (t) {
    chequear("no confunde " + JSON.stringify(t), !M.esCatalogacion_(t));
  });

  chequear("PROCESO DE ... en singular nombra un proceso",
    M.abrePorProceso_("PROCESO DE COBERTURA Y SOPORTE PROTOCOLAR"));
  chequear("SUBPROCESO ... nombra un proceso", M.abrePorProceso_("SUBPROCESO DE ALGO"));

  // El plural describe entregables: "PROCESOS DE ADQUISICIÓN TRAMITADOS" es un
  // producto real de la FO y no debe irse a la hoja de procesos.
  chequear("el plural NO nombra un proceso",
    !M.abrePorProceso_("PROCESOS DE ADQUISICIÓN TRAMITADOS"));
  chequear("una denominación normal tampoco",
    !M.abrePorProceso_("PLAN ESTRATÉGICO APROBADO"));
});

bloque("Cierre de los productos sin registro", function () {
  const fuente = require("fs").readFileSync(FUENTE, "utf8");
  chequear("se añade la recomendación de los desplegables",
    /Observación final --> Para las columnas C a I utilice los desplegables/.test(fuente));
  chequear("ya no encabeza con PRODUCTO SIN REGISTRAR",
    fuente.indexOf("PRODUCTO SIN REGISTRAR:") === -1);
});


bloque("Una observación por renglón", function () {
  chequear("el separador es un salto de línea", M.SEPARADOR_OBS === "\n");
  chequear("ya no se encadena con ||",
    require("fs").readFileSync(FUENTE, "utf8").indexOf('join("  ||  ")') === -1);

  chequear("sin observaciones devuelve el texto de relleno",
    M.unirObservaciones_([], "Cumple los 8 criterios.") === "Cumple los 8 criterios.");
  chequear("una sola observación no lleva salto",
    M.unirObservaciones_(["Columna C --> algo"], "x").indexOf("\n") === -1);
  chequear("dos observaciones van en dos renglones",
    M.unirObservaciones_(["a", "b"], "x").split("\n").length === 2);

  // El caso que señaló el revisor: FCB, fila 57 del Anexo 1, sin nada en C a I
  // y con dos códigos en la columna B.
  const colB = "PE.03.01.05_F10 PE.03.01.03 — REVISIÓN OCRI/OGAL Y EMISIÓN DE RR";
  const cls = M.clasificarFila_(colB, padreEntre(["PE.03.01", "PE.03.01.03", "PE.03.01.05"]), "F10", "F10");
  chequear("la fila sigue siendo un producto", cls.tipo === "producto");

  const checks = [
    M.validarCodigo_(cls),
    M.validarTipoProducto_(""),
    M.validarAccionEstrategica_(""),
    M.validarActividadOperativa_(""),
    M.validarListaCerrada_("", M.CONFIG_A1.TIPOS_ENTREGABLE, "Columna F", "Clasificación"),
    M.validarListaCerrada_("", M.CONFIG_A1.ROLES_INSTITUCIONALES, "Columna G", "Atributo institucional"),
    M.validarListaAbierta_("", M.CONFIG_A1.VARIABLES_CALIDAD, "Columna H", "Variables de calidad"),
    M.validarListaAbierta_("", M.CONFIG_A1.CRITERIOS_IMPACTO, "Columna I", "Criterios de validación")
  ];
  const obs = cls.observaciones.concat(
    checks.filter(function (c) { return !c.ok; }).map(function (c) { return c.obs; }));
  obs.push("Observación final --> Para las columnas C a I utilice los desplegables de la hoja.");

  const celda = M.unirObservaciones_(obs, "");
  const renglones = celda.split("\n");

  chequear("son nueve renglones", renglones.length === 9);
  chequear("el primero es la columna B", /^Columna B -->/.test(renglones[0]));
  chequear("el último es la observación final", /^Observación final -->/.test(renglones[8]));

  // De la C a la I, en el orden de la hoja.
  ["C", "D", "E", "F", "G", "H", "I"].forEach(function (col, i) {
    chequear("el renglón " + (i + 2) + " es la columna " + col,
      renglones[i + 1].indexOf("Columna " + col + " -->") === 0);
  });

  chequear("ningún renglón conserva el separador viejo", celda.indexOf("||") === -1);
});

bloque("Ajuste de texto en las hojas del dashboard", function () {
  const fuente = require("fs").readFileSync(FUENTE, "utf8");
  // Sin ajuste de texto el salto de línea no se ve, y el resumen lleva sus dos
  // columnas de DIAGNÓSTICO en medio de la tabla, no al final.
  chequear("el ajuste cubre todo el bloque de datos",
    /getRange\(2, 1, filas\.length, nCols\)\s*\.setWrap\(true\)/.test(fuente));
  chequear("las celdas se alinean arriba", /setVerticalAlignment\("top"\)/.test(fuente));
});


bloque("Conversor de observaciones antiguas", function () {
  const fuente = require("fs").readFileSync(FUENTE, "utf8");
  chequear("existe la función de conversión", /function convertirSeparadorAntiguo\(\)/.test(fuente));
  chequear("está en el menú", /Convertir observaciones antiguas a renglones/.test(fuente));
  chequear("solo toca las columnas generadas",
    /indexOf\("OBSERVACIONES"\) === 0 \|\| .*indexOf\("DIAGNOSTICO"\) === 0/.test(fuente));
  chequear("reaplica el ajuste de texto tras convertir",
    /setValues\(datos\);[\s\S]{0,220}setWrap\(true\)/.test(fuente));
});





bloque("Avance general del Anexo 1 (columna S)", function () {
  const P = M.TOTAL_CRITERIOS, Q = M.TOTAL_CRITERIOS_PROCESO;

  chequear("todo cumplido es 100 %",
    M.avanceCombinado_([{ cumplidos: [8, 8], porFila: P }, { cumplidos: [5], porFila: Q }]) === 100);
  chequear("nada cumplido es 0 %",
    M.avanceCombinado_([{ cumplidos: [0, 0], porFila: P }, { cumplidos: [0], porFila: Q }]) === 0);
  chequear("sin filas devuelve 0", M.avanceCombinado_([]) === 0);
  chequear("un bloque vacío no estorba al otro",
    M.avanceCombinado_([{ cumplidos: [], porFila: P }, { cumplidos: [5, 5], porFila: Q }]) === 100);

  // Pondera por criterios evaluados, no promedia los dos porcentajes.
  // 10 productos al 100 % (80 de 80) y 1 proceso al 0 % (0 de 5): 80/85 = 94 %.
  // El promedio simple daría 50 %.
  const prod = [8, 8, 8, 8, 8, 8, 8, 8, 8, 8];
  const proc = [0];
  const general = M.avanceCombinado_([{ cumplidos: prod, porFila: P }, { cumplidos: proc, porFila: Q }]);
  chequear("pondera por volumen: sale 94 %, no 50 %", general === 94);
  chequear("y no coincide con el promedio de los dos avances",
    general !== Math.round((M.avanceSobreCriterios_(prod, P) + M.avanceSobreCriterios_(proc, Q)) / 2));

  // Coherencia con las dos columnas que ya existen.
  const soloProd = M.avanceCombinado_([{ cumplidos: [4, 4], porFila: P }]);
  chequear("con un solo bloque coincide con avanceSobreCriterios_",
    soloProd === M.avanceSobreCriterios_([4, 4], P));

  const fuente = require("fs").readFileSync(FUENTE, "utf8");
  chequear("la columna se llama como pidió el revisor",
    /"AVANCE GENERAL DEL ANEXO 1"/.test(fuente));
  chequear("está en ENCABEZADOS_HISTORICOS",
    M.CONFIG_A1.ENCABEZADOS_HISTORICOS.indexOf("AVANCE GENERAL DEL ANEXO 1") !== -1);
  chequear("va al final, en la columna S",
    /"CÓDIGO DE LA HOJA",\s*\n\s*"AVANCE GENERAL DEL ANEXO 1"\]/.test(fuente));
});


bloque("Tres estados excluyentes en las hojas de detalle", function () {
  const fuente = require("fs").readFileSync(FUENTE, "utf8");

  chequear("un Nivel 0 ausente sale SIN REGISTRAR",
    M.filasNivel0_("FM", {}, {}).find(function (f) { return f[1] === "PE.01"; })[6] === "SIN REGISTRAR");
  chequear("ya no se usa el estado FALTANTE",
    fuente.replace(/^[\s\S]*?const CONFIG_A1/, "").indexOf('"FALTANTE"') === -1);

  chequear("el producto sin registrar tiene su propio estado",
    /sinRegistro \? "SIN REGISTRAR" : "OBSERVADO"/.test(fuente));
  chequear("los observados se cuentan por resta",
    /totalProd - prodConformes - prodSinRegistrar/.test(fuente));
  chequear("el Nivel 0 también se cuenta por resta",
    /n0Evaluables\.length - n0Conformes - n0SinRegistrar/.test(fuente));

  chequear("SIN REGISTRAR tiene color propio", /"SIN REGISTRAR": "#fce5cd"/.test(fuente));
  chequear("y su lugar en el orden de las hojas",
    /"SIN REGISTRAR": 2, "NO APLICA": 3/.test(fuente));

  // El orden de las hojas de detalle agrupa los tres estados.
  const filas = [
    ["FM", 5, "", "", "", "", "SIN REGISTRAR", "", "", ""],
    ["FM", 6, "", "", "", "", "OBSERVADO", "", "", ""],
    ["FM", 7, "", "", "", "", "CONFORME", "", "", ""]
  ];
  const ord = M.ordenarPorFacultadYEstado_(filas, 0, 6, 1, null);
  chequear("el orden es conforme, observado, sin registrar",
    ord[0][6] === "CONFORME" && ord[1][6] === "OBSERVADO" && ord[2][6] === "SIN REGISTRAR");
});

bloque("Resumen ejecutivo: las 21 columnas de la v13", function () {
  const fuente = require("fs").readFileSync(FUENTE, "utf8");
  const i = fuente.indexOf('volcarHoja_(ss, "RESUMEN_EJECUTIVO_A1"');
  const ini = fuente.indexOf("[", i);
  let nivel = 0, fin = ini;
  for (let j = ini; j < fuente.length; j++) {
    if (fuente[j] === "[") nivel++;
    else if (fuente[j] === "]") { nivel--; if (!nivel) { fin = j; break; } }
  }
  const cab = fuente.slice(ini, fin + 1);

  const esperadas = [
    "FACULTAD", "NOMBRE",
    "TOTAL PRODUCTOS", "PRODUCTOS CONFORMES", "PRODUCTOS OBSERVADOS", "PRODUCTOS SIN REGISTRAR",
    "TOTAL PROCESOS",
    "PROCESOS NIVEL 0 CONFORMES", "PROCESOS NIVEL 0 OBSERVADOS", "PROCESOS NIVEL 0 SIN REGISTRAR",
    "SUBPROCESOS CONFORMES", "SUBPROCESOS OBSERVADOS", "SUBPROCESOS SIN REGISTRAR",
    "CÓDIGO DE LA HOJA", "AVANCE GENERAL DEL ANEXO 1"
  ];
  esperadas.forEach(function (e) {
    chequear("declara " + e, cab.indexOf('"' + e + '"') !== -1);
  });
  chequear("ya no se llama PRODUCTOS SIN REGISTRO", cab.indexOf('"PRODUCTOS SIN REGISTRO"') === -1);

  const veces = function (t) { return (cab.match(new RegExp('"' + t + '"', "g")) || []).length; };
  chequear("AVANCE dos veces", veces("AVANCE") === 2);
  chequear("ESTADO GENERAL dos veces", veces("ESTADO GENERAL") === 2);
  chequear("DIAGNÓSTICO dos veces", veces("DIAGNÓSTICO") === 2);

  ["PRODUCTOS SIN REGISTRAR", "PROCESOS NIVEL 0 SIN REGISTRAR", "SUBPROCESOS SIN REGISTRAR"]
    .forEach(function (e) {
      chequear(e + " está en ENCABEZADOS_HISTORICOS",
        M.CONFIG_A1.ENCABEZADOS_HISTORICOS.indexOf(e) !== -1);
    });

});


bloque("La hoja dashboard queda retirada", function () {
  const fuente = require("fs").readFileSync(FUENTE, "utf8");
  const cuerpo = fuente.slice(fuente.indexOf("const CONFIG_A1"));

  chequear("no se declara el nombre de la hoja", cuerpo.indexOf('"dashboard"') === -1);
  chequear("no queda la función que la construía", cuerpo.indexOf("construirTablero_") === -1);
  chequear("ni el generador de enlaces internos", cuerpo.indexOf("enlaceA_") === -1);
  chequear("ni el índice de bloques que solo ella usaba", cuerpo.indexOf("indexarBloques_") === -1);
  chequear("ni se insertan gráficos", cuerpo.indexOf("insertChart") === -1);
  chequear("ni se crea ninguna hoja nueva al escribir",
    (cuerpo.match(/insertSheet\(/g) || []).length === 1);

  // El orden de las hojas de detalle se conserva: nació para el tablero, pero
  // agrupa los tres estados y sirve por sí solo.
  chequear("el orden por facultad y estado sigue aplicándose",
    /detalle = ordenarPorFacultadYEstado_/.test(fuente) &&
    /procesos = ordenarPorFacultadYEstado_/.test(fuente));

  const filas = [
    ["FM", 5, "", "", "", "", "SIN REGISTRAR", "", "", ""],
    ["FM", 6, "", "", "", "", "OBSERVADO", "", "", ""],
    ["FM", 7, "", "", "", "", "CONFORME", "", "", ""]
  ];
  const ord = M.ordenarPorFacultadYEstado_(filas, 0, 6, 1, null);
  chequear("y sigue agrupando conforme, observado, sin registrar",
    ord[0][6] === "CONFORME" && ord[2][6] === "SIN REGISTRAR");
});


bloque("Un proceso existe si la pestaña le registró contenido", function () {
  const porCodigo = function (filas, c) {
    return filas.find(function (f) { return f[1] === c; });
  };

  // Sin encabezado y sin descendientes: ausencia real.
  const vacia = M.filasNivel0_("FM", {}, {});
  chequear("PE.03 ausente del todo es NO APLICA", porCodigo(vacia, "PE.03")[6] === "NO APLICA");
  chequear("PS.08 ausente del todo es NO APLICA", porCodigo(vacia, "PS.08")[6] === "NO APLICA");
  chequear("un obligatorio ausente es SIN REGISTRAR", porCodigo(vacia, "PE.01")[6] === "SIN REGISTRAR");

  // Sin encabezado pero con descendientes: el proceso se ejecuta.
  const conHijos = M.filasNivel0_("FFB", {}, { "PS.08": 32, "PS.06": 3 });
  const ps08 = porCodigo(conHijos, "PS.08");
  chequear("PS.08 con 32 códigos hijos deja de ser NO APLICA", ps08[6] !== "NO APLICA");
  chequear("y pasa a contarse como OBSERVADO", ps08[6] === "OBSERVADO");
  chequear("puntúa 4 de 5", ps08[8] === "4/" + M.TOTAL_CRITERIOS_PROCESO);
  chequear("la observación dice que falta el encabezado",
    /FALTA LA FILA DE ENCABEZADO/.test(ps08[9]));
  chequear("y cuántos códigos dependen de él", /32 códigos que dependen de PS\.08/.test(ps08[9]));

  const ps06 = porCodigo(conHijos, "PS.06");
  chequear("un obligatorio con hijos tampoco es SIN REGISTRAR", ps06[6] === "OBSERVADO");

  // Con encabezado: se evalúa como cualquier proceso.
  const cls = M.clasificarFila_("PS.08_F04 GESTIÓN DE ACTIVIDADES PRODUCTIVAS",
    function () { return false; }, "F04", "F04");
  const conEnc = M.filasNivel0_("FFB", { "PS.08": { fila: 120, cls: cls } }, { "PS.08": 32 });
  chequear("con encabezado se evalúa normalmente", porCodigo(conEnc, "PS.08")[6] === "CONFORME");
  chequear("y registra su fila del Anexo", porCodigo(conEnc, "PS.08")[5] === 120);

  chequear("el NO APLICA explica que no hay ni encabezado ni códigos",
    /ni ningún código que dependa de él/.test(porCodigo(vacia, "PE.03")[9]));
});

bloque("Fila de totales del resumen", function () {
  const met = [
    { totalProd: 10, prodConformes: 10, prodObservados: 0, prodSinRegistrar: 0,
      totalProc: 2, n0Conformes: 2, n0Observados: 0, n0SinRegistrar: 0,
      subConformes: 0, subObservados: 0, subSinRegistrar: 0,
      cumplidosProd: [8,8,8,8,8,8,8,8,8,8], cumplidosProc: [5,5], avanceGeneral: 90 },
    { totalProd: 2, prodConformes: 0, prodObservados: 1, prodSinRegistrar: 1,
      totalProc: 1, n0Conformes: 0, n0Observados: 1, n0SinRegistrar: 0,
      subConformes: 0, subObservados: 0, subSinRegistrar: 0,
      cumplidosProd: [4, 0], cumplidosProc: [0], avanceGeneral: 30 }
  ];
  const t = M.filaDeTotales_(met);

  chequear("la fila tiene 21 celdas", t.length === 21);
  chequear("se identifica como TOTAL", t[0] === "TOTAL");
  chequear("dice cuántas facultades resume", t[1] === "Las 2 facultades");

  chequear("suma los productos", t[2] === 12 && t[3] === 10 && t[4] === 1 && t[5] === 1);
  chequear("suma los procesos", t[9] === 3 && t[10] === 2 && t[11] === 1);

  // 84 de 96 criterios de producto = 88 %; 10 de 15 de proceso = 67 %.
  // Estos dos SIGUEN ponderados por criterio: no son la columna que cambia en v17.
  chequear("el avance de productos es ponderado", t[6] === "88%");
  chequear("el avance de procesos es ponderado", t[16] === "67%");

  // [C42] El avance general YA NO pondera por criterio: es el promedio simple
  // de los avanceGeneral que trae cada facultad (90 y 30 en este caso).
  chequear("el avance general es el promedio simple de las facultades",
    t[20] === "60%");

  // Si en cambio se pusiera a ponderar por los criterios de producto+proceso,
  // como hacía la v16, saldría 85 %: es justo el sesgo que la v17 corrige.
  const viejoEstilo = M.avanceCombinado_([
    { cumplidos: met[0].cumplidosProd.concat(met[1].cumplidosProd), porFila: M.TOTAL_CRITERIOS },
    { cumplidos: met[0].cumplidosProc.concat(met[1].cumplidosProc), porFila: M.TOTAL_CRITERIOS_PROCESO }
  ]);
  chequear("y no coincide con ponderar por criterios como en la v16",
    parseInt(t[20], 10) !== viejoEstilo);

  chequear("el diagnóstico de productos advierte que es ponderado",
    /ponderado por criterios evaluados, no promedio/i.test(t[8]));
  chequear("la columna de código de hoja queda vacía", t[19] === "—");
});

bloque("Avance general por proceso, no por criterio", function () {
  // [C42] Un proceso SIN REGISTRAR vale 0 en el promedio, sin importar cuántos
  // productos habría agrupado; uno con productos casi perfectos vale casi 100.
  const n0 = [
    ["FX", "PE.01", "GESTIÓN ESTRATÉGICA", "Nivel 0", "Obligatorio", 5, "CONFORME", "100%", "5/5", "—"],
    ["FX", "PS.01", "ADMISIÓN", "Nivel 0", "Obligatorio", "—", "SIN REGISTRAR", "0%", "0/5", "—"]
  ];
  const productos = [
    { correctos: 8, procCodigo: "PE.01" },
    { correctos: 7, procCodigo: "PE.01" }
  ];
  const r = M.avancePorProceso_(n0, [], productos);
  chequear("dos procesos evaluables: uno lleno y uno ausente", r.buckets.length === 2);
  // PE.01: (5 + 8 + 7) / (5 + 8 + 8) = 20/21 = 95 %. PS.01: 0/5 = 0 %.
  chequear("el proceso con productos casi perfectos pesa igual que el vacío",
    Math.round((95 + 0) / 2) === r.avance);

  chequear("nueve de quince procesos ausentes hunden el promedio, no solo un poco",
    (function () {
      const quince = [];
      for (let i = 1; i <= 6; i++) {
        quince.push(["FX", "P" + i, "x", "Nivel 0", "Obligatorio", 1, "CONFORME", "100%", "5/5", "—"]);
      }
      for (let i = 7; i <= 15; i++) {
        quince.push(["FX", "P" + i, "x", "Nivel 0", "Obligatorio", "—", "SIN REGISTRAR", "0%", "0/5", "—"]);
      }
      // Muchos productos, todos perfectos, colgando de los 6 procesos llenos.
      const prods = [];
      for (let i = 1; i <= 6; i++) {
        for (let j = 0; j < 10; j++) prods.push({ correctos: 8, procCodigo: "P" + i });
      }
      const res = M.avancePorProceso_(quince, [], prods);
      // 6 procesos al 100 %, 9 en 0 %: promedio = 40 %, muy lejos del ~86 % que
      // daría ponderar por los 60 productos casi perfectos.
      return res.avance <= 45;
    })());
});

/* ────────────────────────────────────────────────────────────────────────── */

bloque("[C43] Avance general para el historial de revisiones", function () {
  // Mismo criterio que la fila TOTAL desde la v17: promedio simple del
  // avanceGeneral por proceso de cada facultad, NO ponderado por criterios.
  const metricas = [
    { cumplidosProd: [8, 8, 4], cumplidosProc: [5, 5], avanceGeneral: 90 },
    { cumplidosProd: [8, 0],    cumplidosProc: [5],    avanceGeneral: 30 }
  ];
  chequear("se calcula como el promedio simple de avanceGeneral",
    M.avanceGeneralAnexo1_(metricas) === 60);
  chequear("coincide con lo que muestra la fila TOTAL para las mismas facultades",
    M.filaDeTotales_(metricas)[20] === "60%");
  chequear("devuelve 0 a 100, no una fracción", M.avanceGeneralAnexo1_(metricas) > 1);
  chequear("sin métricas no divide por cero", M.avanceGeneralAnexo1_([]) === 0);
  chequear("sin argumento tampoco revienta", M.avanceGeneralAnexo1_() === 0);
  chequear("una facultad sin avanceGeneral cuenta como 0, no se descarta",
    M.avanceGeneralAnexo1_([{ avanceGeneral: 100 }, {}]) === 50);
  chequear("el nombre anterior sigue funcionando",
    M.calcularPorcentajeGeneralAnexo1_(metricas) === 60);
});

bloque("[C45] Código de producto PADRE_F##-P##", function () {
  const c = M.extraerCodigos_("PE.01.01_F18-P03 PLAN OPERATIVO");
  chequear("extrae un solo código", c.length === 1);
  chequear("su base es la del padre", c[0].base === "PE.01.01");
  chequear("y el número de producto es 3", c[0].producto === 3);
  chequear("el código completo incluye -P03", c[0].completo === "PE.01.01_F18-P03");
  chequear("la denominación queda limpia",
    M.denominacionDe_("PE.01.01_F18-P03 PLAN OPERATIVO", c) === "PLAN OPERATIVO");
  chequear("el formato viejo no trae número de producto",
    M.extraerCodigos_("PE.01.01.03_F18 PLAN")[0].producto === null);
  chequear("el sufijo de formulario se lee antes del -P", M.sufijoDe_("PE.01.01_F18-P03") === "F18");
  chequear("acepta -P con espacios", M.extraerCodigos_("PE.01.01_F18 - P07 X")[0].producto === 7);

  const nadieEsPadre = function () { return false; };
  const prod = M.clasificarFila_("PE.01.01_F18-P01 PLAN ESTRATÉGICO", nadieEsPadre, "F18");
  chequear("-P## es producto", prod.tipo === "producto");
  chequear("con su base y número", prod.base === "PE.01.01" && prod.numeroProducto === 1);
  chequear("aunque se llame PROCESO… sigue siendo producto",
    M.clasificarFila_("PE.03.03_F18-P05 PROCESO DE CONVALIDACIÓN", nadieEsPadre, "F18").tipo === "producto");
  chequear("un producto colgando del nivel 0 no se confunde con el nivel 0",
    M.clasificarFila_("PS.10_F18-P01 GESTIÓN DE LA COMUNICACIÓN", nadieEsPadre, "F18").tipo === "producto");
  chequear("el sufijo del producto -P se valida como cualquier otro",
    !M.clasificarFila_("PE.01.01_F02-P01 PLAN", nadieEsPadre, "F18").checks.sufijo);

  chequear("con EXIGIR_FORMATO_P en false se aceptan ambos formatos",
    M.CONFIG_A1.EXIGIR_FORMATO_P === false &&
    M.validarCodigo_(M.clasificarFila_("PE.01.01.01_F18 PLAN", nadieEsPadre, "F18")).ok &&
    M.validarCodigo_(prod).ok);
  M.CONFIG_A1.EXIGIR_FORMATO_P = true;
  const viejo = M.validarCodigo_(M.clasificarFila_("PE.01.01.01_F18 PLAN", nadieEsPadre, "F18"));
  chequear("con EXIGIR_FORMATO_P en true el formato viejo se observa",
    !viejo.ok && /-P y su número/.test(viejo.obs));
  chequear("y el nuevo sigue siendo válido", M.validarCodigo_(prod).ok);
  M.CONFIG_A1.EXIGIR_FORMATO_P = false;
});

bloque("[C45] Hoja completa con productos -P##", function () {
  const prod = ["Final / Salida (Documento)", "AE.01.01 Planeamiento", "Gestión del planeamiento",
                "Regulación", "Calidad", "Claridad", "solucionar un problema público"];
  const filas = [
    ["PE.01_F18 GESTIÓN ESTRATÉGICA"],
    ["PE.01.01_F18 GESTIÓN DEL PLANEAMIENTO"],
    ["PE.01.01_F18-P01 PLAN ESTRATÉGICO"].concat(prod),
    ["PE.01.01_F18-P02 PLAN OPERATIVO"].concat(prod),
    ["PE.01.01_F18-P02 PLAN OPERATIVO REPETIDO"].concat(prod),
    ["PE.01.09_F18-P01 PRODUCTO SIN PADRE"].concat(prod)
  ].map(function (f) { while (f.length < 8) f.push(""); return f; });
  const hoja = { getLastRow: function () { return 4 + filas.length; },
                 getRange: function () { return { getValues: function () { return filas; } }; } };
  const fac = M.CONFIG_A1.FACULTADES.filter(function (f) { return f.sigla === "FPSIC"; })[0];
  const r = M.procesarFacultad_(hoja, fac);
  const obsDe = function (fila) {
    return String(r.detalleFilas.filter(function (d) { return d[1] === fila; })[0].slice(-1)[0]);
  };
  chequear("cuenta 4 productos", r.detalleFilas.length === 4);
  chequear("el subproceso con productos -P sigue siendo subproceso",
    r.procesoFilas.some(function (p) { return /^PE\.01\.01_F18/.test(p[1]) && p[3] === "Subproceso"; }));
  chequear("P01 sin observaciones de código", !/Columna B/.test(obsDe(7)));
  chequear("el -P02 repetido se observa en sus dos filas",
    /REPETIDO/.test(obsDe(8)) && /REPETIDO/.test(obsDe(9)));
  chequear("el producto cuyo padre no existe se observa", /PE\.01\.09 no está registrado/.test(obsDe(10)));
});

/* ────────────────────────────────────────────────────────────────────────── */

console.log("\n" + (fallas === 0
  ? "TODAS LAS PRUEBAS PASAN (" + total + ")"
  : fallas + " FALLAS de " + total));

process.exit(fallas === 0 ? 0 : 1);
