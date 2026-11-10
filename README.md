# GILDEM CRAFT PRO · NOVA v9.0

Aplicación **nueva, independiente y completa** para el servidor **América (West)** de Albion Online. No depende de `app.js` ni de ningún archivo de las versiones anteriores.

## 5 secciones disponibles

1. **Black Craft**. Elige rama, tiers, encantamientos, presupuesto y opción de Focus (retorno configurado). Propone artículos por **actividad semanal observada**, siempre con **2 o más fabricaciones**; prioriza movimiento y limita la exposición por artículo. Muestra estimación de profit o pérdida, lista exacta de compras y ciudades.
2. **Royal Craft**. Mismo motor, con selector de mercados Royal y recomendación de ciudad según familia. Se elige un destino por artículo para no duplicar fabricación.
3. **Analizador**. Consulta un ID del catálogo en los ocho mercados y muestra precios de compra/venta, fechas y actividad histórica.
4. **Mi negocio**. Guarda borradores localmente, exporta, elimina y permite marcar manualmente compras efectivamente realizadas. NO tiene acceso a tu silver ni a las órdenes de Albion.
5. **Datos y ajustes**. Mínimos de rotación y cantidades, límite de presupuesto por artículo, retorno sin/con Focus, tasas, transporte, estación, antigüedad de precios y estado del catálogo.

El catálogo también extrae del RAW las recetas verificables de **pociones, comidas, monturas y equipo de recolección**; las recetas especiales sin ingredientes completos no se inventan. Los objetos marcados Royal-only no se ofrecen para Mercado Negro. Si se usa el catálogo derivado de respaldo, puede contener únicamente equipo tradicional.

La interfaz muestra iconos del renderizador de Albion Online y se adapta a PC y móvil. Las tablas se ordenan por tier y encantamiento ascendentes, sin tarjetas enormes de producción.

## Fuentes

- Recetas: https://github.com/ao-data/ao-bin-dumps (`items.json` RAW). Respaldo explícito: `vkorne-web/albion-market` cuando falla RAW.
- Nombres españoles: catálogo comunitario `vkorne-web/albion-market`.
- Precios/historial: https://west.albion-online-data.com/api-docs. Servidor fijado **west**, sin mezclar Europe/East.
- Iconos: https://render.albiononline.com/v1/item/{ID}.png.

**Importante:** `item_count` de AODP refleja actividad histórica de órdenes, NO ventas confirmadas, ni la profundidad actual del libro. Los precios de AODP son observaciones comunitarias que pueden faltar o estar desactualizadas. El plan limita su participación en ese movimiento histórico, pero no garantiza poder vender la cantidad ni comprar todos los materiales al precio estimado.

## Instalación para GitHub y Netlify

1. **Haz una copia de tus datos antiguos** (exporta cualquier información importante de tu navegador): esta es una app nueva y no importa automáticamente la cartera de versiones anteriores.
2. En el repositorio vacío, coloca el **contenido** de este proyecto directamente en su raíz: `index.html`, `package.json`, `netlify.toml`, `src/`, `assets/`, `netlify/functions/`, `scripts/`, `tests/`, etc.
3. En Netlify, conecta ese repositorio (rama `main`). El comando será **`npm run build`**, la carpeta publicada **`dist`**, y las funciones estarán en **`netlify/functions`**. Estas opciones ya están en `netlify.toml`.
4. El build **no descarga APIs ni recetas** y no necesita dependencias NPM. Eso evita que una API lenta detenga el despliegue. El navegador consulta el catálogo después de cargar la web.
5. **Node.js 22** está configurado en `netlify.toml`; localmente basta con Node 20 o superior.
6. El primer catálogo puede tardar en cargar porque se comprueban datos oficiales. Si falla internet/CDN/API, la app muestra un error explícito y un botón para reintentar; no inventa recetas.

Para ejecutar localmente:

```sh
npm test
npm run build
python -m http.server 8080
```

Abre http://localhost:8080. Si no tienes Netlify Functions en local, el navegador intenta la fuente oficial RAW como respaldo para el catálogo y la API West directamente para los datos de mercado. Algunas redes o CORS pueden impedir este respaldo; el despliegue en Netlify permite el proxy de mismo origen.

## Qué puede y qué NO puede verificar

- Sí: estructura de recetas RAW, IDs de ingredientes, tier, cantidad de fabricaciones, retorno *simulado configurado*, costo por cotización, historial observado por ciudad, precios y fechas, presupuesto, comprar por tramos, persistencia de borradores.
- No: ventas ejecutadas, profundidad de órdenes disponibles al instante, precio de ejecución de grandes lotes, consumo exacto de Focus para tu especialización, fama, diarios llenos, precio del taller de tu personaje, transporte real. No se inventan estos datos.
- La ciudad de bono es una recomendación basada en una tabla por categoría. Confirma los bonos actuales en el juego, especialmente tras parches.
- Si las fuentes no permiten verificar un artículo, no se obliga al motor a fabricar cantidades inventadas.
- El escáner analiza **hasta 120 variantes por consulta** para controlar los límites AODP. Si la rama tiene más, se indica que hubo muestreo y puedes filtrar tiers para ampliar cobertura.

## Privacidad

Los borradores y ajustes se guardan en tu navegador cuando está permitido; en navegadores que bloqueen el almacenamiento se usa memoria temporal y esos datos se perderán al cerrar la página. No hay cuentas, backend privado ni rastreo de información personal.

No afiliado ni respaldado por Sandbox Interactive o Albion Online. Datos de prueba en `tests/` jamás se incluyen en `dist/`.
