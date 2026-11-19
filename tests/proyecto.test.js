/**
 * Comprueba que los archivos que conviven en el proyecto de Apps Script no
 * declaren dos veces el mismo nombre.
 *
 * En Apps Script todos los archivos comparten un único ámbito global:
 *
 *   · dos `const` con el mismo nombre son un SyntaxError que impide ejecutar
 *     CUALQUIER función del proyecto;
 *   · dos `function` con el mismo nombre no avisan de nada: gana la del archivo
 *     que se carga después, y la otra deja de existir en silencio.
 *
 * Las dos cosas ya ocurrieron —`CONFIG_HISTORIAL` y las tres
 * `calcularPorcentajeGeneral*_`—, así que aquí quedan vigiladas.
 *
 *   node tests/proyecto.test.js
 */

const fs = require("fs");
const path = require("path");

const DIRECTORIO = path.join(__dirname, "..", "apps-script");

/** Archivos que el proyecto de Apps Script tiene pegados a la vez. */
const DEL_PROYECTO = [
  "Anexo1_Auditoria_v19.gs",
  "Anexo3_Revision_v4.gs",
  "Anexo4_Revision_v2.gs",
  "ExportarJSON.gs",
  "HistorialRevisiones.gs",
  "ResumenGeneral.gs"
];

/**
 * `onOpen` está declarada a propósito en los dos auditores, y ambas construyen
 * el mismo menú para que dé igual cuál gane.
 */
const DUPLICADOS_ACEPTADOS = ["onOpen"];

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

/** Nombres declarados en el ámbito global de un archivo. */
function declaracionesDe(archivo) {
  const texto = fs.readFileSync(path.join(DIRECTORIO, archivo), "utf8");
  const nombres = { constantes: [], funciones: [] };
  const patron = /^(?:(const|let|var)\s+([A-Za-z_$][\w$]*)|function\s+([A-Za-z_$][\w$]*))/gm;
  let m;
  while ((m = patron.exec(texto)) !== null) {
    if (m[2]) nombres.constantes.push(m[2]);
    else nombres.funciones.push(m[3]);
  }
  return nombres;
}

const presentes = DEL_PROYECTO.filter(function (f) {
  return fs.existsSync(path.join(DIRECTORIO, f));
});

const porNombre = {};
presentes.forEach(function (archivo) {
  const d = declaracionesDe(archivo);
  d.constantes.concat(d.funciones).forEach(function (nombre) {
    if (!porNombre[nombre]) porNombre[nombre] = { constante: false, archivos: [] };
    if (d.constantes.indexOf(nombre) !== -1) porNombre[nombre].constante = true;
    if (porNombre[nombre].archivos.indexOf(archivo) === -1) porNombre[nombre].archivos.push(archivo);
  });
});

/* ────────────────────────────────────────────────────────────────────────── */

bloque("Los archivos del proyecto existen", function () {
  DEL_PROYECTO.forEach(function (f) {
    chequear("existe " + f, presentes.indexOf(f) !== -1);
  });
});

bloque("Ningún nombre se declara en dos archivos", function () {
  Object.keys(porNombre).sort().forEach(function (nombre) {
    const info = porNombre[nombre];
    if (info.archivos.length < 2) return;
    if (DUPLICADOS_ACEPTADOS.indexOf(nombre) !== -1) return;
    chequear("« " + nombre + " » está declarado en " + info.archivos.join(" y "), false);
  });
  chequear("revisión completa de " + Object.keys(porNombre).length + " nombres", true);
});

bloque("Los choques que ya rompieron el proyecto siguen resueltos", function () {
  chequear("CONFIG_HISTORIAL no vuelve a estar en dos archivos",
    !porNombre["CONFIG_HISTORIAL"] || porNombre["CONFIG_HISTORIAL"].archivos.length < 2);
  ["calcularPorcentajeGeneralAnexo1_",
   "calcularPorcentajeGeneralAnexo3_",
   "calcularPorcentajeGeneralAnexo4_"].forEach(function (fn) {
    chequear(fn + " se declara una sola vez",
      !porNombre[fn] || porNombre[fn].archivos.length === 1);
  });
  chequear("registrarRevision solo vive en HistorialRevisiones.gs",
    !porNombre["registrarRevision"] ||
    porNombre["registrarRevision"].archivos.join() === "HistorialRevisiones.gs");
});

bloque("La excepción de onOpen es deliberada", function () {
  const onOpen = porNombre["onOpen"];
  chequear("está en los dos auditores", onOpen && onOpen.archivos.length === 2);
  // Ambos menús deben ofrecer los mismos ítems, para que dé igual cuál gane.
  const items = onOpen.archivos.map(function (archivo) {
    const texto = fs.readFileSync(path.join(DIRECTORIO, archivo), "utf8");
    const cuerpo = texto.slice(texto.indexOf("function onOpen() {"));
    return (cuerpo.slice(0, cuerpo.indexOf("\n}\n")).match(/addItem\("([^"]+)"/g) || []).join("|");
  });
  chequear("y los dos construyen el mismo menú", items[0] === items[1]);
});

bloque("Nadie llama a registrarRevision sin protegerse", function () {
  // Vive en HistorialRevisiones.gs. Si ese archivo falta, una llamada directa
  // corta la revisión con un ReferenceError cuando el trabajo ya está hecho.
  presentes.forEach(function (archivo) {
    if (archivo === "HistorialRevisiones.gs") return;
    const texto = fs.readFileSync(path.join(DIRECTORIO, archivo), "utf8");
    if (texto.indexOf("registrarRevision(") === -1) return;

    const protegida = /typeof\s+registrarRevision\s*===\s*["']function["']/.test(texto);
    chequear(archivo + " comprueba que la función exista antes de llamarla", protegida);
    const enTryCatch = /try\s*\{[^}]*registrarRevision\(/.test(texto.replace(/\n/g, " "));
    chequear(archivo + " la llama dentro de try/catch", enTryCatch);
  });
});

bloque("Los seis archivos compilan juntos", function () {
  // Apps Script concatena todos los archivos en un único ámbito. Esta es la
  // misma prueba que hace el editor al guardar: si un nombre está repetido o
  // falta una llave, aquí revienta igual que allá -y allá el síntoma es que el
  // desplegable de funciones se queda vacío-.
  let junto = "";
  presentes.forEach(function (archivo) {
    junto += "\n" + fs.readFileSync(path.join(DIRECTORIO, archivo), "utf8");
  });
  let error = null;
  try { new Function(junto); } catch (e) { error = e.message; }
  chequear("compilan sin errores" + (error ? " — " + error : ""), error === null);

  chequear("y son los cinco del proyecto", presentes.length === DEL_PROYECTO.length);
});

/* ────────────────────────────────────────────────────────────────────────── */

console.log("\n" + total + " comprobaciones, " + fallas + " fallas.");
process.exit(fallas ? 1 : 0);
