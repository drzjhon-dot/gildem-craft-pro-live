# Gildem Craft Pro v8.5.5: nueva tab RESULTADOS

Esta entrega es una **actualización para tu proyecto existente**, no una web autónoma.
Conserva Black Craft, Royal Craft, Level Craft, el motor económico, tus ajustes y la conexión a AODP.

## Qué se implementa

- Menú lateral **Resultados** con el estilo visual oscuro/dorado que elegimos.
- Apertura automática de Resultados después de generar un plan viable de Black Craft o Royal Craft.
- Si ambos planes están en memoria, cambio rápido entre Black y Royal sin mezclarlos.
- Tarjetas de capital, profit neto estimado, ROI y Focus, usando los valores **del motor**, no del diseño gráfico.
- Lista de fabricación con **iconos reales de Albion** mediante el sistema de render del proyecto, tier, ciudad, venta, profit y cantidades editables.
- Lista de compras de materiales y diarios con cantidades brutas, ciudad, precio presupuestado, techo prudente calculado y costo. **El techo no es un precio disponible o garantizado**.
- Comprobación previa integrada con AODP y estados honestos: pendiente, favorable o necesita revisión.
- Distribución proporcional de capital por familia; barras representativas y presupuesto restante.
- Botones: verificar, copiar compras, exportar CSV, guardar inversión, editar plan.
- Arte decorativo original en el fondo fantasy; **las ilustraciones de fondo no sustituyen los iconos de objetos del juego**.
- El refresco de la barra superior y el botón regenerar vuelven al formulario de origen y consultan precios nuevos.
- Diseño adaptable a móvil y computadora.

## Instalar en Windows

1. Descomprime este archivo ZIP **fuera** de la carpeta de tu proyecto.
2. Descarga o abre en tu PC la carpeta **completa** del repo `drzjhon-dot/gildem-craft-pro-live`.
3. Arrastra esa carpeta sobre `ACTUALIZAR_WINDOWS.bat`.
4. El instalador acepta v8.5.2, v8.5.3 o v8.5.4. Para las dos primeras incorpora primero las actualizaciones previas.
5. El `.bat` ejecuta `npm test` y `npm run build` (requiere Python 3 y Node.js 22).
6. Si ambas operaciones terminan bien, usa GitHub Desktop para Commit y Push. Netlify publicará el cambio cuando termine el deploy.
7. Recarga la web. Si ves diseño antiguo, haz recarga forzada o espera a que el service worker se actualice.

Alternativa manual: `python INSTALAR_ACTUALIZACION.py "RUTA_A_TU_REPO"` y luego `npm test` y `npm run build` desde el repo.

### Advertencias

- Este actualizador **no se ha publicado en tu GitHub ni Netlify**: la integración de GitHub disponible no permite escritura al repositorio.
- Se probaron los cálculos puros, la sintaxis del archivo de pantalla y el instalador en un proyecto de prueba. No se pudo ejecutar aquí `npm test` del repo real completo porque ese código no está disponible en el contenedor.
- Copia de seguridad del código cambiado: `.gildem-respaldo-antes-v8.5.5/` dentro del repo local.
- Guardar plan utiliza el sistema **Mi negocio** ya existente. El plan editable actual permanece en memoria durante la sesión; no se simula recuperación de un plan guardado si no conserva sus datos económicos originales.
- El sistema diferencia datos observados y profundidad verificada; los resultados no garantizan que las órdenes se ejecuten ni que exista liquidez para cada lote.
- Para cambiar qué iconos aparecen, debes corregir los IDs reales de recetas; la nueva pantalla usa `itemCell`/`itemimg` y sus fallbacks ya existentes.

## Pruebas nuevas

- `tests/v8_5_5-results.test.mjs` mide KPI, ROI, presupuesto, límites globales de compra, preflight y las conexiones con el menú y el estado del motor.
