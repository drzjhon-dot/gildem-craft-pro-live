# Gildem Craft Pro v8.2.0 · Royal + Black Market

Proyecto web en español para **América (West)** publicado con **GitHub → Netlify**. Los datos comunitarios de precios (AODP) tienen antigüedad variable: comprueba siempre su fecha y verifica dentro del juego antes de invertir.

## Navegación principal

Solo hay tres entradas en la barra lateral:

1. **Plan de crafting**: planea un lote en una rama concreta. Ahora tiene un selector de **objetos específicos** con búsqueda por nombre español, filtros de tier y encantamiento, y una tarjeta visible de **Refinamiento de materiales**.
2. **Encontrar oportunidades**: escáner independiente que permite elegir categorías, **ramas concretas**, **objetos concretos**, tiers y encantamientos. También incorpora **Refinamiento integrado al escáner**, y un único presupuesto compartido entre las recomendaciones.
3. **Ajustes y datos**: configuraciones avanzadas, inventario, costos de Focus y acceso opcional a datos de inversiones anteriores. Se quitaron de la barra lateral *Mis inversiones*, *Focus y specs* y *Alertas de crafting*; **no se borran los datos previamente guardados en el navegador**.

### Monturas y pociones

Las monturas pueden elegirse individualmente por sus familias reales de recetas de juego: el catálogo especial se carga al entrar en la categoría y agrega las familias fabricables detectadas. La búsqueda de objetos distingue monturas específicas (por ejemplo, un alce blindado frente a caballo o buey). Las pociones incluyen familias conocidas y pueden descubrir familias posteriores cuando la fuente de recetas se actualice. **Solo se incluyen recetas con materiales verificables**. Estas categorías especiales se venden en Royal, no Black Market.

### Refinamiento económico

Modos: comprar material refinado; comparar compra versus refinamiento propio; priorizar refinado cuando existan datos verificables. Aplica a lingotes, tablas, tela, cuero y bloques, considerando insumos sin refinar y refinado del tier anterior, ciudad, retorno estimado, tarifa de taller y capital inicial. Si se usa refinado, la lista de compras y ruta logística se adaptan a sus insumos. El modelo refina **una sola etapa** (compra el refinado del tier anterior), no garantiza retorno exacto por redondeos del juego y no estima Focus de refino sin costos introducidos y verificados explícitamente en Plan de crafting.

Los precios de AODP, la profundidad observada y la demanda histórica no son garantía de que las órdenes sigan disponibles ni de que un producto se venda. No se debe invertir sin revisar costos del taller y transporte, y validar los precios de los mercados en el juego.

## Despliegue en el sitio EXISTENTE

- Repositorio: https://github.com/drzjhon-dot/gildem-craft-pro-live
- Sitio: https://endearing-piroshki-ea4758.netlify.app/
- **No crees otro sitio ni uses Netlify Drop**. Copia el contenido descomprimido de este paquete a tu clon del repositorio, conservando la carpeta oculta `.git`.
- Haz **Commit to main → Push origin** desde GitHub Desktop. Netlify publicará automáticamente el mismo sitio.
- Build command: `npm run build`; Publish directory: `dist`; Functions directory: `netlify/functions` (en `netlify.toml`); Node 22.
- Comprueba `/version.json` (**8.2.0**) y `/.netlify/functions/health` (**status ok**, versión **8.2.0**). Una versión anterior significa que este paquete todavía no se publicó o está en otro proyecto/branch.

Lee **ACTUALIZAR_EN_GITHUB_NETLIFY.md** para los pasos completos. Haz respaldo de los datos del navegador antes de limpiarlos o cambiar de dominio: los datos locales no se transfieren automáticamente.

## Pruebas de desarrollo

```bash
npm run preflight
npm test
npm run build
```

Estas pruebas son locales; la interacción real con AODP y los servidores de Netlify requiere una comprobación posterior al despliegue.
