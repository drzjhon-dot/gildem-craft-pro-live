# QA REPORTE · Gildem Craft Pro NOVA v9.0 (ajuste 3 tabs + ramas visuales + diarios)

## Cambios aplicados
- Eliminados los tabs **Analizador** y **Mi negocio** de la navegación principal.
- Navegación final: **Black Craft**, **Royal Craft**, **Datos y ajustes**.
- Reemplazado el dropdown de **Rama** por una **selección visual con tarjetas e iconos**.
- Añadida sección de **Diarios sugeridos** en cada plan de crafting.
- Ajustado el motor conservador para no forzar el uso completo del presupuesto cuando no hay rutas prudentes.
- Se mantienen descartados los artículos que sólo permiten **1 sola fabricación**.
- Mejoradas las tarjetas de tabs para dar más vida a la interfaz.

## Verificaciones ejecutadas
- `npm test` → **115/115 pruebas superadas**
- `npm run build` → **OK**
- Revisión estructural:
  - `index.html` usa únicamente 3 tabs válidos.
  - `src/app.mjs` enruta únicamente a Black Craft, Royal Craft y Datos y ajustes.
  - `src/ui.mjs` contiene selector visual de ramas y tabla de diarios.
  - `src/engine.mjs` calcula diarios sugeridos por lote y mantiene mínimo de 2 fabricaciones.

## Notas funcionales
- Los **diarios** se muestran como **sugerencia por lote**, calculados por la disciplina dominante de materiales. Deben confirmarse dentro del juego antes de comprar.
- La app **no rellena artificialmente** el presupuesto si no encuentra suficientes oportunidades prudentes.
- Los precios y movimiento siguen dependiendo de AODP West; si faltan datos, no se inventan resultados.
