# v9.9.4 · AODP Developer / REST West + preparación de NATS

- En **Top Mercado**, consultas históricas con fechas `date` y `end_date` explícitas según días UTC completos; cinco calidades y West.
- Por defecto Top Mercado analiza Mercado Negro; se pueden seleccionar Royal y otros mercados.
- Mejor control de `429`, con `RateLimit-Reset` y protección contra reintentos durante la ventana bloqueada.
- Fuente REST explícita, avisos de caché antigua y de cobertura parcial.
- Canal NATS opcional con trabajador Node persistente y endpoint de ingesta protegido; informa órdenes observadas sin tratarlas como ventas.
- No se altera el cálculo de crafteo, precios usados por los motores, diarios, compras netas, condiciones de profit, asignación o logística.
- **NATS requiere servidor de ejecución permanente** y secreto de Netlify; no está activo automáticamente.

Instrucciones completas en `INTEGRACION_AODP_DEVELOPER.md`.
