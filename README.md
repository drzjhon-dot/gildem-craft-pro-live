# Gildem Craft Pro v8.1.0 · Royal + Black Market

Web en español diseñada para despliegue automático **GitHub → Netlify**. Por defecto utiliza **América (West)** y datos públicos AODP cuya antigüedad se comprueba en cada cotización.

## Pestañas principales

- **Plan de crafting**: selecciona una rama concreta, ciudad, Focus, presupuesto y mercado. Compara Royal y Mercado Negro, muestra tiers, cantidades, lista de compras y diario cuando corresponda.
- **Refinar materiales antes del crafting** (dentro de Plan de crafting): comprar refinados, usar refinado propio solo si conviene, o forzarlo si hay precios. Incluye mineral→lingotes, madera→tablones, piel→cuero, fibra→tela, piedra→bloques. El refino tiene bono por ciudad (+40% de producción), retorno esperado, costo de estación y traslado.
- **Pociones**: 14 familias conocidas, con selector en español e iconos. Detecta nuevas familias al actualizar el catálogo después de parches. Pociones, monturas, comidas y equipamiento de recolección se venden solo en Royal.
- **Encontrar oportunidades**: escáner de múltiples ramas, en su propia pestaña, sin cambiar la configuración del planificador manual.
- **Mi negocio**: inventario, capital libre, inversiones, registro de ventas y caja.
- **Sincronización privada opcional**, alertas, comparación de ciudades, logística y comprobación de cambios de recetas tras parches.

## Cálculo de refinado dentro del plan

Se compara el **costo neto esperado** de comprar material refinado con el de refinar comprando recursos crudos y el refinado del tier anterior. El **presupuesto inicial** reserva los materiales brutos y todos los gastos configurados, aunque el retorno se aplique al consumo económico esperado. El refinado se hace en la ciudad de especialidad correspondiente. **Se modela una etapa:** el refinado del tier previo se compra, no se produce recursivamente. El modelo no cubre refinado de piedra encantada, recetas especiales de facción o retornos redondeados por lote en el juego.

Para usar Focus al refinar, introduce el costo **verificado en el juego** por unidad refinada. Focus usado para craftear y para refinar se descuenta del mismo presupuesto de Focus. Un costo 0 de estación/transporte es una hipótesis gratuita, no una tarifa verificada.

Los precios proceden de AODP; órdenes e historial son observaciones y **no garantizan ventas ejecutadas**. La app bloquea cotizaciones antiguas o faltantes en las rutas verificadas. Las recetas especiales se descargan de ao-bin-dumps y pueden tardar en reflejar el parche oficial.

## Desplegar

1. Sustituye los archivos del repositorio GitHub enlazado a Netlify por los del ZIP de v8.1, conservando el directorio `.git` al usar GitHub Desktop.
2. Haz **Commit** y **Push** a `main`. Netlify compilará automáticamente el mismo sitio.
3. `npm run build` → publica `dist/`, y `netlify/functions/` queda como backend. Se recomienda Node 22.
4. Comprueba `/version.json` (8.1.0) y `/.netlify/functions/health` (`status: ok`).

Lee **ACTUALIZAR_EN_GITHUB_NETLIFY.md** para las instrucciones detalladas. Exporta respaldo de Mi negocio antes de cambiar de dominio o navegador: los datos personales locales no se migran entre dominios automáticamente.

## Tests y herramientas

```bash
npm test
npm run preflight
npm run build
```

La compilación local y las pruebas automáticas son verificables; el acceso a AODP, el backend y el aspecto visual en la página pública deben confirmarse después del despliegue. Para sincronización privada no compartas tu clave personal: se guarda cifrada fuera del navegador únicamente si decides utilizar la función.
