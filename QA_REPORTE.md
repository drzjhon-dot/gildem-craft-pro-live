# QA · Gildem Craft Pro NOVA v9.0

**Resultado de la compilación:** `npm run build` completado correctamente en Node.js 22.16.0 (entorno de pruebas). No se necesitan dependencias externas de npm.

**Suite automatizada:** 113 pruebas aprobadas, 0 fallidas. Cobertura:

- 28 identificadores base de equipo (fixtures sintéticas de prueba) revisados individualmente.
- 56 variantes encantadas derivadas de fixtures RAW; prueba de materiales con sufijos correctos, sin retorno para artefactos.
- Pociones, comidas, monturas y equipamiento de recolección: reconocimiento de 5 IDs adicionales, producción por lotes (5 y 10 unidades), ingredientes no retornables, destino Royal y exclusión del BM cuando corresponde.
- Extracción del catálogo RAW, exclusión de ítems retirados, normalización de nombres españoles y orden de tier.
- Motor West: quotes con fechas, límite de antigüedad, rotación de 14 días, precios de materiales, presupuesto, pérdidas, mínimos de 2, lista de compras coherente, exclusión de ítems no elegibles, compras por etapas.
- Netlify: rutas de los dos endpoints, validación de IDs, caché, fallback explícito, rechazos de conexiones y protección ante rate limit 429.
- Persistencia, borradores sin cargos, consentimiento para marcar compra, exportación CSV y integridad de versión v9.0.0.

**Pruebas reales de navegación e interacción en Chromium (con respuesta simulada de APIs):** 9 comprobaciones aprobadas:

1. Carga inicial, 84 entradas de catálogo de prueba y 5 pestañas.
2. Black Craft: generar, mínimo de dos, productos y compras.
3. Royal Craft: filtros, cantidades, destinos y tabla.
4. Descarga CSV de compras.
5. Analizador: lectura de ocho ciudades.
6. Mi negocio: guardar, confirmar compra y eliminar.
7. Datos y ajustes: cambiar y guardar.
8. Móvil de 390px: navegación y paneles.
9. Consola del navegador: ninguna excepción JavaScript durante la prueba.

**Problemas detectados y corregidos antes de esta entrega:**

- `localStorage` podía lanzar `SecurityError` e impedir iniciar la web. Se añadió respaldo en memoria.
- El cliente no debe repetir la petición AODP al recibir `429` ni confundir el respaldo antiguo con precio nuevo.
- Un dato histórico sin una cotización reciente no puede producir un beneficio calculado como confirmado.
- Tests antiguos de versión v8.7.0 podían bloquear Netlify tras subir v9.0; se eliminó completamente la dependencia con el proyecto anterior.

**Lo que aún no se ha podido probar en este entorno:** despliegue efectivo en tu cuenta de Netlify, disponibilidad en vivo de AODP West, descarga real del archivo oficial completo ni consulta real de los miles de ítems de Albion. La red externa del entorno de construcción estaba restringida. Los tests del navegador usaron APIs simuladas, etiquetadas exclusivamente para pruebas.

Ningún desarrollador puede prometer que las APIs externas, un futuro parche del juego o los mercados estarán siempre disponibles. Por eso la app muestra estados faltantes y no inventa resultados.
