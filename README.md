# Gildem Craft Pro v8.5.2

Herramienta de crafting de Albion Online para **América / West**, preparada para GitHub y Netlify.

## Pestañas

- **Black Craft**: planificación centrada en el Mercado Negro, con armas, armaduras, accesorios y manos secundarias.
- **Royal Craft**: escáner de oportunidades multi-rama, Royal y Black Market opcional, refinamiento independiente, listas de fabricación y distribución de ventas separadas.
- **Level Craft** (nuevo): selección de familia de objeto, spec actual, fama exacta opcional, tiers, ciudad con bono, presupuesto, ventas Royal/BM, estudio opcional y límite conservador por actividad observada. Se muestran lista consolidada de fabricación, lista de compras, destinos y rondas únicamente cuando hacen falta.

## Novedades v8.5.2 · Inteligencia de mercado y menos viajes

Inspiración funcional (no copia del código ni precios de otro sitio): https://albiononlinehub.com/ y su calculadora de refinamiento / herramientas de flips. El valor principal es distinguir claramente **compra inmediata, orden de compra, venta inmediata y publicación**, y comparar la ruta completa de producción y venta. No hemos conectado una API privada de ese sitio: los precios continúan viniendo de **Albion Online Data Project** de la región que seleccionas (West por defecto). El hecho de refrescar un precio no demuestra que el mercado se haya actualizado.

- **Auditoría de órdenes y precios en las tres herramientas de fabricación.** Cada ruta recibe el precio reciente de la mejor compra (**bid**), el de la publicación (**ask**), su diferencia porcentual y su antigüedad. Una divergencia extrema puede descartar una oportunidad Royal con poca actividad y sin ventas personales comprobadas. Si faltan ambos lados, no se inventa un spread.
- **Historial menos vulnerable a precios anómalos.** Se usa mediana por día y, con al menos cuatro días con precios, mediana entre días para comprobar ofertas infladas. Se conserva el promedio previo para compatibilidad y como fallback cuando no hay suficientes días.
- **Royal Craft: 1, 2 o sin límite de ciudades de fabricación.** Por defecto limita a 1 ciudad para reducir traslados. Primero se filtran rutas no rentables y sin suficiente liquidez; después se elige ciudad mediante un método heurístico basado en beneficio prudente, capital y capacidad. Si quieres explorar todas las ciudades, marca «Sin límite». Los destinos de venta siguen comparándose por separado.
- **«Verificar señales del mercado».** Desplegable compacto en los resultados Black/Royal para comprobar bid, ask, referencia histórica y antigüedad sin llenar la lista de fabricación.

Ningún filtro garantiza venta, beneficio, demanda futura o un óptimo global matemático. Si una cotización está vieja o no hay evidencia suficiente, puede no aparecer un plan.

## Motor de viabilidad v8.5.2

**Level Craft** ya no considera planes con pérdidas de crafting para el método vender, aunque generen mucha fama. Antes de asignar silver exige margen neto mínimo (9% del capital bruto en Level Craft, 6% en Royal y Black Craft), beneficio positivo bajo un escenario de precio desfavorable, precios fechados, liquidez y competencia razonables. Cuando no hay datos suficientes se descarta la ruta, en vez de inventar una salida.

- **Royal:** historial observado durante varios días y actividad suficiente; penaliza las órdenes competidoras y precios de venta superiores al historial. Las observaciones no prueban compradores ni ventas ejecutadas.
- **Mercado Negro:** exige un libro de compra reciente con volumen verificable. Comprueba todos los niveles utilizados, descontando las cantidades ya asignadas en otras rondas.
- **Capital:** limita la exposición por artículo y deja una reserva (10% en Black/Royal y 20% por ronda de Level Craft). No se obliga a invertir todo.
- **Gastos desconocidos:** si estación o transporte se dejan en cero, el filtro reserva una contingencia pequeña. Sigue siendo necesario introducir tarifas reales.
- **Level Craft:** máximo ocho rondas condicionales; capacidad observada total, no renovada ficticiamente. El estudio requiere activación y tarifa informada y no puede consumir más del 20% del capital inicial.

Estos umbrales son **filtros de precaución**, no una garantía matemática del mejor plan posible. La API AODP no permite conocer todas las transacciones ni ejecutar órdenes. La herramienta puede devolver un plan parcial o ningún plan si las oportunidades no pasan los controles.

## Cómo calcula Level Craft

El total de fama de especializaciones comunes procede de referencias publicadas del Destiny Board. Para un nivel intermedio la fama restante se **estima por interpolación**; para usar un objetivo exacto escribe la fama pendiente que muestra el juego. Ciertas familias especiales requieren siempre esa cifra. La fama por fabricación se estima a partir de materiales refinados de la receta, encantamiento y Premium; para recetas con artefactos o fama especial, verifica el dato del juego y usa el campo de fama por craft con un tier/encantamiento exactos. No se descuentan LP ni se da por hecho ningún desbloqueo de tier.

**Estudio opcional**: primero se considera venta. Si la capacidad observada o el presupuesto no son suficientes, se puede fabricar y estudiar. Los objetos estudiados se destruyen, nunca se incluyen en ventas, y su tarifa debe configurarse con el dato real del taller. Monturas y refinado no son estudiables. Focus opcional utiliza el costo de Focus indicado y un presupuesto total máximo; no se supone Focus infinito.

Los límites de mercado usan observaciones públicas **AODP**, que no confirman ventas; no existen garantías de absorción, repetición de órdenes ni precios futuros. Las rondas posteriores solo se financian si se materializan ventas y retornos previstos. Los planes parciales muestran la fama aún pendiente y no prometen alcanzar spec 100.

Referencias sobre fama: https://albionfreemarket.com/articles/view/how-much-fame-to-reach-level-100-in-albion-online-the-destiny-board-explained y https://albionfreemarket.com/articles/view/how-studying-works-in-albion-online .

## Desplegar

Instala Node.js 22, usa `npm test`, `npm run build`, `npm run preflight`. Netlify ejecuta `npm run build`, publica `dist` y usa `netlify/functions`. No subas `dist` al repositorio: se genera automáticamente. El proyecto no requiere servidores privados.
