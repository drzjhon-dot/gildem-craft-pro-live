# SUBIR GILDEM CRAFT PRO A GITHUB DESDE WINDOWS

## Pasos fáciles con GitHub Desktop

1. Descarga `Gildem_Craft_Pro_v8_5_5_PROYECTO_COMPLETO_VERIFICADO_GITHUB.zip` y usa **Extraer todo** en Windows.
2. Abre **GitHub Desktop** y elige el repositorio `drzjhon-dot/gildem-craft-pro-live`.
3. Pulsa **Repository → Show in Explorer** (Repositorio → Mostrar en el Explorador). Aparecerá la carpeta actual del repositorio.
4. Abre **otra ventana** con la carpeta extraída del ZIP. **Entra dentro de esa carpeta**, hasta ver `app.js`, `index.html`, `package.json`, `core`, `netlify`, `assets` y `.github`.
5. Pulsa **Ctrl + A → Ctrl + C** para seleccionar y copiar TODOS los archivos y carpetas extraídos.
6. Vuelve a la ventana de la carpeta de GitHub Desktop. Pulsa **Ctrl + V** y acepta **Reemplazar los archivos en el destino** si Windows lo solicita. **No copies el ZIP como archivo ni lo metas dentro de una subcarpeta.**
7. Vuelve a GitHub Desktop, pestaña **Changes**. Deben aparecer muchos archivos modificados, especialmente **`app.js`, `index.html`, `styles.css`, `package.json`, `core/market-volume.js` y `.github/workflows/reconstruir-gildem.yml`**.
8. En **Summary** escribe `Gildem Craft Pro 8.5.5 completo y verificado`. Pulsa **Commit to main** y después **Push origin**.
9. Entra a `https://github.com/drzjhon-dot/gildem-craft-pro-live/actions`. Busca la ejecución **Gildem Craft Pro | Validar proyecto completo**. Cuando se vea verde, GitHub confirmó que las pruebas y la compilación pasaron sobre el código publicado.
10. Abre tu sitio de **Netlify**. El mismo commit debe activar el despliegue automático. Comprueba que Netlify diga **Published** y abre la tab **Resultados**.

## Cómo saber si subiste la carpeta correcta

En la página principal de tu repositorio de GitHub, `app.js`, `package.json` e `index.html` deben aparecer directamente en el primer nivel. No deben estar dentro de `Gildem_Craft_Pro_v8_5_5_GITHUB_LISTO/`.

En `package.json` debe aparecer la versión **8.5.5** y en `index.html` debe existir `data-nav="resultados"`.

## ¿Todavía aparecen carpetas antiguas de reparaciones?

Las carpetas `parts/`, `compat/`, `liquidez_v8_5_3/` y los instaladores antiguos no son parte de esta versión final. No afectan la compilación si quedaron en el repositorio, pero puedes eliminarlos después de confirmar que la versión nueva funciona. No borres `core/`, `assets/`, `netlify/`, `scripts/` ni `tests/`.

## Si Netlify sigue fallando

Revisa primero que GitHub Desktop haya hecho **Push origin** y que en GitHub exista `data-nav="resultados"` en `index.html`. Si GitHub Actions está verde pero Netlify falla, guarda el registro nuevo de Netlify; ya no será el problema anterior de los cuatro tests ausentes.
