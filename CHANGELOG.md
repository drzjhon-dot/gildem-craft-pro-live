# Gildem Craft Pro: historial de cambios

## v8.5.7 | Refinamiento Royal, ramas sin duplicados y órdenes de venta

- Regresa Refinamiento a Royal Craft: todos los refinados o lingotes, tablones, tela, cuero y bloques, con tiers, encantamientos y bono diario elegidos. Compara precios de compra de recursos entre ciudades y rutas de venta Royal.
- Cada profesión de Recolección aparece una sola vez y reúne equipo, mochila y su herramienta correspondiente. Monturas usa una sola rama para los objetos ensillables con receta válida.
- Black Craft y Royal Craft generan planes para **publicar órdenes de venta**. La puja del NPC en BM se utiliza únicamente como referencia de precios, no como ejecución asegurada. Se incluyen impuestos y publicación donde corresponde.
- Cada plan comprueba disponibilidad de acceso de las cuatro webs referenciadas (Albion Journal, Albion Hub, Royal Forge y Albion Online Tools); muestra enlaces y estado. **No se importa un volumen numérico no respaldado por una API pública verificable**. El motor usa AODP por mercado y objeto.
- Avisos para falta de actividad/mercado, limitaciones de Focus en refinado sin spec verificada, y compras en tramos para evitar deslizamiento.
- 211 pruebas y validación visual en Chromium con datos simulados.

---

# Historial de Gildem Craft Pro

## v8.5.6 | Búsqueda ampliada en mercados y control de materiales (9 de noviembre de 2026)

- Royal Craft compara publicaciones y ventas inmediatas en **los siete mercados Royal**, sin limitar arbitrariamente la fabricación a una sola ciudad cuando hay mejores alternativas.
- Los filtros de seguridad y demanda se aplican **antes** de eliminar destinos candidatos, evitando que un ROI teórico alto sin liquidez bloquee una ruta mejor.
- Permite incluir encantamiento **.0**, además de .1–.4; filtra variantes antes de muestrear recetas.
- Materiales refinados comprables en el mercado con mejor precio cotizado, sin exigir la ciudad que da bono de refinamiento; conservando advertencias de transporte y verificación.
- Límite por libro de **órdenes de venta observadas de materiales** a precio cotizado, compartido por las recetas, hasta un 60% de profundidad; cuando faltan niveles, solo operaciones pequeñas provisionales.
- Panel «Mercados examinados» con cotizaciones, ranking de actividad observada, muestra de historial, razones de rechazo y advertencias de datos faltantes. **También consulta historial si ningún candidato da profit**.
- Las respuestas parcialmente disponibles de AODP no se descartan por completo; se marcan con advertencia para que los datos ausentes no se conviertan en falsas cotizaciones.
- **205 tests superados**, preflight y compilación completa correctos en Node 22; navegador de prueba con cotizaciones simuladas para Black y Royal.
- Las páginas consultadas se utilizan como referencia metodológica, no como suministro oculto de datos en tiempo real.

# Historial de Gildem Craft Pro

## v8.5.5 | Proyecto íntegro corregido y validado (9 de noviembre de 2026)

- Integración real de formularios compactos para Black Craft y Royal Craft, con una rama individual, casillas de tier/encantamiento y objetos seleccionables.
- Nueva tab Resultados conectada a los planes originales, con dashboard gráfico, tarjetas financieras, listas editables, diarios, exportación y comprobación previa.
- Iconos reales de Albion Online a través del render del juego y fallback; fondos decorativos en `assets/`.
- Incluidos los límites por liquidez de materiales y actividad reciente del proyecto 8.5.3.
- Corrigido el tratamiento de una serie histórica de 7 días ausente: no representa una caída confirmada del 50% de la actividad de 14 días.
- Actualizadas pruebas obsoletas que esperaban v8.5.2 o el selector anterior, preservando sus verificaciones de seguridad pertinentes.
- Corregido `npm run preflight` y añadido al comienzo del build para detectar integraciones incompletas antes de publicar.
- Sustituida la automatización de reconstrucción por una comprobación GitHub Actions de solo lectura; no modifica repositorios ni necesita Python en Windows.
- 197 pruebas automatizadas superadas y compilación completa `npm run build` superada en el entorno local con Node.js 22.16.

**Limitación:** las condiciones de mercado y la disponibilidad real de servicios AODP/Netlify solo se verifican al usar el sitio publicado; las pruebas de interfaz se hicieron con datos simulados.
