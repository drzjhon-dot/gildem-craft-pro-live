# Gildem Craft Pro | Revisión por movimiento + integración `ao-bin-dumps`

**Fecha:** 10 de noviembre de 2026  
**Repositorio objetivo:** `drzjhon-dot/gildem-craft-pro-live` (rama `main`, distribución 8.7.0)

## Causa exacta del fallo de Netlify

La prueba `tests/v8_7_1-demand-first.test.mjs` se subió al repositorio y exige `GCP_DEMAND_FIRST_871`. Sin embargo, el `app.js` publicado todavía era el original; la prueba de integración n.º 306 falló. No era un problema de Node, Netlify ni `npm install`.

**No es correcto arreglarlo agregando solo un comentario con el marcador.** La pantalla, el flujo de guardado y la generación por demanda también deben implementarse. Este paquete incorpora todo junto.

## Instalación segura con GitHub Desktop (Windows)

1. En GitHub Desktop, selecciona `drzjhon-dot/gildem-craft-pro-live` y pulsa **Repository > Show in Explorer**. Copia la ruta de la carpeta que contiene `app.js`, `core/` y `tests/`.
2. Descomprime **este ZIP fuera del repositorio**, por ejemplo en Descargas. No copies solo los archivos `tests/` a GitHub: volvería a ocurrir el fallo 306.
3. Instala **Python 3** y **Node.js 22**, si todavía no los tienes en tu PC.
4. Haz doble clic en `ACTUALIZAR_Y_VERIFICAR_WINDOWS.bat` y pega la ruta de GitHub Desktop. Alternativa desde una terminal: `py -3 INSTALAR_REVISION.py "C:\ruta\gildem-craft-pro-live"`.
5. El instalador verifica **sintaxis, preflight, TODOS los tests existentes y `npm run build`** en el repositorio local. Si algo falla, **restaura los archivos anteriores y devuelve código de error**. No hace `git push` ni instala un despliegue defectuoso.
6. **Solo cuando aparezca `REVISIÓN OK`**, abre GitHub Desktop y comprueba que estén incluidos `app.js`, `core/always-plan.js`, `core/ao-gear-recipes.js`, `scripts/build.mjs`, `scripts/check-deploy.mjs` y los tests. Haz un único **Commit to main** y **Push origin**.
7. Netlify debe compilar de nuevo. Confirma que los tests y el build terminen en verde. Abre la web y recarga `Ctrl+Shift+R`. Para probarlo, genera un plan de arcos T4–T6; la página debe indicar **PLAN POR ROTACIÓN · SIN FILTRO DE PROFIT MÍNIMO**.

## Motor de fabricación por movimiento

- Elimina el veto global por precio de equilibrio o ROI mínimo **del nuevo plan visible** en Black Craft y Royal Craft. El beneficio/pérdida calculado sigue visible, con signo.
- Elige recetas según **actividad observada en el mercado específico**, no por la mejor ganancia teórica. No presenta observaciones de AODP como ventas ya cobradas.
- Limita cantidades con una participación orientativa del **6 % del volumen observado** en un horizonte de venta configurable, límite de concentración y presupuesto. Descuenta unidades pendientes ya registradas en **Mi negocio**.
- Si un objeto es caro o los materiales faltan, no desplaza automáticamente a otros asequibles. Las pérdidas esperadas tienen límite de exposición muy reducido.
- Muestra fabricación por ciudad, destino, cantidad, materiales brutos, rotación semanal, antigüedad de cotización y resultado neto orientativo.
- Permite guardar como **plan pendiente** rutas que tengan precios y costes observados, incluso con profit negativo. **Guardar nunca descuenta silver**. Confirmar compra efectivamente realizada es una acción distinta y requiere confirmación adicional.
- **NO se recomienda comprar sin revisar datos dentro del juego.** Los libros de órdenes y la materia prima pueden agotarse y el precio por unidad aumentar. El plan visible no reserva materiales ni garantiza venta.

## Integración `ao-data/ao-bin-dumps`

Fuente: https://github.com/ao-data/ao-bin-dumps

- `core/ao-gear-recipes.js` contiene un extractor probado para `items.json` RAW del juego. NO utiliza `formatted/items.json`: ese es un índice de objetos, no un archivo completo de recetas.
- Cuando Netlify publica, `scripts/build.mjs` intenta descargar el RAW, extraer recetas T1–T8 de equipo tradicional y reconocer variantes encantadas, cantidades de materiales, artefactos sin devolución y cantidades producidas. **Si no puede leer/validar el RAW, conserva el catálogo previo**; el build no se cae por una caída de GitHub/CDN.
- No inventa ciudad con bono cuando el mapeo de la familia no está identificado. Los mapas de ciudad deben revisarse cuando un parche cambie bonos.
- Las recetas especiales de monturas, recolección, kits, asedio, comidas y pociones **ya usaban** `ao-bin-dumps` mediante `core/special-recipes.js` y `netlify/functions/recipes.mjs`; esta actualización amplía la integración a armas/armaduras/equipamiento tradicional.
- Publica `/catalog/ao-bin-source.json` con fuente elegida, fecha de construcción y cantidades de recetas extraídas. El juego/mercado puede cambiar después de construir: no representa datos en vivo.
- AODP **West (América)** sigue siendo la fuente de cotizaciones y actividad, con sus límites y fechas. `ao-bin-dumps` no es un API de demanda o órdenes actuales.

## Qué se comprobó realmente

- Se reprodujo la discrepancia viendo que el test 8.7.1 existía en `main`, mientras `app.js` aún no tenía `GCP_DEMAND_FIRST_871`.
- **16 pruebas dirigidas** sobre el motor por demanda y extractor de juego pasaron en un banco de pruebas local (incluyendo inventario pendiente). Se ejecutó el instalador completo de principio a fin contra un repositorio sintético que imita la estructura previa; pasó su verificación de sintaxis, test y build.
- **Limitación importante:** el repositorio completo real no pudo clonarse dentro de esta sesión, y la conexión a GitHub permite leer, pero rechazó crear una rama (403). Por eso **no afirmamos** haber ejecutado ya el paquete completo de 306 pruebas dentro del código real ni haber publicado la web. El instalador lo ejecutará en tu copia local y **cancelará todos los cambios** si falla.
- Antes de subir, el usuario debe ver `REVISIÓN OK`. No hagas commit/push si muestra error.

## Archivos que modifica el instalador

- `app.js`
- `core/always-plan.js`
- `core/ao-gear-recipes.js` (nuevo)
- `scripts/build.mjs`
- `scripts/check-deploy.mjs`
- `tests/v8_7_1-demand-first.test.mjs` (actualiza o conserva, siempre junto a la implementación)
- `tests/v8_7_2-ao-bin-dumps.test.mjs` (nuevo)

**No cambia:** archivos de datos personales, localStorage, credenciales, precios manuales ni inventarios. Crea una copia de seguridad fuera del repositorio, incluyendo el log del test y build.

**Versión visible:** sigue `8.7.0` por compatibilidad con pruebas estrictas y la caché actual; los marcadores internos identifican las dos ampliaciones. Si deseas un salto de versión visible, hay que coordinar `package.json`, `index.html`, `sw.js`, `scripts/build.mjs`, `netlify/functions/health.mjs`, tests y preflight en una actualización distinta.
