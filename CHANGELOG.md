## v8.5.2 · Inteligencia de mercado / menos ciudades de crafting

- Estudio de las funcionalidades públicas de Albion Online Hub: comparación inmediata/órdenes, rutas entre ciudades, rentabilidad neta, gestión de órdenes. Se incorpora el aprendizaje de diseño sin copiar datos privados ni afirmar acceso a una API suya.
- Nuevo `core/market-intelligence.js`: bid/ask, antigüedad por lado y filtro de spreads anómalos. Reutilizado por Black, Royal y Level Craft; datos no disponibles no se inventan.
- Historial AODP: nuevo precio mediano por día y mediana entre días. Reduce el efecto de precios extremadamente altos que inflaban la expectativa de venta; se conserva el campo `avgPrice` por compatibilidad.
- Nuevo `core/city-consolidation.js`: selecciona 1 / hasta 2 / todas las ciudades de fabricación ANTES de asignar capital; modo conservador por defecto en Royal Craft.
- Resultados: «Verificar señales del mercado» opcional y compacto con precio bid, ask, mediana histórica y edad de observaciones.
- 176 pruebas automáticas, con casos de spreads enormes, fechas antiguas, registros históricos atípicos y preferencia por una ciudad.

# Novedades

## v8.5.2 · Motor prudente de crafting

- Level Craft ya no fabrica artículos deficitarios para alcanzar 100: rentabilidad, margen de estrés, límites de capital, liquidez Royal y órdenes de compra BM son filtros obligatorios.
- Royal Craft y Black Craft comparten la misma comprobación conservadora; el beneficio proyectado reduce los precios optimistas frente al historial y reserva costos de taller/transporte sin configurar.
- La profundidad BM debe estar disponible y rentable; su consumo no se renueva ficticiamente en rondas. El motor descarta las ofertas donde la siguiente orden hace perder margen.
- Se descartan productos costosos con salida insuficiente. No se recomienda invertir el 100% del dinero por defecto: los planificadores reservan 10% de capital y Level Craft 20% por ronda.
- Rondas de Level Craft limitadas por la exposición total observada (máximo 8 etapas condicionales); estudio solo si se activa, se conoce la tarifa y el presupuesto de estudio no supera el 20% del capital inicial.
- Los planes pueden ser parciales o vacíos cuando no se encuentran oportunidades verificables. La falta de oportunidades es preferible a recomendar pérdidas.
- 166 pruebas automatizadas y comprobación de compilación/despliegue.

## v8.5.0 · Black Craft + Royal Craft + Level Craft

- Cambio de nombre en navegación y títulos, sin borrar funciones anteriores.
- Nueva pestaña Level Craft con selección por familia y receta, objetivos de fama/spec, ciudad de crafting, presupuesto, destino de venta y modo de estudio opcional.
- El estudio destruye objetos y no contabiliza ventas de esas unidades; se incluyen costos de estudio configurados y Fame estimada.
- Estrategia en rondas conservadoras: límites observados por ciudad, profundidad BM, capital bruto de cada ronda, Focus máximo opcional, resumen de fabricación, compras y ventas. Si no se alcanza 100, muestra progreso parcial.
- Interpolación explícita de fama pendiente en specs intermedias y campo de fama pendiente exacta para evitar confundir estimación con datos del juego.
- Royal Craft mantiene el Mercado Negro opcional.

## v8.4.7

Lista de fabricación agrupada por ID de objeto (tier y encantamiento), con destinos separados en su propia tabla. Más detalles en versiones anteriores.
