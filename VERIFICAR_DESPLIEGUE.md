# Pruebas prácticas después de publicar v8.3

1. **Versión**: `/version.json` = `8.3.0`.
2. **Backend**: `/.netlify/functions/health` devuelve `status: ok`.
3. **Plan de crafting**: aparecen únicamente Armaduras, Armas y Accesorios. Al seleccionar Armaduras aparecen Botas de placas, Zapatos de tela, Zapatos de cuero, etc., pero **no** «Todas las botas y zapatos», «Todos los cascos y capuchas» ni «Todas las pecheras».
4. **Encontrar oportunidades**: aparecen ocho categorías legibles, con icono, título y subtítulo completos. Los nombres no deben truncarse.
5. **Refinar para vender**: marca solo `Refinamiento`; marca `Lingotes`, tier T5 a T5, encantamiento .0, destino `Solo Royal`, venta por orden. Introduce tu tarifa de estación y transporte. Ejecuta el escáner.
6. **Lista de compras del refinado**: si los precios recientes permiten recomendar T5 lingotes, debe mostrar T5 mineral y lingotes T4 (tier anterior), no pedir el lingote T5 terminado como compra adicional. La inversión bruta debe cubrir todos los insumos.
7. **Combinado**: selecciona `Armaduras` y `Refinamiento` en Royal + Mercado Negro, con el presupuesto que elijas. La suma de rutas no debe superar el capital, aunque ambas secciones tengan márgenes positivos.
8. **Mercado Negro exclusivo**: si eliges solo Refinamiento y solo Mercado Negro, la app debe pedirte cambiar el destino. Si hay otras categorías además, el refinamiento se omite con una explicación.
9. **Calidad del dato**: confirma siempre la fecha de los precios, la tasa de retorno, la tarifa de estaciones y el costo de transportar. AODP puede no tener cotizaciones recientes; no fabriques usando precios ausentes o históricos como si fueran en vivo.

Este documento es un **procedimiento manual**. Las pruebas automáticas no equivalen a una comprobación visual y de precios en el sitio en producción.
