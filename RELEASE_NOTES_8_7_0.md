# Gildem Craft Pro v8.7.0 · Plan siempre preparado

## Objetivo
Black Craft y Royal Craft ya no terminan en una pantalla vacía cuando AODP West no devuelve una oportunidad que supere todos los controles. El motor funciona por niveles:

1. **Verificado:** margen y reglas de riesgo/abastecimiento según precios observados. Las órdenes siguen sin estar garantizadas.
2. **Paciente:** oportunidad con margen positivo para venta por órdenes y compras por etapas, explícitamente condicionada.
3. **Plan condicionado automático:** si no hay ninguna ruta viable, propone objetos reales del catálogo, cantidades objetivo, ciudad de fabricación, destino, precio mínimo de venta, cotización observada (si existe) y materiales. Nunca presenta como rentable una cotización que no lo es. No es una autorización para comprar ni fabricar.

El tercero considera la actividad semanal observada y limita la proporción del mercado que asume ocupar. Si faltan cotizaciones de materiales, no inventa inversión; marca el precio/capital como pendiente. Si AODP falla completamente, también genera una propuesta de recetas si el catálogo ya está cargado, pero sin precios.

## Cambios visibles
- Se muestra **Resultados** también cuando únicamente hay un plan condicionado.
- Los cards de condiciones son compactos y no requieren desplazamiento horizontal.
- La fabricación y las necesidades hipotéticas de materiales aparecen agrupadas por objeto, sin presentar la lista como orden de compra.
- Se ofrece **Actualizar cotizaciones y recalcular** para convertir el escenario en un plan ejecutable cuando los datos lo permitan.
- Royal Craft admite también propuestas condicionadas de refinamiento con recetas reales y ciudades Royal seleccionadas.

## Límites
- Nunca se crea una receta, precio de mercado, demanda verificada ni beneficio neto ficticio.
- Un bid histórico del BM o un mínimo objetivo no equivale a una orden vigente.
- No se garantiza alcanzar el 100% del presupuesto ni que haya compradores.
- Las pruebas locales no validan precios reales ni la publicación en tu cuenta de Netlify.
