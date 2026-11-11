# Gildem Albion Lab · Craft Pro v9.8.4

La versión v9.8.4 se basa en la v9.8.3 validada para Netlify. Cambios exclusivamente de presentación en el menú lateral:

- Se eliminó el texto «Mi taller».
- El logo aprobado se integra sobre el fondo del menú, sin cuadro visible. El archivo WebP tiene transparencia para conservar el escudo y el texto.
- Se conserva una copia del arte previo como `assets/branding/gildem-sidebar-logo-original.webp`.
- No se modificaron `app.js` ni los módulos de `core/`.

## Publicación a GitHub + Netlify

1. Descomprime el ZIP y sube **todo su contenido** a la raíz del repositorio, reemplazando los archivos de la versión anterior; incluye `tests/`, `scripts/`, `assets/`, `core/`, `sw.js`, `package.json` y `index.html`.
2. Haz Commit en la rama conectada a Netlify.
3. Netlify ejecutará `npm run build`, incluidas todas las pruebas automatizadas.
4. Si sigues viendo la versión anterior, recarga usando Ctrl+Shift+R. La versión de caché cambió a 9.8.4.
