# Verificación v8.5.0

1. `/version.json` y `/.netlify/functions/health` indican `8.5.0`.
2. La navegación muestra **Black Craft**, **Royal Craft** y **Level Craft**.
3. Royal Craft conserva el selector **Royal + Black Market** y los filtros de fabricación/bono.
4. Level Craft muestra nombres de objetos en español por familia, sin IDs técnicos. Permite elegir spec, fama exacta opcional, presupuesto, mercado y estudio opcional.
5. Genera un plan con una receta de fama conocida: no debe exceder el presupuesto bruto de una ronda ni el Focus disponible. El modo Estudiar no debe mostrar destinos de venta para las unidades destruidas.
6. Si la fama estimada no alcanza el objetivo, debe mostrar **plan parcial**, no un mensaje de éxito.
7. Comprueba visualmente las categorías y las listas con datos reales de AODP. Las pruebas automáticas usan precios simulados; no verifican liquidez real.
