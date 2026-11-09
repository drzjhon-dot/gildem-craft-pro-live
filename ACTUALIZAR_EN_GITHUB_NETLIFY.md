# Actualizar Gildem Craft Pro a v8.4.4

La URL actual se mantiene: https://endearing-piroshki-ea4758.netlify.app/

## Paso 1. Descargar y descomprimir

Descomprime `Gildem_Craft_Pro_v8_4_4_LISTO_PARA_GITHUB_NETLIFY.zip` en tu equipo. Dentro deben verse **directamente** `package.json`, `netlify.toml`, `index.html`, `app.js`, `core/`, `netlify/`, `scripts/` y `tests/`.

**No subas el ZIP como un archivo dentro del repositorio.** GitHub y Netlify necesitan el código sin comprimir.

## Paso 2. Reemplazar archivos en GitHub Desktop

1. Abre GitHub Desktop y selecciona `drzjhon-dot/gildem-craft-pro-live` (rama `main`).
2. En `Repository > Show in Explorer` abre la carpeta local del repositorio.
3. Copia **el CONTENIDO** de la carpeta descomprimida dentro de la carpeta del repositorio (no copies una carpeta envolvente), y acepta reemplazar archivos.
4. Conserva la carpeta oculta `.git` del repositorio local.
5. Vuelve a GitHub Desktop: deben aparecer cambios como `app.js`, `core/branches.js`, `core/special-recipes.js`, `netlify/functions/recipes.mjs` y `package.json`.
6. Introduce como mensaje `Update v8.4.4: Offhands, Kits and Siege`.
7. Pulsa **Commit to main** y, después, **Push origin**.

Si GitHub Desktop no muestra archivos modificados, estás copiando los archivos a la carpeta equivocada.

## Paso 3. Netlify

- En `https://app.netlify.com` abre el proyecto que publica `endearing-piroshki-ea4758.netlify.app`.
- Ve a `Deploys`. Confirma que el despliegue de la rama `main` esté en `Published`.
- La compilación usa `npm run build`, publica `dist/` y registra funciones desde `netlify/functions/` (configurado en `netlify.toml`).

## Paso 4. Comprobar versión y categorías

- https://github.com/drzjhon-dot/gildem-craft-pro-live/blob/main/package.json → `"version": "8.4.4"`.
- https://endearing-piroshki-ea4758.netlify.app/version.json → `"version": "8.4.4"`.
- https://endearing-piroshki-ea4758.netlify.app/.netlify/functions/health → `"status": "ok"`, `"version": "8.4.4"`.
- En **Plan de crafting**: aparecen `Armaduras`, `Armas`, `Accesorios`, `Manos secundarias`, `Kits` y `Asedio`.
- En **Encontrar oportunidades**: se mantienen las categorías Royal y se añaden Kits/Asedio/Manos secundarias separadas.

Si GitHub ya indica 8.4.4 pero Netlify aún muestra la versión vieja, comprueba el último deploy y realiza un redeploy. Si ambas versiones son 8.4.4 y tu navegador muestra iconos o botones antiguos, recarga con Ctrl+Shift+R y, si fuera necesario, elimina los datos de sitio de esa URL para invalidar el Service Worker antiguo (haz antes una copia de tus preferencias personales, si las usas).
