# Actualizar Gildem Craft Pro a v8.4.1

1. Descargar y descomprimir el ZIP.
2. Abrir el repositorio `drzjhon-dot/gildem-craft-pro-live` en GitHub Desktop.
3. Copiar el contenido del ZIP a la carpeta clonada del repositorio, reemplazando los archivos antiguos. No eliminar `.git`.
4. Escribir `Update UI compacta v8.4.1`, hacer **Commit to main** y **Push origin**.
5. Comprobar en Netlify que el último deploy está **Published**.
6. Verificar `/version.json` (8.4.1) y `/.netlify/functions/health` (`status: ok`).
7. Actualizar la pestaña del navegador; si queda una versión previa por service worker, recargar forzadamente.

Este ZIP contiene el proyecto completo y conserva el backend, las rutas de API y la configuración de Netlify.
