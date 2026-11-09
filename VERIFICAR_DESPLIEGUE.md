# Verificación del despliegue

| URL de tu nuevo sitio | Resultado esperado | Si falla |
|---|---|---|
| `/version.json` | JSON versión `7.4.3` | `404`: carpeta `dist` no publicada o despliegue antiguo |
| `/.netlify/functions/health` | JSON `status: ok` | `404`: funciones no desplegadas o sitio equivocado |
| `/.netlify/functions/recipes` | JSON con recetas verificadas | `503`: fuente pública inaccesible, revisar logs |
| `/.netlify/functions/market?region=west&kind=prices&items=T4_BAG&locations=Martlock&qualities=1` | JSON de cotizaciones | `502`/`429`: problema AODP; puede ser temporal |
| `/.netlify/functions/snapshot?region=west` | Snapshot horario (cuando se ejecute) | `404` al inicio es posible |

En Netlify, la vista **Functions** (o Logs & metrics > Functions, según plan) debe mostrar `health`, `market`, `recipes`, `item-image`, `snapshot` y `hourly-prices`.

La compilación y las pruebas de Node se pueden ejecutar localmente mediante `npm run preflight` y `npm run build`. La instalación de dependencias requiere acceso a npm; la prueba local de este paquete no confirma que npm ni AODP respondan desde Netlify.
