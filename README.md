# Gildem Craft Pro v8.3.0

Planificador económico de Albion Online, concebido para el servidor **América (West)** y ejecutado en **GitHub + Netlify**.

## Las dos herramientas principales

### Plan de crafting · Mercado Negro

- Ramas específicas de **Armas, Armaduras y Accesorios**. No muestra botones «Todas las botas/cascos/pecheras/armas».
- Filtra objetos, tiers, encantamientos, ciudades de fabricación y venta. El destino inicial recomendado es Mercado Negro, pero permite Royal cuando se elige manualmente.
- Calcula materiales, retorno, Focus según perfil, diarios cuando proceda, presupuesto bruto, margen, límites conservadores y lista de compras.
- **Refinamiento de insumos** opcional: comparar compra directa con producir materiales refinados antes de fabricar el objeto.

### Encontrar oportunidades

- Comparación entre ramas de armas, armaduras, accesorios, recolección, pociones, monturas y comidas.
- **Refinamiento como negocio**: lingotes, tablones, cuero, tela y bloques. Puedes activar esta categoría en exclusiva o combinarla con las anteriores. Solo vende en Royal.
- Precios observados de AODP, materiales y costos con fecha. Una cartera comparte el mismo presupuesto entre todas las rutas elegidas.
- El refinamiento de insumos y la inversión en refinado para venta son **dos conceptos separados** y tienen controles diferenciados.
- Los filtros que elijas se respetan; no se completan con objetos ajenos.

## Despliegue

- GitHub repo existente: `drzjhon-dot/gildem-craft-pro-live`.
- Netlify: `https://endearing-piroshki-ea4758.netlify.app/`.
- Node 22; `npm run build` construye el directorio `dist/` y ejecuta los tests.
- `dist/` es la carpeta pública, `netlify/functions` contiene el backend.
- `npm run preflight` valida ficheros y configuración de Netlify.
- `@netlify/blobs: 11.1.7` y `@netlify/otel: 7.0.6` (override) están fijados por compatibilidad con el despliegue anterior.

Consulta **`ACTUALIZAR_EN_GITHUB_NETLIFY.md`** para sustituir la versión anterior sin crear otro sitio ni cambiar tu URL.

## Fuentes, costos y seguridad

AODP observa precios, órdenes e historial aportado por terceros. No representa compras o ventas garantizadas y no confirma las órdenes del Mercado Negro en tiempo real. Muestra la antigüedad de las cotizaciones y aplica topes cuando la actividad es insuficiente. Verifica los precios en Albion antes de invertir. La estación, costos de transporte, impuestos y bonos deben concordar con el juego. El catálogo de recetas se obtiene de fuentes públicas con fecha; tras cada parche comprueba las revisiones.

El almacenamiento de datos personales es local por defecto y el sistema de sincronización cifrada es opcional. No es necesaria una cuenta personal para las dos herramientas principales.
