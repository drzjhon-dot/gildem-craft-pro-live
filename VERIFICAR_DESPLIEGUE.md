# Verificación Gildem Craft Pro v8.2.0

| Enlace | Resultado esperado |
|---|---|
| https://endearing-piroshki-ea4758.netlify.app/version.json | JSON con `"version": "8.2.0"` |
| https://endearing-piroshki-ea4758.netlify.app/.netlify/functions/health | JSON con `"status": "ok"`, `"version": "8.2.0"` |
| https://endearing-piroshki-ea4758.netlify.app/ | Tres pestañas: Plan de crafting, Encontrar oportunidades y Ajustes y datos |

## Pruebas funcionales

- **Plan de crafting:** filtros de familias de objeto, búsqueda en español, tier y encantamiento; tarjeta de refinado visible.
- **Encontrar oportunidades:** categorías → ramas que yo marque → objetos específicos; filtros aplicados a la selección real de recetas.
- **Encontrar oportunidades:** refinamiento compare/forzar/apagado afectando costo y lista de materiales si hay datos verificables.
- **Monturas:** aparecen familias detectadas del catálogo especial y no se mezclan cuando se selecciona una sola.
- **Avisos:** sin cotizaciones suficientes, el plan no inventa un precio ni promete ventas.

Si aparecen datos antiguos, comprueba primero `/version.json`. Si dice `8.2.0` pero la interfaz no, haz una recarga forzada; usa limpieza del service worker solo después de exportar respaldo de datos locales.
