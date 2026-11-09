# Gildem Craft Pro v8.5.0

Herramienta de crafting de Albion Online para **América / West**, preparada para GitHub y Netlify.

## Pestañas

- **Black Craft**: planificación centrada en el Mercado Negro, con armas, armaduras, accesorios y manos secundarias.
- **Royal Craft**: escáner de oportunidades multi-rama, Royal y Black Market opcional, refinamiento independiente, listas de fabricación y distribución de ventas separadas.
- **Level Craft** (nuevo): selección de familia de objeto, spec actual, fama exacta opcional, tiers, ciudad con bono, presupuesto, ventas Royal/BM, estudio opcional y límite conservador por actividad observada. Se muestran lista consolidada de fabricación, lista de compras, destinos y rondas únicamente cuando hacen falta.

## Cómo calcula Level Craft

El total de fama de especializaciones comunes procede de referencias publicadas del Destiny Board. Para un nivel intermedio la fama restante se **estima por interpolación**; para usar un objetivo exacto escribe la fama pendiente que muestra el juego. Ciertas familias especiales requieren siempre esa cifra. La fama por fabricación se estima a partir de materiales refinados de la receta, encantamiento y Premium; para recetas con artefactos o fama especial, verifica el dato del juego y usa el campo de fama por craft con un tier/encantamiento exactos. No se descuentan LP ni se da por hecho ningún desbloqueo de tier.

**Estudio opcional**: primero se considera venta. Si la capacidad observada o el presupuesto no son suficientes, se puede fabricar y estudiar. Los objetos estudiados se destruyen, nunca se incluyen en ventas, y su tarifa debe configurarse con el dato real del taller. Monturas y refinado no son estudiables. Focus opcional utiliza el costo de Focus indicado y un presupuesto total máximo; no se supone Focus infinito.

Los límites de mercado usan observaciones públicas **AODP**, que no confirman ventas; no existen garantías de absorción, repetición de órdenes ni precios futuros. Las rondas posteriores solo se financian si se materializan ventas y retornos previstos. Los planes parciales muestran la fama aún pendiente y no prometen alcanzar spec 100.

Referencias sobre fama: https://albionfreemarket.com/articles/view/how-much-fame-to-reach-level-100-in-albion-online-the-destiny-board-explained y https://albionfreemarket.com/articles/view/how-studying-works-in-albion-online .

## Desplegar

Instala Node.js 22, usa `npm test`, `npm run build`, `npm run preflight`. Netlify ejecuta `npm run build`, publica `dist` y usa `netlify/functions`. No subas `dist` al repositorio: se genera automáticamente. El proyecto no requiere servidores privados.
