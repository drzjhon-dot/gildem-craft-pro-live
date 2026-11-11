# Gildem Albion Lab v9.9.4: integración oficial AODP

## Qué funciona después de publicar en Netlify, sin servicios adicionales

- Todos los precios, históricos de mercado y libros de órdenes se mantienen en **América (West)** mediante la API REST oficial de Albion Online Data Project. No se cambian motores de profit, recetas ni compras de materiales.
- Top Mercado usa `/api/v2/stats/history/{ids}.json` con `qualities=1,2,3,4,5`, `time-scale=24` y `date/end_date` correspondientes a la ventana de días UTC completos elegida. La API sirve observaciones de historiales comunitarios, no una garantía de ventas futuras.
- El proxy de Netlify valida las fechas, solicita respuestas comprimidas, y respeta el `429` y `RateLimit-Reset` para evitar insistir durante los bloqueos.
- Top Mercado abre por defecto con **Mercado Negro**, porque una búsqueda en ocho mercados puede dejar variantes sin consultar; se pueden elegir más ciudades manualmente.
- Se preservan los avisos de cobertura parcial y antigüedad. Si una variante no aparece en los resultados, **no** equivale a cero ventas.

### Referencias públicas oficiales

- https://www.albion-online-data.com/developer
- https://www.albion-online-data.com/api/
- https://west.albion-online-data.com/api-docs
- https://www.albion-online-data.com/database/

### Limitación: los números de otras webs (EMV)

Los datos EMV, estimaciones de demanda basadas en otras metodologías y los datos comunitarios de AODP no son intercambiables. No se copian cifras de páginas externas para fabricar beneficios. `History` no reemplaza el libro actual de órdenes y `orderbook` no prueba ventas ejecutadas. Antes de comprar, vuelve a verificar precio, profundidad y fecha observada.

## Integración opcional: feed NATS de West

El sitio incluye un adaptador opcional que observa el tema oficial `marketorders.deduped` (West TCP 4222) y envía, cada minuto, un resumen de **órdenes vistas** a Netlify Blobs. Su estado aparece en Top Mercado. NO suma estos mensajes a las unidades/día, NO altera ROI y NO convierte órdenes en ventas. El feed NATS no tiene garantía de historial completo: al conectarse puede haberse perdido mensajes anteriores y cada orden puede reaparecer periódicamente.

**Importante:** Netlify Functions no es un proceso con conexión TCP persistente. El feed **no empieza automáticamente** al subir este ZIP. Para usarlo necesitas un proceso siempre encendido (por ejemplo un servidor Node en tu propio equipo o un servicio de trabajadores de larga duración). El proyecto funciona por REST aunque no se active NATS.

### Pasos para habilitar NATS (opcional)

1. Genera una cadena aleatoria de 32 o más caracteres. En Netlify → Variables de entorno, añade `GILDEM_NATS_INGEST_SECRET` con esa cadena. No la pongas en el código ni en un archivo del repositorio.
2. En el servidor dedicado donde se ejecutará el trabajador, configura `GILDEM_NATS_INGEST_SECRET` con **la misma cadena** y `GILDEM_SITE_URL` con la URL HTTPS de tu sitio Netlify.
3. Ejecuta `node workers/aodp-west-nats.mjs` usando Node 22+ y un gestor de procesos que lo reinicie. Requiere conexiones salientes por TCP al puerto 4222 y HTTPS al dominio de Netlify.
4. Después de recibir mensajes, Top Mercado mostrará `NATS conectado`, el tiempo desde el snapshot y el total observado. Si el proceso se desconecta o pasan más de tres minutos, el estado será `no conectado / datos antiguos`.

**Seguridad:** el endpoint de ingesta exige token secreto y valida región West, fecha, cantidad, ciudades, item IDs y calidades. No se aceptan otros servidores, ni se exponen las credenciales del trabajador en el navegador. No uses el feed de órdenes como historial de ventas.

### Flujo de datos

`AODP REST West -> proxy Netlify /market -> caché -> Top Mercado y planes`

`AODP NATS West (opcional) -> worker Node persistente -> /aodp-feed-ingest autenticado -> Netlify Blobs -> /aodp-feed -> estado de observación de órdenes en Top Mercado`

## Por qué no se importan automáticamente los dumps de base de datos

Los archivos de la sección `database/` son respaldos grandes (centenares de MB por día). No es adecuado descargarlos, descomprimirlos ni mezclarlos con el motor de crafting dentro de una función Netlify, y no constituyen precios actuales en vivo. Para una etapa comercial posterior se requiere almacenamiento persistente, ETL y control de actualizaciones.

## Pruebas

`npm run build` ejecuta pruebas e inspecciones. Se verifica el rango UTC, calidad, parser NATS, validación del estado, regresiones de crafting y rate-limit de la API. Esta verificación local no equivale a una comprobación del feed NATS en producción, que depende del proceso externo.
