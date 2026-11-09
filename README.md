# Gildem Craft Pro v8.4.6

Herramienta de crafting para **Albion Online, servidor América/West**, preparada para GitHub + Netlify. Conserva Plan de crafting para Mercado Negro y Encontrar oportunidades para Royal, Black Market y refinamiento.

## Cambios v8.4.6

- **Iconos para todos los objetos:** primera fuente común en la función Netlify `item-image`, con caché HTTP/CDN y fuentes alternativas. No almacena una selección limitada de imágenes durante el build. En una primera consulta dependemos de la red y de los proveedores de iconos; ninguna CDN garantiza carga instantánea.
- Selector de objetos específicos con nombres de familia en español, sin el engañoso sufijo `4.4` ni ID técnico debajo.
- Resultado más sencillo, sin paneles de rotación/silver por día, economía del lote, inventario/desembolso y logística.
- **Encontrar oportunidades → ¿Dónde fabricar?**: especialidad de cada objeto, comparar Caerleon o seleccionar ciudad concreta. La ciudad de bono solo otorga retorno extra a las recetas cuya especialidad realmente coincide.

## Publicación

1. Usa Node.js 22.
2. Conecta el repositorio a Netlify, con `npm run build`, directorio `dist`, funciones en `netlify/functions` y base vacía.
3. **No subas `dist/` a GitHub**: Netlify lo genera durante el despliegue.
4. Revisa `/version.json` y `/.netlify/functions/health` en tu dominio tras publicar.

Para pruebas locales ejecuta `npm test`, `npm run preflight` y `npm run build`.

La app consume observaciones de precios AODP fechadas. Las cotizaciones y órdenes observadas no garantizan demanda o ventas efectivas.
