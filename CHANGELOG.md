## 8.7.0 · Plan condicionado siempre disponible

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

## v8.6.9 (2026-11-10)

- Reparado el panel «Sin crafting rentable» comprimido en una sola columna: `col-12`, estilos adaptativos, botones móviles y caché nueva.

## 8.6.8 · Arcos y plan real vs investigación
- Retirados los paneles y exportación de «Plan de investigación» (sin fabricar, beneficio cero).
- El motor Black Craft consulta el historial antes de descartar una receta por su puja BM actual, y evalúa un precio objetivo de orden BM, no una orden ejecutable.
- Filtro para el escenario alternativo: cuatro días activos como mínimo, más de 50 observaciones/semana, volatilidad acotada, último dato <=72 h, descuento del 15% sobre mediana 14d y máximo 40% por encima del bid si existe. El margen debe seguir siendo positivo incluso con el estrés configurado.
- Los escenarios históricos muestran aviso en Resultados y CSV, sin ocultar incertidumbre del beneficio.
- Si faltan datos o beneficios, se muestra una explicación sin inventar oportunidades y un botón de expansión automática a T4-T8, todos los encantamientos y modelos de la rama.
- Sin cambios de servidor: AODP West obligatorio. Sin datos privados, ni conexión automática a Albion Hub/AFM.

## v8.6.7 (2026-11-10) · Totales por objeto, logística visible y presupuesto sin techos arbitrarios

- Rediseño de Resultados en tarjetas compactas sin scroll horizontal en teléfono y PC. Repeticiones del mismo ID exacto por ciudad de venta se consolidan; logística por destino aparece abajo.
- Fabricación total editable a nivel de objeto; redistribuye los cambios entre rutas conservando límites por mercado y costos sin contabilizar dos veces.
- Producción de volumen: techo por ruta antes fijo en 650, ahora máximo técnico de 6.000, sujeto a actividad, horizonte, competencia e inventario pendiente; no convierte observaciones AODP en ventas garantizadas.
- Corrige los topes artificiales por tier/ciudad y la exposición combinada de dos objetos que impedían usar el presupuesto incluso con oportunidades viables.
- Primera compra de materiales y profundidad en tarjetas compactas; compras escalonadas siguen señaladas como condicionadas.
- Referencias estudiadas: AFM Data Client, albionmarket.gg Data Client y ejemplo MIT de millelog. No se integra acceso privado de pago ni se importa una API no documentada. `RESEARCH_CLIENTES_MERCADO_AMERICA.md`.
- 279 pruebas automáticas y compilación limpia (con datos simulados). Renderizado de Resultados inspeccionado a 390 px y 1.060 px sin desplazamiento horizontal; falta confirmar cotizaciones y despliegue reales.

## v8.6.6 (2026-11-10) · Plan de volumen y uso integral del presupuesto

- Elimina el control Reservar 15%; generación Black Craft / Royal Craft con 100% del capital autorizado cuando se elige usar todo.
- Umbral de más de 50 observaciones semanales por mercado y objeto (no ventas probadas); estrés positivo; comparador de carteras verificadas frente a objetivos de compra por etapas.
- Diversificación hasta 65 rutas y 28 objetos, exposición variable y saldo sin invertir explicado.
- Mantiene los controles de profundidad, ciudad y pendientes.

## v8.6.5 (2026-11-10) · Cartera inteligente y límites de riesgo

- Diversificación en Black y Royal; hasta 12 objetos distintos iniciales y 15 rutas, sin forzar ganancias imaginarias.
- Máximo 12% del presupuesto invertible por objeto y límites por mercado/tier cuando existen alternativas.
- Reserva opcional del 15% por defecto; respeta la caja reservada también en ediciones y techos de compra.
- Descuento de lotes pendientes marcados como iniciados en Mi negocio.
- Compra por tramos de precio, primera compra orientativa y exportación rápida al portapapeles.
- Auditoría de actividad alta/media/lenta sin confundir órdenes históricas con ventas confirmadas.
- 265 pruebas y compilación correctas; falta comprobar despliegue real.

## v8.6.4 (2026-11-10) · Destinos Royal y pantalla Resultados simplificada
- Royal Craft permite marcar cualquiera de los siete mercados Royal para vender; de fábrica están todos marcados.
- El filtro de ciudades solo afecta a los DESTINOS de venta, no a las compras de materiales ni a la ciudad de elaboración.
- El filtro se aplica a fabricación, refinamiento, competencia, investigación y resultados. Se conserva localmente entre sesiones.
- Resultados oculta cinco paneles solicitados: mercados examinados, referencias externas, calidad de datos, comprobación previa y distribución del presupuesto.
- El botón de verificar antes de comprar permanece activo; la comprobación sigue calculándose sin un panel adicional.
- Nuevas pruebas de exclusión real de mercados y de ocultamiento visual.

## v8.6.3 (2026-11-10) · AODP West y pruebas por objeto

- Ranking equilibrado con retorno por capital y rotación observada.
- Deduplicación por item, mercado y observación de historia AODP.
- Auditoría en Resultados de precios, actividad y abastecimiento por etapa.
- Contador de cobertura real y parcial de historial.
- Pruebas nuevas de volúmenes, ranking y transparencia de datos.

## v8.6.2 (2026-11-10) · Fuentes de mercado visibles

- Se reparó un bug de propiedades: las tarjetas usaban `name`/`description` mientras que el catálogo exponía `title`/`uses`.
- La pantalla identifica cada página, muestra su finalidad y distingue un chequeo HTTP de una fuente numérica verdaderamente integrada.
- AODP West sigue siendo la fuente automática de precios/historial/órdenes; las páginas externas NO son feeds numéricos verificados.
- Acceso directo para importar manualmente estadísticas comprobadas West en Ajustes.
- Nuevas pruebas de regresión y nueva versión de caché.

# Gildem Craft Pro v8.6.2 | Región West obligatoria

**v8.6.2:** correcciones en `core/server-policy.js`, referencias externas y selección única de servidor; restringidas las funciones Netlify market/snapshot/watch a West, y guard de datos externos. Las cinco fuentes se comprueban como enlaces, sin mezclar precios/volúmenes ajenos ni asumir servidor por accesibilidad. La fuente europea retirada. Nueva consulta opcional para investigación con IA, explícitamente no automática.


## v8.6.2

- Consulta historial de 7, 14 y 30 días de los objetos de **toda la rama elegida**, hasta 900 IDs, antes de asignar inversión. Incluye .0 en el mismo análisis que .1-.4. Evita el sesgo anterior hacia objetos caros con ROI aparente pero actividad mínima.
- Nuevo selector compacto **Horizonte de venta por órdenes**: 7, 14 o 30 días (14 por defecto); la capacidad estratégica usa un porcentaje conservador del volumen histórico del horizonte, y no el volumen de un día que se redondeaba a cero. Eliminado el tope genérico de 12 crafts para todas las rutas pacientes.
- Las rutas más activas pueden recibir lotes mayores siempre que tengan coste, margen y presupuesto suficiente. Se mantiene el modo provisional de 1 fabricación cuando falta evidencia de actividad.
- El plan paciente **distingue la cantidad objetivo de fabricación de la primera compra de materiales verificable**. Cuando el libro de materiales está incompleto, conserva el lote como **PLAN CONDICIONADO / compras por etapas**, con comprobación previa obligatoria. No garantiza el precio de toda la compra.
- Resultados muestra **actividad diaria observada, fuente, capacidad de craft, compras por etapas** por ruta.
- En Ajustes, importador opcional de estadísticas **pegadas** de Albion Hub y Albion Journal: obliga a identificar servidor, destino y fecha. No incorpora precios externos ni mezcla Europa con América. Solo un snapshot manual vigente por vez, con reducción de exposición.
- No hay conexión directa de estadísticas numéricas con las cuatro webs externas sin API documentada; los precios calculables proceden de AODP y las páginas conservan su comprobación de accesibilidad.
- Nuevas pruebas de volumen alto/bajo, horizonte temporal, parser de rankings y separación de servidores. **230 pruebas aprobadas** en Node 22; `npm run build` y escenario completo en Chromium con mercado **simulado**, sin validación de compra real ni promesa de ventas.

---

# Gildem Craft Pro v8.5.9 | Motor paciente y planes accionables

## v8.5.9

- Eliminada la tab visible **Level Craft** (permanecen pruebas del motor anterior para regresión).
- Nuevo `core/adaptive-planner.js`: rescate de oportunidades rentables con actividad histórica de menos de una unidad por día, cantidades iniciales prudentes y advertencias explícitas.
- Las rutas rentables no se descartan por haber quedado fuera de la **muestra de historial** del escaneo Royal.
- Conserva la fase estricta. Si devuelve cero, utiliza automáticamente la fase de venta paciente. Se conserva la comprobación de **margen neto positivo, presupuesto y referencias fechadas**.
- Los precios de hasta 72 horas solo son base de **escenarios provisionales**, con comprobación previa imprescindible; los precios recientes tienen prioridad.
- La falta de profundidad de materiales puede convertir el plan en **condicionado**, con compras por etapas y advertencia. No significa que el libro permita comprar instantáneamente toda la lista.
- Cuando ninguna cotización permite un plan rentable, nuevo **Plan de investigación**, con objeto, ciudad de crafting/venta, capital conocido y precio objetivo. Exportable a CSV. No inventa profit.
- Restaurado el recuento de actividad: días con `item_count=0` no se presentan como días de actividad.
- Pruebas de extremo a extremo con escenarios simulados de rotación lenta, compra de materiales insuficiente y precios con margen negativo.
- **223 pruebas automatizadas aprobadas; `npm run build` validado en Node.js 22**. El mercado real y el despliegue Netlify todavía requieren validación tras la publicación.

# Gildem Craft Pro v8.5.8 | Estabilidad del catálogo

- IndexedDB deja de ser requisito para que funcionen los selectores.
- Nuevo proxy de catálogo Netlify, con alternativa a dos fuentes públicas.
- Carga independiente de recetas y nombres en español.
- Panel de recuperación cuando no hay recetas, con botón de reintento.
- Pantalla de arranque visible y reparación de caché si fallan módulos.
- Precache de los módulos de mercado faltantes, versiones y cabeceras contra la caché antigua.
- Preferencias guardadas de versiones anteriores saneadas.
- Planes e inversiones locales NO se borran al reparar la caché.

# Gildem Craft Pro: historial de cambios

## v8.5.8 | Refinamiento Royal, ramas sin duplicados y órdenes de venta

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
