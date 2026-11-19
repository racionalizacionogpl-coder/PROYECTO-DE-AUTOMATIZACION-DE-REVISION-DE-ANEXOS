# Mapa de scripts: qué archivo va en qué libro

Cada libro de Google Sheets tiene su **propio** proyecto de Apps Script
(Extensiones › Apps Script desde ese libro). Los archivos de un proyecto
comparten un único ámbito global: dos archivos del mismo proyecto no pueden
declarar el mismo nombre, y dos `onOpen` se pisan.

## 1. `4_REVISIÓN_INTERNA DE_AVANCES_ACTIVIDADES` — libro de revisión

ID `1oYBAHp-Bd0V8un5hUAWdK1jKbcbdsROH4IOyM0MAmFk`. Solo **lee** los anexos y
escribe los reportes. Menú **Auditoría OGPL**.

| Archivo | Qué hace |
|---|---|
| `Anexo1_Auditoria_v19.gs` | Audita el Anexo 1 → `RESUMEN_EJECUTIVO_A1`, `DETALLADO_PRODUCTOS_A1`, `OBSERVACIONES_DE_PROCESO_A1` |
| `Anexo3_Revision_v4.gs` | Revisa las fichas del Anexo 3 → hojas `*_A3` |
| `Anexo4_Revision_v2.gs` | Revisa el Anexo 4 → `RESUMEN_EJECUTIVO_A4` |
| `HistorialRevisiones.gs` | `HISTORIAL_REVISIONES` (lo llaman los tres auditores) |
| `ResumenGeneral.gs` | `RESUMEN_GENERAL` (A1 + A3, 50/50) |
| `ExportarJSON.gs` | Exporta el tablero a JSON |

`tests/proyecto.test.js` comprueba que estos seis compilan juntos.

## 2. `ANEXO 1 - (A1) - Inventario de productos y procesos` — libro de las facultades

ID `1SUMuS32zUweN_o7WfdBhXq-ipvvaFXYTcxKF1hmhPww`. **Modifica** la pestaña
activa. Menú **⚙️ Automatización Anexo 1**.

| Archivo | Qué hace |
|---|---|
| `AutoAnexo1_v2.gs` | Genera los códigos de producto `PADRE_F##-P##` y anota las equivalencias en `EQUIVALENCIAS_CODIGOS`; pasa la columna B a mayúsculas |

## 3. `ANEXO 3 - (A3) - Ficha técnica de producto y proceso` — libro de las facultades

ID `1BYqg7p-8DoEJQGf_APxCZkieu6nrM1aPGPdXdblHyUI`. **Modifica** la pestaña
activa. Menú **⚙️ Herramientas Anexo 3**.

| Archivo | Qué hace |
|---|---|
| `Anexo3_Automatizacion_v1.gs` | Importa subprocesos (F–G), productos finales (H–I) y parciales (Registros) desde el Anexo 1; codifica PR, EN y BE al escribir (`onEdit`); da formato a la ficha |

**Archivo a retirar de este proyecto:** la copia de la *revisión* del Anexo 3
que está pegada aquí ("Revisión A3") es la v2 del 28 de agosto (commit
`e7ad35a`), que crea un Sheets nuevo en una carpeta de Drive en cada corrida.
La revisión vigente es `Anexo3_Revision_v4.gs` y corre desde
`4_REVISIÓN_INTERNA`. Mantener las dos produce reportes en dos lugares, y la
copia vieja no conoce el formato `-P##` ni la lista de facultades de nivel 2.

## 4. Anexo 4

ID `1jQFfBlMa92sxoF-XhJv24kz16HMiUFs392TI01HBZ1w`. Hoy no tiene scripts en el
repo; su revisión corre desde `4_REVISIÓN_INTERNA`.
