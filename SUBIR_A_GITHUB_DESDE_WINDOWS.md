# Subir Gildem Craft Pro v8.6.5 con GitHub Desktop

1. Abre GitHub Desktop y comprueba que elegiste `drzjhon-dot/gildem-craft-pro-live` y rama `main`. **No continúes si hay un Merge pendiente.**
2. Haz **Fetch origin** y, si aparece, **Pull origin**. Conserva una copia de seguridad de cambios locales propios.
3. El repositorio de GitHub actualmente declara **8.6.3**: usa `Gildem_Craft_Pro_v8_6_5_ACTUALIZACION_DESDE_8_6_3.zip` (28 archivos). Solo si tu repositorio local está de verdad en **8.6.4**, usa `Gildem_Craft_Pro_v8_6_5_SOLO_CAMBIOS.zip` (23 archivos). Si no puedes determinar la versión, usa el ZIP completo sobre un clon limpio.
4. En Windows, clic derecho al ZIP → **Extraer todo**. Abre la carpeta extraída. Copia sus archivos y carpetas, no el ZIP ni la carpeta envolvente.
5. En GitHub Desktop → **Repository → Show in Explorer**. Pega allí el contenido y elige **Reemplazar archivos**. Debes ver `app.js`, `index.html`, `package.json` y la carpeta `core/` directamente en la raíz.
6. Vuelve a GitHub Desktop → Changes → Summary: `Gildem Craft Pro v8.6.5 Cartera inteligente` → **Commit to main** → **Push origin**.
7. Espera que GitHub Actions y Netlify terminen. Revisa `package.json` versión `8.6.5`, abre tu web, recarga con Ctrl+Shift+R y prueba ambos formularios.

### Uso recomendado

- Marca un presupuesto, rama y destinos (Royal). Cartera inteligente opera automáticamente.
- **Reservar 15%** está activado por defecto, lo puedes desmarcar. «Usar todo» nunca desactiva la protección del 12% por objeto.
- Si ya tienes artículos sin vender, registra tu inversión en «Mi negocio» y márcala como iniciada. A partir de entonces se descontarán las unidades que sigan pendientes en cada mercado.
- En Resultados diferencia **lista del plan objetivo** de **primera compra orientativa**. Una primera compra de 0 significa falta de órdenes suficientemente verificadas al precio permitido; no es una recomendación de gastar.
- Siempre utiliza «Verificar antes de comprar» y revisa los precios en el juego.

### Alcance de las comprobaciones

`npm run build` pasó con 265/265 pruebas en el entorno de creación. Las APIs de mercado reales y el resultado desplegado en Netlify todavía requieren comprobación después de publicar.
