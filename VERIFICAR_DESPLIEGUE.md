# Comprobación de Gildem Craft Pro v8.1

| Ruta | Resultado esperado | Si da error |
|---|---|---|
| `/` | Plan de crafting y menú con Encontrar oportunidades | Comprueba **Publish directory = dist** |
| `/version.json` | JSON que incluye `"version":"8.1.0"` | Si ves 7.4.3, el cambio no se ha publicado |
| `/.netlify/functions/health` | JSON que incluye `"status":"ok"` | Comprueba despliegue conectado a GitHub y Functions |
| `/.netlify/functions/recipes` | JSON de recetas (puede tardar la primera vez) | Verifica Deploy/Functions Logs y conectividad |
| **Pociones** | 14 familias conocidas, más las añadidas por parches | Pulsa «Actualizar recetas tras parche» |
| **Refinamiento integrado** | Materia cruda, tier anterior, ciudad bonus y detalle de materiales | Comprueba precios observados y tarifas reales |

**No supone que todo el mercado sea en tiempo real:** los datos de AODP dependen de las capturas de jugadores y de cuándo se enviaron. No confundir actividad histórica con ventas confirmadas.
