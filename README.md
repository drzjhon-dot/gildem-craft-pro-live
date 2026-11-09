# Gildem Craft Pro 7.4.3 · Instalación limpia

**Primero lee `EMPIEZA_AQUI.md`.** Este repositorio está diseñado para publicarse desde GitHub con Netlify (no es un ZIP de arrastrar a Netlify Drop).

## Funcionalidades

- Planes Royal y Black Market para equipo y armas; monturas, pociones, comidas y recolección dirigidas a Royal.
- Selector visual de ramas con imágenes y fallbacks.
- Consulta precios e historial de AODP con antigüedad explícita.
- Plan de inversión, recursos, costos, diarios, Focus, límites de actividad, verificación precompra y registro de ventas.
- Funciones Netlify de mercado, recetas, imagen y snapshot horario de un conjunto limitado de artículos.

## Configuración

- Node 22.
- `npm run build` (copia estáticos a `dist/` y ejecuta las pruebas).
- `dist/` como publish dir; `netlify/functions` para funciones.
- `@netlify/blobs`: exactamente `11.1.7`; `@netlify/otel` fijado indirectamente a `7.0.6` para evitar el error de instalación anterior.
- `GILDEM_PREFETCH_ICONS=0` evita que las CDN de imágenes ralenticen el primer despliegue. La app seguirá intentando cargar imágenes vía CDN y función de Netlify.

## Límites

No se han validado peticiones AODP, instalación npm completa ni ejecución de funciones en el sitio nuevo, ya que dependen de servicios externos. Las pruebas automáticas cubren cálculos y partes del motor, no la disponibilidad real de un mercado ni el despliegue público.
