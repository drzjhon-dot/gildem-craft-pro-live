# GILDEM CRAFT PRO — INSTALACIÓN LIMPIA

**Versión:** 7.4.3 · **Servidor por defecto:** América (West) · **Destino:** GitHub + Netlify.

Este ZIP contiene el **código fuente completo**, no solo la carpeta de publicación. Contiene `package.json`, `netlify.toml`, `netlify/functions`, `core`, iconos, pruebas y scripts.

## 1. Crear un nuevo repositorio GitHub

1. Abre https://github.com/new e inicia sesión.
2. Escribe el nombre `gildem-craft-pro-live` (o uno disponible).
3. Selecciona **Private** si prefieres no publicar el código; también sirve **Public**.
4. **NO** marques las opciones de generar README, .gitignore o licencia.
5. Haz clic en **Create repository**.
6. En la página de repositorio vacío, selecciona **uploading an existing file** o **Add file > Upload files**.
7. **Descomprime este ZIP** y **arrastra su contenido** (archivos y carpetas, no el ZIP ni una carpeta adicional) al navegador. Comprueba que se vean en la raíz `package.json`, `netlify.toml`, `index.html` y las carpetas `core` y `netlify`.
8. Pulsa **Commit changes** en la rama `main`.

## 2. Crear un proyecto NUEVO en Netlify

1. Ve a https://app.netlify.com/.
2. **Add new project > Import an existing project**.
3. Elige **GitHub**, autoriza Netlify y selecciona el repositorio nuevo `gildem-craft-pro-live`.
4. Selecciona `main` como rama de producción.
5. Configuración:
   - Base directory: **dejar vacío**.
   - Build command: `npm run build`.
   - Publish directory: `dist`.
   - Functions directory: `netlify/functions` (ya en `netlify.toml`).
   - Node.js: `22` (ya en `.nvmrc` y `netlify.toml`).
6. Pulsa **Deploy / Publish**. En Netlify, abre **Deploys** y espera hasta que el despliegue quede en **Published**.

**Importante:** Como se está creando un sitio nuevo, obtendrás una nueva URL `.netlify.app`. No pruebes la URL antigua hasta que migres el dominio.

## 3. Verificar la nueva URL

Sustituye `TU-NUEVO-SITIO.netlify.app` por el dominio que Netlify te asigne y comprueba:

1. `https://TU-NUEVO-SITIO.netlify.app/version.json` debe mostrar `"version": "7.4.3"`.
2. `https://TU-NUEVO-SITIO.netlify.app/.netlify/functions/health` debe mostrar `"status": "ok"` y `"functions": true`.
3. Abre `/` y entra en **Plan de crafting**, selecciona una rama, carga un plan y revisa las fechas de los precios.
4. Si quieres, comprueba las funciones `/.netlify/functions/recipes` y `/.netlify/functions/snapshot?region=west`. La de recetas puede tardar; snapshot puede devolver 404 antes de la primera ejecución horaria.

## 4. Si falla el build

En **Deploys > Failed deploy > Deploy log**, copia **desde el primer `npm error` o `Error` y 12 líneas siguientes**. No cambies `package.json` manualmente.

Si aparece `ETARGET` para `@netlify/otel`, comprueba que tu GitHub tenga exactamente `"@netlify/blobs": "11.1.7"` y `"@netlify/otel": "7.0.6"` en `overrides`. La versión `7.0.7` fue la causa del fallo anterior y no está fijada aquí.

## 5. Datos y privacidad

- Esta es una instalación nueva. **No copia** las inversiones y registros que guardaste en el navegador de la web antigua.
- Antes de abandonar la vieja web, exporta el respaldo desde **Ajustes**. Luego impórtalo en la nueva, si tienes registros que conservar.
- Consulta cotizaciones AODP; su actualización horaria no garantiza observaciones nuevas del mercado.
- El catálogo se actualiza a partir de datos públicos del juego; el día de un parche, verifica recetas y precios antes de invertir silver.

**Archivos recomendados:** README.md (detalles técnicos) y VERIFICAR_DESPLIEGUE.md (diagnóstico). No hay contraseñas ni tokens en este paquete.
