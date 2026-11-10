# Gildem Craft Pro v8.5.7 | Refinamiento, ramas únicas y órdenes de venta

Proyecto completo en español para **Albion Online · servidor América (West)**. No requiere Python ni instaladores. Para actualizar desde Windows, lee `SUBIR_A_GITHUB_DESDE_WINDOWS.md`.

## Cómo funciona

- **Black Craft:** elige una rama individual, objetos, T4–T8 y encantamientos **.0, .1, .2, .3 y .4**; busca exclusivamente vender en el Mercado Negro. Valora retorno de materiales, tasas, Focus (cuando hay datos), beneficio neto y actividad observada. Los objetos se destinan a **órdenes de venta BM**; la puja actual de compra del NPC es únicamente una referencia conservadora, no garantiza ejecución de nuestra orden.
- **Royal Craft:** los mismos controles compactos para las siete ciudades **Bridgewatch, Fort Sterling, Lymhurst, Martlock, Thetford, Caerleon y Brecilien**. Planifica la **publicación de órdenes de venta** en las siete ciudades y elige materiales cotizados entre las ciudades, sin obligar a comprar donde existe bono de refinado. Incluye **Refinamiento** como categoría con los cinco materiales y bonos diarios 0/10/20%. Las herramientas aparecen una vez por profesión de Recolección y todas las monturas comparten una única rama.
- **Level Craft:** planificación de fama de crafting con venta prioritaria, estudio opcional y límites conservadores.
- **Resultados:** dashboard con iconos del juego, materiales, diarios, distribución por categoría, CSV, copia, inversiones guardadas y **Verificar antes de comprar**.
- **Cobertura del mercado:** panel desplegable con **bid / ask**, cantidad histórica observada en 14 días y objetos con más actividad para cada mercado de la rama elegida. También indica cuántos candidatos faltaron por precios, demanda o margen.

## Las cuatro fuentes solicitadas, revisadas en cada plan

La aplicación consulta un endpoint propio de Netlify para **comprobar la accesibilidad** de Albion Journal Craft Profit, Albion Online Hub Top Selling, Royal Forge Market y Albion Online Tools Marketplace cada vez que genera un plan. Los cuatro enlaces, su estado y una explicación se muestran en **Resultados** y en el informe de mercados. Una respuesta HTTP correcta solo verifica que un sitio sea accesible: **no demuestra que sus estadísticas hayan sido importadas**. Algunas páginas usan datos de AODP y otras son anuncios entre jugadores, no ventas ejecutadas. Sin una API documentada y verificable, no se extraen ni mezclan cifras de esas páginas con el motor.

Las cifras que sustentan precio, actividad y márgenes proceden **de AODP**, consultadas por objeto y mercado con antigüedad, para evitar números inventados.

## Importante sobre las fuentes

**AODP** (Albion Online Data Project) recoge observaciones aportadas por los clientes del juego. Una cotización puede estar desactualizada; el número histórico de ítems observados **no demuestra ventas ejecutadas** ni garantiza la demanda futura. El libro de órdenes, cuando existe, representa una muestra que puede desaparecer. Mostrar 0 objetos con actividad NO significa que un objeto no se venda si el historial no fue consultado: la pantalla distingue la ausencia de datos.

Las webs de referencia se comprueban en cada plan como fuentes externas de consulta. La información numérica de precios, historia y órdenes procede de AODP, con fecha y advertencias. Una orden de venta puede permanecer sin comprador, especialmente en BM.

## Límites de inversión

- El motor descarta rutas sin margen de seguridad o sin datos suficientes; **no fuerza el uso completo de tu presupuesto** cuando eso significaría perder silver.
- La distribución para comprar recursos usa topes basados en actividad histórica (8% de la referencia diaria) y, cuando se observan ofertas a precio presupuestado, hasta el 60% de esos niveles. Los materiales sin profundidad o historial fiable quedan limitados a operaciones iniciales pequeñas.
- La pantalla **no calcula un precio de compra ejecutable por toda la profundidad** de un libro con niveles variables: conserva un precio unitario de referencia y limita cantidad. Compra por tramos con límite y vuelve a verificar en el juego para evitar deslizamientos.
- **Brecilien**, Black Market y los traslados entre ciudades pueden tener costes y riesgos de transporte no cubiertos por las tarifas por defecto. Revisa transporte/taller y no trates un profit sin estos gastos como garantizado.
- Se consultan mercados de la **rama y variantes seleccionadas**, no todos los objetos de Albion en una sola búsqueda. El historial puede estar muestreado para controlar el número de peticiones; la pantalla informa cuántos ítems se consultaron.

## Validación

El paquete contiene código fuente, `core/`, funciones `netlify/`, tests, fondos, configuración GitHub Actions y Netlify. Se ejecutó `npm run preflight` y `npm run build` en Node.js 22 con **211/211 pruebas aprobadas**. Se probaron flujos de Black Craft y Royal Craft en Chromium **con cotizaciones de prueba**, no mediante compras en un mercado real.

```bash
npm install --ignore-scripts --no-audit --no-fund
npm run build
```

Netlify usa `netlify.toml` (`npm run build`, publicación en `dist/`, Node 22). El sitio solicita iconos auténticos a fuentes del juego cuando hay conexión y tiene fallbacks visuales.
