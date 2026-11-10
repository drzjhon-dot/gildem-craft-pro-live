# Actualizar Gildem Craft Pro a v8.7.0 desde Windows

- Si en GitHub `package.json` indica 8.6.8, usa el ZIP **DESDE_8_6_8**.
- Si ya instalaste v8.6.9, usa el ZIP **DESDE_8_6_9**.
- Si no sabes tu versión local, utiliza el ZIP completo copiando su CONTENIDO sobre una copia limpia del repositorio.

1. Abre GitHub Desktop. Si hay un Merge en curso, resuélvelo o cancélalo antes de reemplazar archivos. Haz una copia de seguridad de tus cambios locales.
2. Selecciona el repositorio y haz Fetch origin/Pull origin sobre main.
3. Pulsa Repository > Show in Explorer.
4. Descomprime el ZIP apropiado y COPIA las carpetas y archivos que están DENTRO, no la carpeta contenedora. Acepta reemplazar.
5. En GitHub Desktop, Commit to main y Push origin.
6. Verifica Published en Netlify. Recarga la web con Ctrl+Shift+R.

Esta versión agrega el módulo `core/always-plan.js`; debe viajar junto con app.js y sw.js.
**IMPORTANTE:** el plan condicionado NO autoriza compra de materiales ni presupone ventas. Para obtener un plan real, actualiza y verifica cotizaciones West.
