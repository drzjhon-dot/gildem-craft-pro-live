# Auditoría técnica del despliegue y motor de crafting

| Área | Problema verificado | Mitigación de esta entrega | Limitación residual |
|---|---|---|---|
| Netlify build | Un test nuevo requería una función que `app.js` aún no tenía | Instalador transaccional de implementación + tests, preflight obligatorio, rollback si falla | Requiere ejecutar instalador local antes del commit |
| Selección inicial | `core/viability.js`, `core/adaptive-planner.js`, `core/high-volume.js` usan `profit > 0` como filtro del motor tradicional | El nuevo resultado visible se crea directamente desde recetas, costos e historial y se escoge por actividad | Subsistemas antiguos de optimización por ROI se conservan para sus rutas rentables; no se eliminan |
| Inventario pendiente | El motor alternativo podía volver a proponer los mismos artículos ya pendientes | Se resta inventario del mercado exacto consultando `pendingUnitsByMarket(loadPortfolios())` | Inventario físico no registrado no se conoce |
| Volumen / ventas | Las observaciones de AODP pueden interpretarse incorrectamente como ventas ejecutadas | UI indica actividad/órdenes observadas; cantidades y plazos no garantizados | AODP no certifica ventas individuales ni demanda NPC futura |
| Capital / pérdidas | La regla de ROI podía devolver cero rutas; liberar el filtro sin límite puede causar pérdidas | Precio equilibrio orientativo, topes de exposición y advertencias de margen negativo | El cálculo depende de precios, tarifas y transporte realmente introducidos |
| Catálogo | Equipamiento habitual dependía de recetas derivadas por tercero | Extractor de `ao-bin-dumps/items.json` RAW durante build; fusiona con respaldo y publica procedencia | Precisa validación de bonificaciones por ciudad tras parches; fallback al tercero cuando RAW no disponible |
| Compras | Cantidades de materiales sugeridas no equivalen a stock disponible | Lista bruta y advertencia de libro por tramos; límites contra saturación | La propuesta de demanda no garantiza profundidad de recursos ni realiza compras |
| Cuenta | Guardar una idea podía confundirse con gastar silver | `started:false` hasta confirmar la compra; confirmación adicional para planes por demanda | El jugador debe actualizar costes reales y registrar ventas para medir beneficios |

## Prueba recomendada antes de aceptar el deploy

1. **Arcos T6.0 con historial**: genera listado aun con precio bajo equilibrio, con pérdidas visibles.
2. **Arcos de alto costo con presupuesto pequeño**: elige otros objetos realmente asequibles si hay datos, no se queda bloqueado.
3. **Inventario de 20 arcos ya pendiente**: el siguiente plan reduce esa exposición en el mismo mercado.
4. **Material sin cotización**: muestra dato incompleto y NO guarda una inversión con importe falso.
5. **Royal con varias ciudades**: actividad por cada destino, no total Royal agregado a una ciudad.
6. **Confirmar compras en Mi negocio**: solo descuenta silver cuando el usuario afirma que realizó la compra.
7. **Fallo de Netlify/CDN**: reconstruye con catálogo de respaldo y fecha/fuente explícita; no inventa precios.
8. **Pruebas globales**: `npm test`, `npm run build` y `node scripts/check-deploy.mjs` exitosos antes del push.

La nueva vista de demanda usa lotes conservadores. Puede quedar presupuesto sin asignar, porque el objetivo principal es planificar artículos con actividad, no invertir 100 % a cualquier precio.
