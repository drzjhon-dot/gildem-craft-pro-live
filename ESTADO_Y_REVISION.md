# Diagnóstico GitHub / Netlify

Fuente revisada: `drzjhon-dot/gildem-craft-pro-live`, rama `main`, el 10/11/2026.

| Archivo | Estado observado en `main` antes de reparar |
| --- | --- |
| `tests/v8_7_1-demand-first.test.mjs` | Nuevo test presente (falla solo el test de integración) |
| `tests/v8_7_2-ao-bin-dumps.test.mjs` | Test adicional presente |
| `core/always-plan.js` | Ya contiene motor basado en actividad observada |
| `core/ao-gear-recipes.js` | Extractor RAW ya presente |
| `app.js` | ANTIGUO; carece de `GCP_DEMAND_FIRST_871`, `draftPlanForLedger`, UI demanda y botones |
| `scripts/build.mjs` | ANTIGUO; carece de integración `GCP_AO_DUMPS_GEAR_872` |
| `scripts/check-deploy.mjs` | ANTIGUO; aún no impone integridad del motor demand-first |

La solución correcta es **un único commit que integre los tres archivos críticos** y conserve los módulos y pruebas. No basta con insertar `const GCP_DEMAND_FIRST_871 = true` sin implementar la funcionalidad.

Límites de datos: `ao-bin-dumps` contiene datos estáticos del juego, no transacciones reales; el histórico AODP son observaciones de actividad y no garantiza ventas; las cotizaciones tienen fecha y pueden ser incompletas. El motor no debe declarar ganancia garantizada ni profundidad de órdenes inventada.
