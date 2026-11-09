# Gildem Craft Pro · Historial de cambios

## v8.4.6 · Iconos, nombres limpios y resultados compactos

- Todas las imágenes de objetos usan **la misma ruta de iconos en Netlify**, con caché HTTP compartida por ID y tamaño. No se preselecciona ni precarga una lista de objetos favoritos.
- La función `item-image` consulta **en paralelo** los proveedores de imágenes y entrega la primera respuesta PNG/WebP válida, con límite de espera por proveedor y CDN reutilizable.
- Los iconos pequeños utilizan una resolución compartida de 96 px; los grandes, 192 px. Los navegadores pueden reutilizar una misma respuesta entre tarjetas.
- **Elegir objetos específicos:** el nombre de familia ya no muestra un `.4.4` arbitrario ni el ID interno `T4_...@2`; se conserva el rango de tiers y el identificador interno del filtro.
- **Resultados:** se ocultan los paneles de rotación/silver por día, economía del lote, inventario/desembolso y ruta logística. El botón de verificación sigue funcionando, sin aviso previo permanente.
- **Encontrar oportunidades:** nuevo selector `¿Dónde fabricar?` con ciudad de especialidad automática, comparación contra Caerleon o ciudad manual. El retorno y profit cambian según la selección, sin bono de especialidad si la ciudad es distinta.
- **Refinamiento independiente:** mantiene su ciudad de bono propia. El selector de fabricación afecta a recetas de crafting, no traslada automáticamente el refinamiento.
- El motor de presupuesto, impuestos, materiales, diarios y verificación no se ha eliminado.
- Pruebas unitarias y de integración con datos simulados; no garantizan rendimiento ni cotizaciones en producción.

# v8.4.6 · Categorías de crafting completas

- Manos secundarias separadas de Accesorios en **ambas pestañas**.
- Kits de rastreo disponibles como categoría propia tanto en Plan de crafting como en Encontrar oportunidades.
- Asedio como categoría propia, con dos ramas: martillos de asedio (normales y avalonianos) y estandartes de asedio.
- Eliminada la duplicación de herramientas: los kits ya no aparecen dentro de Recolección, y Asedio no se filtra como Armas.
- Carga automática de recetas especiales al seleccionar Kits o Asedio, incluso sin seleccionar Recolección.
- Renovados el caché de recetas de Netlify, IndexedDB y el Service Worker para no reutilizar catálogos previos.
- Cambios de interfaz mantenidos en estilo compacto, sin añadir pestañas.
- Pruebas automáticas específicas de selección exclusiva y cálculo de inversión/profit Royal.

**Limitación:** los kits y asedio se planifican como productos Royal; los precios y la disponibilidad no garantizan ventas. Las opciones con datos incompletos se omiten.
