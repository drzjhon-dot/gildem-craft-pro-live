# Instalación de v8.6.3 en GitHub Desktop (Windows)

1. Abre GitHub Desktop en `gildem-craft-pro-live` y selecciona main. Si ves conflictos, **Abort Merge** antes de continuar. Haz Fetch origin y Pull origin.
2. Extrae `Gildem_Craft_Pro_v8_6_3_SOLO_CAMBIOS.zip` y copia todos los archivos y carpetas de su interior dentro de la raíz del repositorio (donde están `app.js` y `package.json`). Acepta reemplazar.
3. Verifica que GitHub Desktop muestre cambios en `app.js`, `core/market-proof.js` y en otros archivos.
4. Commit to main → Push origin. No subas 100+ archivos desde la web.
5. Comprueba GitHub Actions y el despliegue Netlify. Recarga la web en Windows con Ctrl+Shift+R.

Si tu base no es 8.6.2, usa el ZIP COMPLETO en lugar de SOLO CAMBIOS. No copies `dist/` al repositorio: Netlify lo genera.

# Publicar Gildem Craft Pro v8.6.2 en GitHub Desktop

**Recomendación por los conflictos anteriores:** si GitHub Desktop muestra un Merge activo, cancélalo y haz respaldo de la carpeta antes de continuar. Pulsa **Fetch/Pull** para tener `main` actualizado y, después, copia en la carpeta raíz del repositorio los archivos extraídos de este ZIP. Comprueba que `package.json` marque 8.6.2, haz Commit y Push. Nunca selecciones "resolver automáticamente" los conflictos de `app.js` o `index.html` mezclando dos versiones: eso puede impedir que arranque la web. El ZIP contiene el proyecto íntegro; no subas el archivo ZIP como si fuera el código del sitio. GitHub Desktop evita el límite de 100 archivos de la carga web. Si ya tienes cambios locales sin publicar, guárdalos primero; no hagas Force Push.


## Pasos sin Python ni PowerShell

1. Descarga **Gildem_Craft_Pro_v8_6_0_DEMANDA_PRIMERO_BM_ROYAL_GITHUB_NETLIFY.zip** y elige **Extraer todo** en Windows.
2. Abre **GitHub Desktop**, selecciona **drzjhon-dot/gildem-craft-pro-live** y pulsa **Fetch origin / Pull origin** si aparecen actualizaciones.
3. En el menú superior abre **Repository → Show in Explorer**. Esa es la carpeta REAL del repositorio.
4. Abre en otra ventana la carpeta extraída del ZIP. **Entra hasta ver `app.js`, `index.html`, `package.json`, `core`, `assets`, `netlify`, `.github` y `tests` juntos.**
5. Dentro de esa carpeta, pulsa **Ctrl + A** para seleccionar todos los archivos; después **Ctrl + C**. Vuelve a la carpeta del repositorio y pulsa **Ctrl + V**, eligiendo **Reemplazar archivos**.
6. Regresa a GitHub Desktop → **Changes**. Comprueba los archivos modificados `app.js`, `index.html`, `core/demand-first.js`, `core/external-demand.js`, `core/adaptive-planner.js`, `core/allocator-v6.js`, `styles.css`, `sw.js`, `package.json`, `tests/`.
7. En **Summary** escribe `Gildem Craft Pro v8.6.2 · demanda 14 días BM y Royal`. Pulsa **Commit to main → Push origin**.
8. Abre https://github.com/drzjhon-dot/gildem-craft-pro-live/actions y espera una ejecución verde de **Gildem Craft Pro | Validar proyecto completo**.
9. Abre Netlify y comprueba **Published** para ese nuevo commit. En tu web pulsa **Ctrl + Shift + R** una sola vez.

## Validación rápida

- En GitHub, `package.json` debe indicar `"version": "8.6.2"`.
- Las tabs visibles son **Black Craft**, **Royal Craft** y **Resultados**. Level Craft se mantiene fuera del menú.
- En Black Craft → Botas de placas, activa **.0** y **T4/T5/T6**; busca el control plegable **Horizonte de venta por órdenes: 7/14/30 días**.
- En Resultados, debajo de cada objeto, deben aparecer **uds./día · fuente · límite de crafts**.
- En Ajustes → **Estadísticas externas de volumen**, podrás pegar un ranking de Albion Hub o Albion Journal, elegir región/mercado/fecha e importarlo.
- `netlify.toml` utiliza `npm run build`, Node 22 y publica `dist/`.

## Si no se actualiza

No vuelvas a subir instaladores ni a ejecutar Python. Comprueba primero que hiciste **Push origin**, no solo **Commit**, y que Netlify compiló ese mismo commit. Si falla, copia los logs de esa nueva ejecución.

La automatización de GitHub **solo valida**, nunca reescribe tus archivos. No necesitas borrar datos del navegador, ya que las inversiones locales pueden perderse. Usa primero **Reparar carga** si solo falla la caché.
