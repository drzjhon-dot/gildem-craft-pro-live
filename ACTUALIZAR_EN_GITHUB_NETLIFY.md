# Cómo publicar v8.3 sin perder tu página

**No necesitas otra URL.** Tu sitio actual es:

- Repositorio: https://github.com/drzjhon-dot/gildem-craft-pro-live
- Página Netlify: https://endearing-piroshki-ea4758.netlify.app/

## Recomendado: GitHub Desktop

1. Descarga `Gildem_Craft_Pro_v8_3_GITHUB_NETLIFY.zip` y **descomprímelo**.
2. Abre [GitHub Desktop](https://desktop.github.com/) y selecciona el repositorio `drzjhon-dot/gildem-craft-pro-live`. Si aún no lo tienes en tu equipo, usa `File → Clone repository`.
3. En GitHub Desktop, utiliza `Repository → Show in Explorer`. Verás la carpeta local del repositorio.
4. Copia **el contenido** de la carpeta descomprimida de v8.3 dentro de esa carpeta. Confirma **Reemplazar archivos** cuando te lo pida. Copia `app.js`, `styles.css`, `index.html`, `package.json`, `netlify.toml`, las carpetas `core`, `netlify`, `scripts`, `icons` y `tests` y los demás archivos de la raíz. **No borres `.git`.** No subas solo `dist/` ni un ZIP cerrado.
5. Revisa los cambios en GitHub Desktop. Escribe `Update Gildem Craft Pro v8.3` y haz clic en **Commit to main**.
6. Haz clic en **Push origin**. GitHub enviará los archivos a la rama `main`.
7. En [Netlify](https://app.netlify.com/) abre el sitio que ya tienes, entra a **Deploys** y observa la nueva compilación hasta que indique **Published**.

## Ajustes que deben conservarse en Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions` (definido en `netlify.toml`)
- Node.js: `22`
- Base directory: vacío

## Verificación

- https://endearing-piroshki-ea4758.netlify.app/version.json → `"version": "8.3.0"`
- https://endearing-piroshki-ea4758.netlify.app/.netlify/functions/health → `"status": "ok"` y `"functions": true`
- En la pantalla principal, Plan de crafting ya no debe mostrar Recolección, Pociones, Monturas, Comidas ni los botones genéricos «Todas las…».
- En Encontrar oportunidades, la categoría Refinamiento abre un segundo panel para elegir los cinco recursos.

Si ves la versión anterior a pesar de Published: recarga con `Ctrl + Shift + R`, cierra y vuelve a abrir la pestaña y revisa `/version.json` para distinguir un caché antiguo de un deploy incorrecto.
