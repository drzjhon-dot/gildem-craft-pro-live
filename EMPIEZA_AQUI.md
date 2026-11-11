# Gildem Albion Lab · Craft Pro v9.8.3

Esta versión parte del proyecto **v9.8.2** y realiza exclusivamente el cambio del logo lateral solicitado. El código de los motores no fue alterado.

## Publicación

1. Elimina del repositorio los archivos de la versión rota que estén obsoletos y sube **todos** los archivos y carpetas de este ZIP, no solo la imagen.
2. Haz commit y push a la rama desplegada por Netlify.
3. Netlify ejecutará `npm run build`, incluidas las pruebas.
4. Si el navegador sigue mostrando una versión anterior, recarga con Ctrl+Shift+R.

## Control de regresión

Los tests verifican la imagen `assets/branding/gildem-sidebar-logo.webp`, la ausencia de texto duplicado y su inclusión en el Service Worker.
