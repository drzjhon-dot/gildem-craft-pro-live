# Gildem Craft Pro v9.0.0

## Archivos directos para GitHub, sin instaladores

Este ZIP es una **actualización por reemplazo** para el repositorio existente
`drzjhon-dot/gildem-craft-pro-live`. No es una copia independiente de los más de
170 archivos de la aplicación y no debe usarse para borrar/recrear el repositorio.

El ZIP contiene las rutas EXACTAS que debes copiar/combinar en la raíz del
repositorio. Todos los demás archivos actuales, especialmente `app.js`,
`styles.css`, los módulos `core/`, los datos y `netlify.toml`, deben conservarse.

### Subir usando GitHub Desktop (recomendado)

1. Abre GitHub Desktop y selecciona `gildem-craft-pro-live`.
2. Selecciona **Repository > Show in Explorer**.
3. Abre el ZIP y copia **su contenido** (los archivos y carpetas, NO una carpeta
   externa con el nombre del ZIP) a la raíz del repositorio.
4. Confirma **Reemplazar archivos** para `index.html`, `package.json`, `sw.js`,
   `manifest.webmanifest`, `scripts/build.mjs`, `scripts/check-deploy.mjs`,
   `tests/v7_2.test.mjs`, `tests/v8_4_2-gathering-tools.test.mjs` y
   `netlify/functions/health.mjs`.
5. La carpeta nueva `v9/` y los tests v9 deben aparecer también en GitHub Desktop.
6. Revisa que estén seleccionados los cambios. Haz **Commit** y luego **Push**.
7. Netlify ejecuta `npm run build`; sus resultados te confirmarán si el proyecto
   completo pasó las pruebas.

Para subir desde la web de GitHub, usa **Add file > Upload files** y respeta las
rutas de carpetas (`scripts/`, `netlify/functions/`, `tests/` y `v9/`). No subas
un ZIP como un archivo dentro del repositorio: GitHub no lo descomprime.

### Qué cambia

- Nombre/version visibles: 9.0.0.
- La sección de fabricación de Resultados usa filas compactas con icono,
  tier, cantidad editable, actividad, capital y profit.
- La sección de materiales y diarios usa una tabla compacta ordenada por tier.
- Los planes por actividad también muestran dos tablas, una de fabricación
  y otra de compras. La información adicional queda expandible.
- Orden ascendente T4.0, T4.1, T4.2, T5.0, T5.1, etc.
- Se conserva `app.js`: **no se alteran cálculos ni la lógica del motor**.
- Los archivos v9 se copian a `dist/` y al caché del service worker.
- Netlify mantiene las pruebas obligatorias y verifica la presencia de la UI
  v9 en el resultado compilado.

### Verificación realizada

- 15/15 pruebas específicas de v9 pasaron.
- Se actualizaron dos pruebas antiguas que fijaban el caché a la versión 8.7.0:
  ahora comparan contra la versión actual del proyecto, sin omitirlas.
- Pasó un build de empaquetado con un proyecto de prueba y su verificación `dist`.
- Se revisaron 15 marcadores críticos de integración en `app.js` y `styles.css`
  de `main` en GitHub, con 15/15 coincidencias.
- **No se ha ejecutado la suite completa sobre una copia local auténtica de
  GitHub.** Netlify deberá validarla al recibir la actualización.

### Diagnóstico si falla Netlify

Abre el deploy, busca el **primer** `not ok`, `AssertionError`, `ERR_`, `SyntaxError`
o `PRECHECK` antes de las líneas finales `build.command failed`. Copia ese
fragmento. `exit code 1` por sí solo no identifica el error.

Esta actualización NO requiere Python ni scripts de generación en tu computadora.
Netlify seguirá usando Node 22, como ya establece el proyecto.
