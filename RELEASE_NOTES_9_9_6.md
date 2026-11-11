# Gildem Albion Lab 9.9.6 · Top Mercado como evidencia única de crafting

- Black Craft y Royal Craft leen el mismo historial REST West que Top Mercado, con las mismas calidades 1-5, fechas UTC completas y agregación deduplicada.
- Los planes usan una ventana de 14 días y muestran también el promedio de 7 días obtenido del MISMO histórico; Top Mercado mantiene su selector de 7/14 días. Si se comparan números deben elegirse ventanas idénticas.
- La cifra visible en Top Mercado es actividad total de calidades 1-5. Para craftear se calcula una capacidad más baja compatible con calidad Normal y actividad de calidades superiores. **Nunca equivale a ventas garantizadas.**
- Se evita duplicar calidad 2-3. Las importaciones manuales se conservan como referencia, sin anular la actividad de Top Mercado para asignar lotes.
- Las órdenes de venta Black Market/Royal necesitan historia verificable reciente; sin evidencia, no se recomiendan aunque el margen aparente sea positivo.
- Se cierra el bypass del fallback paciente que podía usar rutas descartadas en la evaluación de viabilidad.
- Tiers, encantamientos, selección de objetos y presupuesto se siguen verificando después del plan como en v9.9.5.
- Netlify no genera historial propio ni certifica venta al NPC. Si falta historial se descarta la ruta, no se rellena con ceros ni datos inventados.
