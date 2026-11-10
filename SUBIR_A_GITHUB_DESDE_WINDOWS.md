# GitHub Desktop → Netlify · v8.6.8

La rama `main` de GitHub estaba en `v8.6.6` al preparar esta actualización.

1. Si GitHub Desktop muestra conflictos, guarda una copia de tu trabajo y cancela el Merge antes de continuar; no hagas Force Push.
2. Haz Fetch origin / Pull en `main` y comprueba que los cambios remotos estén integrados.
3. Descarga el ZIP **SOLO_CAMBIOS_DESDE_8_6_6**, que contiene menos de 100 archivos.
4. Descomprime, abre Repository → Show in Explorer y copia los archivos *dentro* de la raíz del repositorio. Debe existir `app.js` junto a `index.html`, no una subcarpeta que los envuelva.
5. En GitHub Desktop, confirma los cambios, escribe un resumen de commit y haz Commit to main → Push origin.
6. En Netlify confirma el estado `Published`. Recarga la web con Ctrl + Shift + R y comprueba `v8.6.8`.

El ZIP completo es una alternativa si clonas el repositorio en una carpeta nueva y limpia. No subas todos sus archivos mediante el cargador web de GitHub, que puede limitar las operaciones a 100 archivos.
