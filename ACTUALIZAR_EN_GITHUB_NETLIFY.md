# Actualizar Gildem Craft Pro a v8.2.0 sin cambiar la URL

**Página actual:** https://endearing-piroshki-ea4758.netlify.app/  
**Repositorio GitHub:** https://github.com/drzjhon-dot/gildem-craft-pro-live

No crees un repositorio nuevo ni otro sitio en Netlify. El ZIP es **código fuente para GitHub**, no un paquete de Netlify Drop.

## Método recomendado: GitHub Desktop

1. Descarga y descomprime `Gildem_Craft_Pro_v8_2_GITHUB_NETLIFY.zip` en tu computadora.
2. Abre **GitHub Desktop** (https://desktop.github.com/). Usa **File → Clone repository** si no tienes el repositorio clonado y selecciona `drzjhon-dot/gildem-craft-pro-live`.
3. En GitHub Desktop, usa **Repository → Show in Finder/Explorer** para abrir la carpeta clonada.
4. Copia **los archivos y subcarpetas DENTRO del ZIP descomprimido** a esa carpeta del repositorio. Debes reemplazar `app.js`, `index.html`, `styles.css`, `sw.js`, `package.json`, carpetas `core`, `netlify`, `scripts` y `tests`, y los archivos de documentación. **No copies el ZIP como archivo único, y no coloques una carpeta anidada llamada `Gildem_Craft_Pro_v8_2`.** No borres la carpeta oculta `.git`.
5. Confirma que en la **raíz** del repositorio estén `package.json`, `index.html`, `netlify.toml` y las carpetas `core`, `netlify`, `scripts`, `tests`.
6. GitHub Desktop mostrará los cambios. Escribe `Gildem Craft Pro v8.2: filtros y refinamiento` → **Commit to main** → **Push origin**.
7. En https://app.netlify.com/ abre el proyecto existente `endearing-piroshki-ea4758`, pestaña **Deploys**, y comprueba que el despliegue del último commit quede como **Published**.

Netlify utiliza `npm run build`, publica `dist` y despliega las funciones de `netlify/functions`. La rama de producción debe ser `main` y Node.js 22. No necesitas arrastrar archivos a Netlify ni ejecutar `npm install` manualmente.

## Comprobación de la actualización

1. Abre https://endearing-piroshki-ea4758.netlify.app/version.json y confirma que diga **`"version": "8.2.0"`**.
2. Abre https://endearing-piroshki-ea4758.netlify.app/.netlify/functions/health y confirma **`"status": "ok"`** y versión **8.2.0**.
3. Recarga la página con `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac). En el menú solo debe aparecer **Plan de crafting**, **Encontrar oportunidades**, **Ajustes y datos**.
4. En **Plan de crafting**, selecciona una rama y busca **Elegir objetos específicos** y **Refinamiento de materiales**. Elige algunas variantes y genera un plan.
5. En **Encontrar oportunidades**, selecciona categorías y **Solo las ramas que yo marque**. Marca ramas, luego cambia **Elegir objetos específicos → Solo los objetos que yo marque**, ajusta tiers/encantamientos, activa el refinamiento y ejecuta el escáner.
6. Prueba **Monturas** y confirma que aparecen tipos específicos cuando se cargan las recetas del servidor. Si no aparecen, revisa `/.netlify/functions/recipes`.

Si `/version.json` sigue siendo una versión antigua, **Netlify no ha publicado la v8.2 en esa URL**. Comprueba que estás editando el repo y rama correctos, y mira el Deploy log.

**Datos personales:** si guardaste inversiones o inventario en el navegador, exporta un respaldo antes de borrar cookies, almacenamiento de sitio o service workers. Cambiar de dominio tampoco transfiere localStorage automáticamente.

**Si el deploy falla**, ve a **Deploys → Deploy log**, copia las líneas del primer error y compártelas. No cambies versiones de dependencias por valores no publicados.
