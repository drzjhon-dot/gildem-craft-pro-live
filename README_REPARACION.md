# Gildem Craft Pro | Reparación Netlify (v8.5.5)

**Problema confirmado en GitHub:** `package.json` y la interfaz siguen en v8.5.2; las pruebas de v8.5.4 y v8.5.5 ya fueron añadidas. Esto produce 4 fallos en Netlify. **No elimines los tests**.

## Windows (lo más fácil)
1. Abre **GitHub Desktop** y selecciona tu repo `drzjhon-dot/gildem-craft-pro-live`. Ve a **Repository → Show in Explorer** para abrir la carpeta local. Si no tienes copia, haz **Clone** primero.
2. Extrae **este ZIP en otra carpeta**, no dentro del repo.
3. Arrastra **la carpeta del repositorio completa** sobre `REPARAR_NETLIFY_WINDOWS.bat`.
4. El programa crea una copia de ensayo, aplica las actualizaciones 8.5.3, 8.5.4 y 8.5.5 (según necesite), verifica los controles, ejecuta `npm run build` y **solo entonces** copia los archivos reparados al repo.
5. En GitHub Desktop, **Commit to main** y después **Push origin**. Comprueba en la web de GitHub que `app.js` contiene `function resultsPage(){`, `index.html` contiene `data-nav="resultados"` y `package.json` ahora dice 8.5.5.
6. Netlify debe detectar el nuevo commit y compilar. En caso de duda, utiliza **Deploys → Trigger deploy → Clear cache and deploy site**.

Requisitos: **Python 3**, **Node.js 22** y **npm**. La herramienta instala dependencias con `npm ci` dentro de la copia de ensayo si las necesita; por tanto, esa fase requiere Internet.

En Mac/Linux ejecuta: `python3 REPARAR_NETLIFY.py /ruta/a/gildem-craft-pro-live`.

### Seguridad
- Nunca se elimina tu `.git` ni los datos del navegador.
- La reparación preserva los scripts y Netlify Functions que ya tienes.
- Respaldo de archivos reemplazados: `.gildem-respaldo-antes-rescate-<fecha>/`.
- **No publiques** backups, `node_modules` ni `dist`. Si aparecen en GitHub Desktop, agrégalos a `.gitignore` o desmárcalos.
- Si las pruebas fallan, **el código original no se toca**. Comparte `DIAGNOSTICO_EJECUCION.txt`.
- No es una aplicación completa. Es un corrector específico para el estado actual del repositorio.

### Por qué falló
GitHub tenía tests de v8.5.4/8.5.5 pero no los cambios de `app.js` y `index.html`. El instalador v8.5.5 anterior no aceptaba que los archivos nuevos como `core/results-view.js` y los tests existieran previamente, y se detenía sin actualizar la interfaz. Este paquete permite reparar ese estado mixto.
