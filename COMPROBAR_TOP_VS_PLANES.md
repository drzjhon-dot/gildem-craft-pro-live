# Comprobación de Top Mercado frente a los planes · v9.9.6

1. Publica el ZIP completo en GitHub para que Netlify reconstruya la carpeta `dist/`.
2. Abre **Top mercado → Mazas → Mercado Negro → 14 días**, pulsa «Forzar datos frescos» solo una vez y comprueba T4_MAIN_MACE, T4_2H_MACE, T4_2H_FLAIL, T5_MAIN_MACE@1, T6_MAIN_MACE_HELL y T4_2H_MACE@1 (si tienen historial).
3. Abre **Black Craft → Mazas**, selecciona exactamente T4–T6 y encantamientos .0–.1, presupuesto **10.000.000** silver, mismo servidor West, y crea el plan. Compara la columna **Actividad 14d** con Top Mercado configurado a 14 días, no a 7.
4. La cifra de actividad 14d de cada objeto/mercado debe proceder del mismo agregado de todas las calidades en ambos lugares. En Resultados se añade el promedio 7d para contrastar la tendencia.
5. **Cantidad recomendada ≠ volumen de Top Mercado:** la cantidad atendible baja cuando faltan registros de calidad Normal, el movimiento cae, el beneficio estresado es negativo o la compra de materiales supera el presupuesto. No se inventan ventas.
6. Un artículo sin datos suficientes no debe entrar en un plan de órdenes de venta (aunque la cotización parezca rentable). Si la API ofrece cobertura parcial se mostrará la advertencia y las variantes no verificadas quedarán fuera.
7. «Más fama» busca variedad **solo entre rutas rentables y verificadas**. No permite relajar la seguridad del filtro de mercado.
8. Si los números siguen sin coincidir, compara las fechas UTC de ambos informes y la marca de caché. Top de 7 días y un plan de 14 pueden variar significativamente.

Los precios de compra/venta AODP y los volúmenes de historial son señales de actividad comunitaria, no órdenes ejecutadas ni certeza de liquidación del stock.
