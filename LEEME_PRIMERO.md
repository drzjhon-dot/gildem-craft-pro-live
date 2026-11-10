# Gildem Craft Pro: motor por actividad observada

**Actualización de comportamiento para la base v8.7.0.** No modifica los datos guardados del navegador, ni publica automáticamente en Netlify.

## Qué cambia

El viejo mensaje **«No hay beneficio neto verificable actualmente»** desaparece de los resultados. Ahora **Black Craft y Royal Craft muestran el plan de demanda** aun cuando ninguna ruta supera el antiguo margen mínimo. El motor clasifica artículos por actividad histórica observada en el mercado correspondiente y selecciona cantidades pequeñas, compatibles con presupuesto, exposición y movimiento del mercado.

- **Primero, actividad:** más volumen de órdenes observadas y más continuidad. Un artículo con mucho movimiento ya no desaparece por tener ROI bajo o negativo.
- **Profit visible pero no obligatorio:** los cálculos de beneficio y pérdida se muestran con signo; el **precio de equilibrio es informativo**, no una condición para crear el plan.
- **Protección del silver:** las rutas con pérdida prevista reciben límites de cantidad y exposición mucho más estrictos; artículos demasiado caros no bloquean a otros asequibles.
- **Plan detallado:** ítem, tier, fabricaciones, unidades para vender, ciudad de fabricación y venta, precio observado, actividad semanal, coste, estimación neta, advertencias y lista bruta de materias primas.
- **Mi negocio:** puedes guardar como **pendiente** las rutas con precio y coste conocidos, incluidas las de beneficio negativo. **Guardar nunca consume silver**. La caja se modifica solo al confirmar que la compra se realizó. Antes de marcar una compra en planes por demanda, el sistema muestra una confirmación especial.
- **Sin cifras ficticias:** si faltan cotizaciones, el plan solo muestra una unidad orientativa, no simula beneficio ni permite guardar esa ruta como compra real.

> **Importante:** la fuente AODP ofrece observaciones comunitarias del mercado. Sus registros históricos **no prueban ventas completadas**, ni reservan órdenes o materiales. Revisar precio y profundidad del mercado antes de fabricar sigue siendo imprescindible.

## Instalación con GitHub Desktop, paso a paso (Windows)

1. Descarga y **extrae este ZIP en una carpeta aparte** (por ejemplo `Descargas\Gildem_Demanda`). **No descomprimas los archivos directamente sobre tu repositorio**.
2. En GitHub Desktop abre el repositorio `drzjhon-dot/gildem-craft-pro-live`. En `Repository > Show in Explorer`, copia la ruta de la carpeta que contiene `app.js`, `core/` y `package.json`.
3. Haz doble clic en **`ACTUALIZAR_GILDEM_WINDOWS.bat`** dentro de la actualización extraída. Pega la ruta del repositorio cuando se solicite. El asistente necesita **Python 3** instalado.
4. La actualización modifica solo `app.js` y `core/always-plan.js`, y añade `tests/v8_7_1-demand-first.test.mjs`. Guarda los archivos anteriores en una carpeta de respaldo **junto a tu repositorio**, llamada `gildem-craft-pro-live_backup_antes_demanda_8_7_1`.
5. En la terminal de tu repositorio, si tienes Node 22: ejecuta `node --check app.js`, `npm test` y `npm run build`.
6. Revisa los cambios en GitHub Desktop. Haz **Commit to main** y **Push origin**. Netlify volverá a construir la web si está enlazada a ese repositorio.
7. Actualiza el navegador con `Ctrl + Shift + R`. Genera un plan de arcos u otra rama con historial conocido y verifica que aparezca **«PLAN POR ROTACIÓN · SIN FILTRO DE PROFIT MÍNIMO»**.

**Alternativa sin .bat:** abre una terminal en la carpeta extraída y ejecuta `py -3 INSTALAR_DEMANDA.py "C:\RUTA\AL\gildem-craft-pro-live"`.

## Compatibilidad y pruebas

El instalador valida cada sección a sustituir. Si el proyecto difiere de la versión observada, detiene la instalación en lugar de cambiar secciones equivocadas. Si tienes Node.js instalado, valida la sintaxis antes de finalizar y restaura las fuentes originales ante un error de sintaxis.

**Probado en esta entrega:** 10 pruebas del motor y de integración sobre una instalación de prueba (incluido un caso de precio inferior al equilibrio, límite de pérdidas, artículos caros y guardado pendiente). La compilación completa y las pruebas de todos los módulos de tu repositorio deben ejecutarse localmente o en Netlify después de aplicar el cambio. La conexión actual a GitHub permite lectura, pero rechazó la escritura automática, por lo que esta actualización **todavía no está publicada en tu web**.

## Rollback

Si necesitas volver atrás, copia `app.js` y `always-plan.js` desde `gildem-craft-pro-live_backup_antes_demanda_8_7_1` a sus ubicaciones originales (`app.js` y `core/always-plan.js`) y elimina `tests/v8_7_1-demand-first.test.mjs`. Haz commit y push del rollback.

**Nota sobre versión:** la versión de distribución permanece en `8.7.0`, porque el repositorio valida esa versión de forma estricta en `scripts/check-deploy.mjs`, `index.html`, `sw.js`, `scripts/build.mjs` y Netlify. El marcador interno `GCP_DEMAND_FIRST_871` distingue esta actualización sin romper la compilación.
