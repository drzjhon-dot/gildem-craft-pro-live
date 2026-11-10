# Gildem Craft Pro v8.5.5

Proyecto completo para **Albion Online**, servidor **América / West** por defecto, listo para subir a GitHub y desplegar automáticamente mediante Netlify. Incluye código fuente, tests, recursos gráficos y Netlify Functions. **No requiere ejecutar Python** para utilizarlo ni desplegarlo.

## Herramientas

- **Black Craft:** selecciona una rama y los objetos deseados; busca exclusivamente oportunidades para el **Mercado Negro**. Se permite configurar T4–T8, .1–.4, Focus, bonos de ciudad, bono diario 0/10/20% y presupuesto 5/10/15/20M mediante casillas compactas.
- **Royal Craft:** interfaz compacta equivalente, con destino fijo a **mercados Royal** y comparación conservadora de ciudades.
- **Level Craft:** planes para subir especializaciones, con venta prioritaria, fama estimada, estudio opcional y límite de riesgo por mercado.
- **Resultados:** dashboard oscuro con fondos fantasy, tarjetas de capital, profit, ROI y Focus; iconos del catálogo real de Albion cuando hay conexión, cantidades editables, lista de materiales y diarios, distribución del presupuesto y comprobación antes de comprar. Botones para copiar, exportar y guardar.

## Fiabilidad de mercado

El motor utiliza datos públicos del **Albion Online Data Project (AODP)**. Los precios, históricos de actividad y libros de órdenes son observaciones comunitarias y **no garantizan ejecución, disponibilidad del volumen, demanda futura ni beneficio**. La verificación previa vuelve a consultar precios y profundidad disponible, e informa de lo que no puede comprobar. La protección de compras intenta limitar la exposición a materiales caros y los cambios de precio que causaría comprar demasiado.

Si el mercado no presenta oportunidades con suficiente rentabilidad o evidencia, **no se obliga a gastar todo el silver**. Los diarios y Focus solo deben contabilizarse cuando sus costos o cantidades sean estimables con datos confiables.

## Instalación para usuarios de Windows

Lee **`SUBIR_A_GITHUB_DESDE_WINDOWS.md`**. Este ZIP contiene **los archivos finales, no un reparador**. No hay que ejecutar `.bat`, PowerShell ni Python.

## Verificación de desarrollador

Usa Node.js 22:

```bash
npm install --ignore-scripts --no-audit --no-fund
npm run preflight
npm test
npm run build
```

El comando `npm run build` también ejecuta el preflight y los tests antes de construir `dist/`.

## Despliegue Netlify

El archivo `netlify.toml` ya configura `command = "npm run build"`, publicación desde `dist` y funciones en `netlify/functions`. La versión visible, service worker, endpoint de salud y `dist/version.json` son **v8.5.5**.

El prefetched de imágenes está desactivado en Netlify para impedir que fallos de terceros bloqueen la compilación; los iconos del juego se consultan cuando se usa la web y tienen respaldo local.
