# Gildem Craft Pro · Reparación definitiva de integración Netlify

## Error observado el 10 de noviembre de 2026

El código publicado en GitHub `drzjhon-dot/gildem-craft-pro-live/main` todavía tenía `app.js` de la versión anterior. El repositorio sí recibió `tests/v8_7_1-demand-first.test.mjs`, `core/always-plan.js`, `core/ao-gear-recipes.js` y la prueba adicional 8.7.2. Por eso Netlify tenía **311/312 pruebas correctas** y fallaba la n.º 306: el test exigía `GCP_DEMAND_FIRST_871` en `app.js`, y no estaba. También faltaba completar `scripts/build.mjs` para integrar `ao-bin-dumps`.

**No se corrige quitando el test ni agregando solo una marca.** Esta reparación aplica toda la interfaz, compras, presupuestos e integración de recetas juntas. No desactiva los tests de Netlify.

## Camino simple (Windows)

1. Instala [Python 3](https://www.python.org/downloads/) y [Node.js 22](https://nodejs.org/). Si no tienes Git, instala [Git for Windows](https://git-scm.com/downloads/win); el BAT también busca el Git integrado de GitHub Desktop.
2. Abre GitHub Desktop y abre el repositorio **`drzjhon-dot/gildem-craft-pro-live`**. Si no lo tienes en el PC, clónalo desde GitHub Desktop.
3. En GitHub Desktop pulsa **Repository > Show in Explorer** y copia la ruta de la carpeta. Asegúrate de que contiene `app.js`, `core/`, `tests/` y `package.json`.
4. Extrae **todo el ZIP** en Descargas u otra carpeta **fuera del repositorio**.
5. Haz doble clic en **`REPARAR_Y_PUBLICAR_EN_GITHUB.bat`**, pega la ruta y pulsa Enter.
6. El instalador exige repositorio limpio y sincronizado con `main` en GitHub. Aplica TODOS los cambios en conjunto y ejecuta: `node --check`, `npm test` y `npm run build`. Si un test falla, restaura el código anterior y **NO hace push**. Si pasa, verifica los marcadores, crea un solo commit y envía `git push origin main` a tu propio GitHub.
7. En Netlify abre el nuevo despliegue tras el push. Busca los resultados de todas las pruebas y **Deploy succeeded**. La publicación **no está confirmada** hasta verlo en Netlify.

### Otra opción

Si no quieres que el script haga commit y push, usa `REPARAR_SIN_PUBLICAR.bat`. Una vez diga `REVISIÓN OK`, haz **Commit** y **Push origin** desde GitHub Desktop, comprobando que `app.js`, `scripts/build.mjs` y `scripts/check-deploy.mjs` están incluidos.

**Muy importante:** no subas por separado solamente `core/` o `tests/`, ni el propio ZIP como un archivo dentro del repositorio. Eso reproduce exactamente el fallo. Tampoco desactives pruebas para que el sitio parezca sano.

## Qué cambia realmente

* **Black Craft y Royal Craft:** generan resultados priorizados por **actividad observada** de cada artículo en su mercado de destino, no por beneficio mínimo. Muestran tier, unidades, precio estimado, capital, materiales, retorno y **beneficio o pérdida**. Los precios de equilibrio son informativos. Se añade advertencia si la actividad/precio no son actuales o son incompletos.
* **Riesgo y logística:** límites de exposición por objeto y presupuesto, máximo prudente respecto al historial observado, inventario pendiente ya registrado en Mi negocio, compras de materiales no reservadas, advertencia de posible deslizamiento al comprar varias unidades. Los lotes estimados con pérdidas se limitan aún más. No se garantiza venta o beneficio.
* **Mi negocio:** guardar un plan basado en actividad como borrador **NO descuenta silver**. Registrar una compra requiere confirmación expresa de haberla realizado. Una ruta sin precio y coste suficiente no puede guardarse como compromiso real.
* **ao-bin-dumps:** se incorpora `core/ao-gear-recipes.js` para extraer recetas de equipo de `items.json` **RAW** durante la construcción Netlify. Si GitHub/CDN no está disponible, conserva el catálogo legítimo de respaldo. No interpreta `formatted/items.json` como recetas ni inventa bonos. Las recetas especiales ya usaban el dump original.
* **Pruebas:** test 306 permanece en el repositorio, junto a verificaciones nuevas de la integración. `scripts/check-deploy.mjs` impide volver a subir pruebas de demanda sin `app.js` actualizado.

## Qué se verificó

* Estado del repositorio público **leído directamente de GitHub**: el `app.js` antiguo era el culpable y los demás archivos estaban solo parcialmente integrados.
* El instalador de este paquete pasó sintaxis, preflight, `npm test` y `npm run build` **en un repositorio de prueba sintético**. Las 16 pruebas dirigidas de demanda/catálogo pasaron en esa instalación de prueba.
* No se ha clonado ni compilado el repositorio completo real dentro del entorno del asistente. **Esta reparación verifica la copia real antes de permitir publicar**. Nunca se debe presentar el sitio como ya reparado hasta que se ejecute y Netlify confirme `Deploy succeeded`.
* La conexión GitHub para esta sesión **respondió HTTP 403** al intentar crear una rama. No se hicieron commits remotos desde ChatGPT.

## Si el script se detiene

* **Repositorio tiene cambios sin confirmar:** guarda/commitea esos cambios primero desde GitHub Desktop; vuelve a ejecutar. Se evita mezclar trabajos anteriores.
* **Main atrasado/divergente:** usa Fetch/Pull en GitHub Desktop antes de ejecutar.
* **No se pudo ejecutar Node o Python:** instala Node.js 22 y Python 3 y reinicia la terminal.
* **Tests/build fallidos:** el instalador restaura los archivos anteriores y guarda `revision-log.txt` en una carpeta de respaldo fuera del repositorio. No hagas push.
* **Commit local completado pero GitHub rechazó el push:** abre GitHub Desktop y pulsa Push origin. No copies archivos aislados.
* **Netlify muestra la misma prueba de `GCP_DEMAND_FIRST_871`:** comprueba en GitHub que `main/app.js` incluye el marcador y que Netlify construye **ese mismo commit**.
