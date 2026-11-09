## v8.4.0 (HUD compacto y materiales refinados)
- Solo un selector por encantamiento en Plan de crafting y Encontrar oportunidades.
- Retirados controles de refinamiento intermedio de materiales para fabricar; los planes compran refinados.
- Compra por defecto de recursos refinados en sus ciudades con bono, configurable desde Opciones avanzadas.
- Preservado refinamiento para vender como categoría independiente Royal.
- Pasos 2/3 rediseñados con tarjetas de controles compactos y diseño responsive.

# Historial de Gildem Craft Pro

## v8.3.0 · Mercado Negro + refinamiento como oportunidad

- **Plan de crafting** centrado en armas, armaduras y accesorios; las categorías de recolección, pociones, monturas y comidas se eliminan de esta pestaña, pero siguen disponibles en Encontrar oportunidades.
- Se eliminan **del selector manual** las entradas que agrupan «Todas las botas y zapatos», «Todos los cascos y capuchas», «Todas las pecheras» y «Todas las armas». Las ramas específicas siguen presentes. El motor sigue pudiendo comparar ramas entre sí en Encontrar oportunidades.
- **Encontrar oportunidades** añade una categoría de inversión **Refinamiento** seleccionable y compatible con los demás tipos de crafting. Busca lingotes, tablones, cuero, tela y bloques de piedra. Permite elegir qué recursos refinar, tier, encantamiento, tipo de venta Royal, bono diario confirmado, tarifa de estación y transporte.
- El motor de refinamiento independiente calcula una etapa por producto usando **recurso crudo + refinado del tier anterior**, el retorno estimado, la estación, la compra bruta, el costo neto esperado, tarifa Royal y traslados. Omite datos ausentes, viejos o con margen no positivo.
- Un solo presupuesto para **fabricaciones y refinamientos**. Ambos tipos aparecen en el plan, la distribución Royal y la lista de compras. La verificación precompra reconsulta materiales y precios de venta.
- En v8.3 el modo de refinar insumos estaba separado del modo «refinar y vender». En v8.4 se retira el primer modo por petición del usuario.
- Mejorado el HUD: iconos más grandes, nombres sin truncar, controles amplios, selección resaltada, navegación más clara y distribución adaptable para móvil y escritorio.
- Se muestra un aviso si seleccionas Refinamiento mientras filtras exclusivamente Mercado Negro, donde no pueden venderse estos recursos.
- Servicio sin cambios de permisos nuevos. Actualizada caché del service worker, versión pública y diagnóstico del backend a **8.4.0**.
- 110 pruebas automatizadas, comprobaciones de sintaxis, preflight y compilación local completadas satisfactoriamente.

**Límites:** los datos comunitarios AODP pueden no estar actualizados. La rentabilidad por «orden de venta» no asegura que un comprador ejecute la orden; el escáner no conoce el costo real de la estación ni el transporte hasta que se introduzcan. El refinamiento por sí mismo se limita a Royal y usa una fórmula de una etapa sin Focus, no una simulación exhaustiva de múltiples etapas ni de todas las reglas de un parche futuro.
