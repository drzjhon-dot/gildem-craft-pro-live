# Gildem Craft Pro v8.6.2 · Fuentes verificadas para América (West)

## Política innegociable

Black Craft y Royal Craft consultan **solo América/West**. La API numérica principal es `https://west.albion-online-data.com`, con observaciones de precios, historial y libros de órdenes fechadas. La API `east` y `europe` se rechaza en la aplicación y en la función Netlify; las preferencias regionales antiguas se convierten a West. La caché de AODP se separa por región, y las nuevas estadísticas manuales usan otra clave de almacenamiento, para no reutilizar importaciones previas.

## Fuentes de contraste, no APIs adicionales de estadísticas

- **Albion Online Hub, Top Selling:** https://albiononlinehub.com/top-selling-items. La existencia de un ranking no demuestra por sí misma que sus datos sean de West. La web no ofrece una API pública confirmada por este proyecto. Se admite **pegado manual** de cantidades solo cuando la persona confirma expresamente que la tabla identifica América (West). Si la tabla contiene una etiqueta Europe/Asia, el importador la rechaza, incluso con la casilla marcada. Son datos declarados por el usuario, no verificados independientemente.
- **Royal Forge Market:** https://royalforge.app/market. Su sitio anuncia soporte para las tres regiones; hay que seleccionar **Americas**. La aplicación comprueba accesibilidad y ofrece el enlace, pero no importa automáticamente precios o volúmenes.
- **Albion Online Tools Marketplace:** https://albiononlinetools.com/marketplace/. Admite filtro de servidor; hay que elegir West. Sus anuncios de compraventa de jugadores no equivalen a ventas completadas ni se convierten en demanda histórica.
- **Albion Free Market Top Traded:** https://albionfreemarket.com/topitems. Fuente adicional con selector Americas, muestra estadísticas históricas basadas en AODP. Su ranking requiere sesión para ciertas acciones y no se integra como feed automático.
- **AO MCT:** https://aomct.app/. Contraste adicional de crafting y mercados, siempre seleccionar Americas. También utiliza datos AODP, por lo que no es una verificación independiente de su origen.

**Excluida:** la calculadora Albion Journal para Europa. Se retiró de las referencias del plan y se prohibió su importación numérica.

## Investigación con IA

En **Fuentes consultadas** se incluye el botón **Copiar consulta para investigación con IA · West**. Genera un prompt para investigar la rama y los IDs del plan en ChatGPT u otro asistente con acceso a Internet, exigiendo citas y evidencia regional. **No realiza una búsqueda IA en segundo plano por sí solo**: esto requeriría un servicio web conectado, un mecanismo de autenticación y controles de costes/abuso. No se solicita ninguna API key en el navegador ni se le atribuyen resultados inexistentes a un modelo.

## Comprobación antes de invertir

1. Verifica AODP West en las tarjetas y la antigüedad de cada cotización.
2. Compara solo la misma ciudad, tier, encantamiento y calidad.
3. Trata los históricos como señales de actividad, nunca como pedidos ejecutables ni como seguridad de que tu orden se venderá.
4. Comprueba en el juego las órdenes, impuestos, tarifas, artefactos y profundidad disponible de los materiales; evita consumir las primeras ofertas baratas con un lote demasiado grande.
5. Si se muestran datos sin confirmar, el plan debe tratarse como **provisional o de investigación**, no un beneficio garantizado.

## Estado de calidad

Pruebas automáticas y `npm run build` verificadas localmente. No se garantiza el comportamiento de las redes, los mercados reales, las cookies de terceros ni la instalación en la cuenta Netlify hasta probar la publicación del sitio.
