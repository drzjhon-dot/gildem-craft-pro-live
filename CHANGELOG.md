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
