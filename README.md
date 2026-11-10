# Gildem Craft Pro v8.6.0 | Demanda primero, rentabilidad después

Herramienta web de crafting en español para **Albion Online**, configurada por defecto para **América (West)**. Proyecto completo para GitHub + Netlify, sin reparadores locales. Las tabs principales son **Black Craft**, **Royal Craft** y **Resultados**; Level Craft no aparece en la navegación.

## Qué se corrigió en v8.6.0

El motor anterior podía proponer una unidad de botas T5.4 aunque se observaran miles de unidades diarias de botas T4.0, T5.0 y T6.0. El problema no se limita a botas. Cambiamos la lógica de ambas tabs para que:

1. Consulte primero **7, 14 y 30 días de actividad observada** de hasta 900 objetos **de la rama seleccionada**, incluyendo .0, .1, .2, .3 y .4, antes de clasificar oportunidades por margen. La selección se limita si una rama excede el cupo; la cobertura parcial se indica en el diagnóstico.
2. Calcule cantidades a partir de un **horizonte de órdenes de venta de 7, 14 o 30 días** (14 días por defecto). No redondea la actividad de un solo día a cero ni impone 12 unidades máximas a todos los artículos.
3. Compare margen positivo, inversión, actividad observada, concentración por objeto, competencia, antigüedad y materiales para **Black Market y los siete Royal**. El algoritmo es una aproximación, no un óptimo garantizado.
4. Proponga cantidades mayores de objetos con actividad alta, **sujetas a capital y precio verificable**, y una exposición pequeña para productos con poca información. La cantidad es el objetivo de producción/venta por órdenes, no una garantía de ejecución del libro.
5. Conserve el modo **PLAN CONDICIONADO** cuando no haya stock de materiales verificado para comprar el lote al precio presupuestado. Muestra necesidad de **compras por etapas** y exige comprobación previa antes de ejecutar. El beneficio estimado se puede deteriorar con deslizamiento de compra, impuestos, transporte y competencia.
6. Muestre en Resultados, bajo cada objeto, **actividad aproximada por día, fuente de datos, límite indicativo de fabricaciones y advertencia de compras por etapas**.

## Datos de mercado, fuentes y sus límites

Los precios y la actividad automática se consultan a **Albion Online Data Project (AODP)** por objeto y ciudad, para el servidor elegido. La API y su historia son registros públicos observados por clientes; **`item_count` no es una garantía de ventas completadas, de demanda futura ni de que el precio se mantenga**. Las ofertas pueden estar obsoletas. La puja BM de compra de NPC es referencia de precio para la propia orden de venta, no una ejecución confirmada.

La aplicación conserva enlaces y comprobación de accesibilidad de estas cuatro referencias: [Albion Online Hub: Top Selling](https://albiononlinehub.com/top-selling-items), [Albion Journal: Craft Profit](https://vanatoliyv.github.io/albion-craft-profit/#craft), [Royal Forge Market](https://royalforge.app/market) y [Albion Online Tools Marketplace](https://albiononlinetools.com/marketplace/). **Comprobar que una web responde no equivale a importar sus estadísticas**. No se integran directamente los datos privados/dinámicos de estas páginas si no hay una API pública verificable.

### Importación manual opcional de rankings

En **Ajustes y datos → Estadísticas externas de volumen**, expande el panel y pega una tabla de **Albion Online Hub** o **Albion Journal**, como las que proporcionaste. Selecciona su fuente, **mercado de destino**, **servidor** y **fecha real de la muestra**. Pulsa **Guardar estadísticas**. Se guardará **una importación por vez** en el navegador, y puedes reemplazarla por otra. Se aceptan datos de hasta 14 días de antigüedad y solo si coinciden con el servidor configurado. Los valores sirven exclusivamente para una señal **provisional de rotación**, con exposición reducida por menor verificabilidad. **No se importan precios ni ROI desde las tablas**.

Por ejemplo, la fila de Hub `T5_SHOES_PLATE_SET2` con `3,696` unidades diarias en **Black Market** se puede utilizar para dimensionar el interés del mercado, pero la rentabilidad se vuelve a calcular usando costes y precios de AODP para **América/West**. La web de Albion Journal puede estar configurada para Europa; **no marques América para datos obtenidos en Europa**, aunque un artículo se llame igual.

## Qué hace cada tab

- **Black Craft:** rama individual, lista de objetos, tiers T4-T8, .0-.4, ciudad con bono, producción 0/10/20%, Focus, presupuesto, uso del capital y horizonte de venta. El destino es siempre **Mercado Negro** mediante orden de venta.
- **Royal Craft:** mismas opciones compactas, selección de categorías, **Refinamiento** disponible, Recolección agrupada por profesión sin repetir herramientas, todas las monturas en una sola rama. Compara publicaciones de órdenes en los siete mercados Royal y fuentes de materiales entre ciudades.
- **Resultados:** tarjetas de capital/profit/ROI/Focus, fabricación editable, compras con límite orientativo, diarios, distribución del capital, advertencias, exportación y **Verificar antes de comprar**. Las cantidades mostradas pueden requerir compras por etapas.
- **Ajustes y datos:** importación opcional de volumen por tabla pegada. La fuente, la fecha y el servidor son explícitos.

### Si un plan continúa proponiendo solo 1 objeto

Revisa la leyenda bajo ese objeto: puede deberse a falta de historial para ese ID y ciudad, precios obsoletos, concentración de capital, presupuesto insuficiente, competencia o materiales aún no verificables. El horizonte de 14 o 30 días permite planificar más inventario, **pero no debe superar cantidades justificadas ni ignorar costes**. Comprueba las fuentes seleccionadas y mira **Mercados examinados** si falta un plan. Un objeto con mucho volumen puede no ser rentable en el momento de la cotización.

## Publicación y pruebas

Consulta `SUBIR_A_GITHUB_DESDE_WINDOWS.md` para reemplazar el código completo usando GitHub Desktop. El ZIP incluye `app.js`, `index.html`, `styles.css`, `core/`, `netlify/`, `assets/`, `scripts/`, `.github/` y `tests/` sin subcarpetas extra de instaladores.

```bash
npm install --ignore-scripts --no-audit --no-fund
npm run preflight
npm run build
```

**Validación local v8.6.0:** 230 pruebas automáticas aprobadas; compilación y preflight correctos con Node 22. Navegador Chromium probado **con datos de mercado simulados**, no con ejecuciones o compras reales. Los resultados de prueba con cientos de unidades **no son un consejo de compra**. La publicación Netlify, cuotas y calidad de las APIs reales solo se verifican tras desplegar.

La comprobación previa no equivale a una reserva real de recursos ni a garantías de llenado en Royal o BM. Compra por tramos, valida tarifas y precio máximo, y no fabrique si el margen resulta negativo.
