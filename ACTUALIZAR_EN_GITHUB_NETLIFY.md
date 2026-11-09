# Cómo actualizar Gildem Craft Pro v8.1 en tu página de Netlify

**Tu página actual:** https://endearing-piroshki-ea4758.netlify.app/  
**Repositorio:** https://github.com/drzjhon-dot/gildem-craft-pro-live

No crees otro sitio ni otro repositorio. **La dirección se conservará** si ese es el repositorio asociado al proyecto actual de Netlify.

## Método recomendado: GitHub Desktop

1. Si todavía no tienes GitHub Desktop, instálalo desde https://desktop.github.com/ e inicia sesión con tu cuenta.
2. En GitHub Desktop usa **File → Clone repository** y selecciona `drzjhon-dot/gildem-craft-pro-live`.
3. Descarga y descomprime `Gildem_Craft_Pro_v8_1_GITHUB_NETLIFY.zip`.
4. Copia **el contenido descomprimido**, no el ZIP, dentro de la carpeta local clonada. Acepta reemplazar los archivos con el mismo nombre. **No borres ni reemplaces la carpeta oculta `.git`**.
5. En GitHub Desktop verás los archivos modificados. Escribe `Update Gildem Craft Pro v8.1` y pulsa **Commit to main**.
6. Pulsa **Push origin**.
7. En https://app.netlify.com/ abre el proyecto `endearing-piroshki-ea4758` y entra en **Deploys**. Netlify ejecutará el build automáticamente.
8. Comprueba que el deploy indique **Published**.

## Configuración de Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions` (incluido en `netlify.toml`)
- Base directory: vacío
- Production branch: `main`
- Node.js: `22`

**No subas el ZIP a Netlify Drop**: ese método no despliega las funciones del servidor.

## Comprobaciones después de publicar

1. https://endearing-piroshki-ea4758.netlify.app/version.json → versión `8.1.0`.
2. https://endearing-piroshki-ea4758.netlify.app/.netlify/functions/health → debe incluir `"status":"ok"`.
3. Abre **Plan de crafting → Pociones**. Verifica familias como resistencia, gigantismo, ácido, tornado en botella y recolección.
4. Abre **Plan de crafting → Botas de placas → Refinar materiales antes del crafting**. Prueba `Comparar y refinar si ahorra silver`, completa los costos reales del taller, genera el plan y revisa el detalle de refinado y compras.
5. Abre la pestaña independiente **Encontrar oportunidades** y confirma que se puede analizar sin alterar el plan manual.
6. Revisa los avisos de cotizaciones antiguas y verifica precios en el juego antes de invertir.

Si sigues viendo una versión anterior, recarga forzada (`Cmd+Shift+R` en Mac, `Ctrl+F5` en Windows) y, si es necesario, borra los datos del service worker de la página. **Exporta primero un respaldo de Mi negocio** para evitar perder datos guardados localmente.

Si Netlify muestra Failed, abre **Deploys → el deploy fallido → Deploy log** y copia el error completo. No cambies las dependencias por versiones inventadas: el paquete ya fija las versiones probadas de forma local.
