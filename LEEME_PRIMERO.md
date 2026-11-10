# Gildem Craft Pro v9.0 | Corrección del motor por movimiento

**Objetivo:** corregir la integración de `app.js` que bloquea Netlify y descartar por completo las rutas de una única fabricación. Se mantiene la versión 9.0.0 y las tablas v9 existentes, sin dependencias nuevas ni un motor paralelo.

## Contenido

- `core/always-plan.js`: motor por movimiento. **Mínimo 2 fabricaciones por ruta** y **50 unidades de actividad observada por semana**. Si el capital, la actividad, las pérdidas o el inventario pendiente permiten solo 1, no se muestra la ruta y tampoco aparecen sus materiales en compras. No se fuerza una cantidad artificial ni se afirma que AODP certifique ventas.
- `tests/v8_7_0-always-plan.test.mjs`, `tests/v8_7_1-demand-first.test.mjs`: pruebas antiguas actualizadas para eliminar expectativas obsoletas de lotes de 1.
- `tests/v9_0_1-min-batch.test.mjs`: siete pruebas nuevas de lotes, material, presupuesto, movimiento y riesgo.
- `REPARAR_APP_V9.mjs` y `actualizar/app-v9-operations.json`: **herramienta temporal local**, necesaria para generar el `app.js` COMPLETO conservando los más de 270 KB de código existente. No publica nada ni instala dependencias.

## Instrucciones en Windows / GitHub Desktop

**IMPORTANTE: no intentes hacer merge de dos versiones manualmente.** Si GitHub Desktop dice "Resolve conflicts before Merge", cancela ese merge, resuelve tu copia local y haz Pull origin antes de proceder. No borres los módulos `core/` que ya existen.

1. Abre `gildem-craft-pro-live` en GitHub Desktop y selecciona **Repository > Show in Explorer**.
2. Descomprime este ZIP y copia **su contenido** a la raíz del repositorio. Conserva el resto de los archivos. Asegúrate de reemplazar `core/always-plan.js` y los dos tests antiguos.
3. En GitHub Desktop, selecciona **Repository > Open in Command Prompt** (o abre una terminal dentro de esa carpeta).
4. Ejecuta:

   ```cmd
   node REPARAR_APP_V9.mjs
   ```

   Puedes usar Node.js 26 para ESTE comando. El corrector verifica que `app.js` tenga exactamente la versión original verificada en GitHub (SHA `aaf3020400715be1ce82572064f869d40cd166a8`), crea un respaldo fuera del repositorio, integra el motor, valida su sintaxis, ejecuta 25 pruebas dirigidas y comprueba el preflight. Si una prueba falla, restaura `app.js` y **NO debes publicar**.
5. Para validar toda la aplicación, usa Node.js 22 (mínimo 22.12) y ejecuta `npm run build`. **Solo haz commit y push si pasa**. Netlify ejecuta el mismo comando en Node.js 22.
6. Antes del commit, puedes borrar `REPARAR_APP_V9.mjs` y la carpeta `actualizar/`: son herramientas temporales, no hacen falta en producción. El commit debe incluir **el `app.js` generado**, `core/always-plan.js` y los tres archivos de pruebas.
7. Haz **Commit** y **Push origin** en GitHub Desktop. Comprueba el build en Netlify.

## Qué se corrige y qué se conserva

El error `Motor por movimiento no instalado en app.js` se resuelve **instalando el uso real** de `prepareAlwaysPlan` para Black Craft y Royal Craft, sin quitar el preflight ni silenciar tests. Las pantallas vuelven a usar ese plan, pueden guardarlo como borrador y no descuentan silver al guardar. Se mantiene la confirmación explícita de compras.

El filtro **no es únicamente visual**: el motor elimina rutas con menos de dos fabricaciones antes de calcular la lista de compras. Una ruta con datos incompletos tampoco recibe automáticamente un "lote de prueba".

El orden por tier y las tablas compactas existentes de v9.0 no cambian. El archivo `app.js` se actualiza conservando todas las demás funcionalidades.

## Verificación y limitaciones

- El motor superó **25 de 25 pruebas dirigidas** en un entorno de prueba con datos de ejemplo.
- El corrector se probó de principio a fin en un proyecto simulado: verificación de cambios, `node --check`, pruebas dirigidas y preflight, además de la protección contra versiones incompatibles.
- **Todavía no se ha ejecutado `npm run build` en el repositorio real completo**, porque no se pudo obtener su copia local de ~170 archivos desde este entorno. No afirmamos que Netlify ya esté funcionando. El paso 5 es obligatorio antes de publicar.

Si el corrector muestra que el SHA de `app.js` es distinto, **no ignores el error** ni añadas el marcador a mano: tu copia cambió o tienes un conflicto pendiente. Conserva los cambios locales y usa el diagnóstico para reconciliar el repositorio.
