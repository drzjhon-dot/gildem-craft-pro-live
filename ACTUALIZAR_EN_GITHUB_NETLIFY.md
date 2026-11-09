# Actualizar a v8.4.2 sin cambiar tu página

1. Descomprime el ZIP.
2. Abre GitHub Desktop y clona o selecciona el repositorio `drzjhon-dot/gildem-craft-pro-live`.
3. Copia **todo el contenido** de la carpeta descomprimida a la raíz local del repositorio. Reemplaza archivos anteriores y conserva `.git`. No hace falta subir `dist` (lo compila Netlify).
4. En GitHub Desktop: **Commit to main** y **Push origin**.
5. Abre Netlify > Deploys, espera el estado **Published**.
6. En `https://endearing-piroshki-ea4758.netlify.app/version.json` comprueba `8.4.2`.
7. En `/.netlify/functions/health` comprueba `status: ok`.
8. En Encontrar oportunidades marca Recolección y abre ramas: ahora aparecen Picos, Hachas, Cañas, etc.
9. Si la lista de objetos aparece vacía al principio, permite que carguen las recetas especiales desde el backend y comprueba que las cotizaciones de AODP no estén caducadas.

Un deploy completo podría producir un pequeño intervalo sin datos de recetas mientras se crea el nuevo cache; es normal.
