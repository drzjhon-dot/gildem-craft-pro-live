# Gildem Craft Pro v8.4.4

**Corrección de categorías: Manos secundarias, Kits y Asedio.**

Esta versión conserva los cálculos de crafting y el HUD compacto, pero corrige los filtros que impedían que algunas categorías aparecieran o cargaran sus recetas.

## Categorías del Plan de crafting

- **Armaduras**: botas, cascos, pecheras.
- **Armas**: líneas de armas del juego.
- **Accesorios**: solamente bolsas y capas.
- **Manos secundarias**: escudos, antorchas, libros, orbes y otros secundarios (`T*_OFF_*`).
- **Kits**: kits de rastreo (`T3–T8_2H_TOOL_TRACKING`). **Solo Royal.**
- **Asedio**: martillos normales/avalonianos y estandartes (`T*_2H_TOOL_SIEGEHAMMER`, `T*_2H_TOOL_SIEGEHAMMER_AVALON`, `T*_SIEGE_BANNER`). **Solo Royal.**

## Encontrar oportunidades

Las categorías **Manos secundarias, Kits y Asedio** también están separadas y disponibles en el explorador. El filtro `Recolección` ya no absorbe kits de rastreo y el filtro `Armas` no arrastra los martillos de asedio.

Las recetas de Kits y Asedio proceden del dump oficial de objetos cuando existen sus `craftingrequirements`; el motor consulta después precios observados por AODP. No se inventan recetas, precios ni demanda.

**Para actualizar:** lee `ACTUALIZAR_EN_GITHUB_NETLIFY.md`.
