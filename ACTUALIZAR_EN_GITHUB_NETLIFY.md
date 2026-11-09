# Actualizar Gildem Craft Pro a v8.4.6 (mismo Netlify)

1. Descarga y extrae `Gildem_Craft_Pro_v8_4_6_GITHUB_NETLIFY.zip`.
2. Abre en **GitHub Desktop** el repositorio `drzjhon-dot/gildem-craft-pro-live` y copia el contenido extraído a su carpeta local. Conserva `.git` y reemplaza los archivos anteriores. No copies ningún directorio `dist` ni `node_modules`.
3. Haz **Commit to main** y luego **Push origin**.
4. En Netlify → Deploys confirma **Published**. No necesitas crear otro proyecto ni cambiar tu URL.
5. Comprueba `https://endearing-piroshki-ea4758.netlify.app/version.json` (versión `8.4.6`) y `/.netlify/functions/health` (`status: ok`).
6. Si ves el diseño anterior, recarga con **Ctrl + Shift + R** o cierra y vuelve a abrir la PWA.

También puedes usar GitHub **Add file → Upload files**: el ZIP limpio tiene menos de 100 archivos. Sube el **contenido de la carpeta descomprimida**, no el ZIP cerrado ni una carpeta adicional. Conserva las rutas `core/`, `netlify/functions/`, `scripts/` y `tests/` en GitHub.

Prueba dentro de la web: **Encontrar oportunidades → ¿Dónde fabricar? → Martlock**. Un objeto cuya especialidad no es Martlock no debe recibir su bono de especialidad. En el selector de familias ya no debe aparecer el `4.4` arbitrario ni el ID `T4_...` bajo el nombre.
