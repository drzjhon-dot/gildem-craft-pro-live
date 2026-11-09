# Comprobar actualización v8.4.6

- `/version.json` indica `8.4.6`.
- `/.netlify/functions/health` responde con `status: ok`, `functions: true` y versión `8.4.6`.
- En ambas pestañas, **Elegir objetos específicos** muestra nombres sin `.4.4` fijo ni códigos internos en subtítulos.
- En **Encontrar oportunidades**, `¿Dónde fabricar?` ofrece bono por receta, comparación con Caerleon y ciudades concretas.
- Tras generar un plan ya no aparecen los cuatro paneles eliminados, pero sí la lista de compras y la verificación bajo demanda.
- Prueba un icono, por ejemplo `/.netlify/functions/item-image?id=T4_BAG&size=96`: debería devolver una imagen si algún proveedor está accesible. En una segunda visita, el header `Cache-Status` puede mostrar un acierto CDN, según región y caché activa.
- Un `404` del icono indica que no se pudo obtener de los proveedores; no significa que los precios hayan fallado.

**Criterio:** no invertir silver basándose únicamente en pruebas locales: valida precios, tarifas y órdenes recientes dentro del juego.
