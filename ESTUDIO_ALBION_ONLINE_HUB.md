# Investigación aplicada: Albion Online Hub

Fuente principal: https://albiononlinehub.com/  
Herramienta de refinado: https://albiononlinehub.com/refining-calculator  
Guías: https://albiononlinehub.com/guides-and-news

Consulta pública realizada el 9 de noviembre de 2026. Las páginas públicas muestran funcionalidades de Market Flips, Craft Planner, comparación de precios, seguimiento de órdenes, listas de seguimiento, refinado y análisis de focus; parte de esas funcionalidades requiere cuenta o suscripción. No existe permiso ni evidencia de una API de precios utilizable por terceros: no se reproducen sus datos, recursos protegidos, diseños o código fuente.

## Lo que sí adoptamos en nuestro proyecto

1. **Comparar acciones, no confundir precios**: comprar al ask, vender al bid o publicar al ask son acciones distintas. Ahora añadimos un comprobador de spread y de frescura de ambos lados a todas las calculadoras de crafting, y desplegable de auditoría en las listas de producción.
2. **La publicación no equivale a venta**: si el mejor ask es exageradamente mayor que el bid y el historial no demuestra suficiente actividad, se descarta. Se mantienen controles de competencia, antigüedad, precios bajo estrés y libros de órdenes Black Market.
3. **Comparación interurbana sin viajes innecesarios**: Royal Craft permite limitar a 1 o 2 ciudades de FABRICACIÓN antes de asignar capital, o desactivar ese límite. No confunde ciudad de craft con ciudad de venta.
4. **Historial robusto, no un promedio frágil**: la mediana de los precios diarios hace menos probable que una observación extrema haga parecer buena una oferta. Esta medida es una señal, no ventas verificadas.

## Lo que NO afirmamos

- No importamos ni raspamos precios del sitio. Los precios siguen viniendo de AODP y conservan la fecha real de la observación.
- No podemos comprobar en tiempo real el volumen real de ventas, ni garantizar una compra de orden o venta Royal.
- Los filtros (incluida la selección de ciudades) no garantizan la cartera matemáticamente óptima. Compara con «Sin límite» si buscas un máximo teórico y acepta más viajes.
- Se mantienen servidores regionales AODP sin mezclar América, Europa y Asia.

## Cómo comprobarlo

En Royal Craft genera un plan con «Ciudades máximas para fabricar = 1», y luego con «Sin límite». El primer plan debe usar solo una ciudad de fabricación; la distribución de ventas Royal/Black puede tener varios destinos. En Black/Royal Craft abre «Verificar señales del mercado» para ver fecha y bid/ask. En Level Craft las rutas caras con spreads anómalos quedan fuera del plan de venta cuando hay poco historial. Introduce tarifas reales de taller, transporte y estudio antes de ejecutar cualquier plan.
