# Gildem Craft Pro 8.3 · Actualización sobre tu sitio actual

1. Lee `ACTUALIZAR_EN_GITHUB_NETLIFY.md`.
2. **No crees otro repositorio ni otro sitio Netlify.** Actualiza `drzjhon-dot/gildem-craft-pro-live`.
3. Copia los archivos y carpetas de este paquete a la raíz del repositorio, conservando su carpeta oculta `.git`.
4. En GitHub Desktop: `Commit to main` → `Push origin`.
5. En Netlify: espera el estado **Published**.
6. Abre `/version.json`: debe ser `8.3.0`. Abre `/.netlify/functions/health`: debe indicar `status: ok`.
7. En **Plan de crafting** solo verás armas, armaduras y accesorios. En **Encontrar oportunidades** puedes activar la categoría **Refinamiento** y escoger los materiales a refinar.

Si algo falla, conserva el log completo de **Deploys** para identificar la causa exacta. El proyecto ha superado 110 pruebas locales; no podemos garantizar las peticiones AODP en producción hasta probarlas en tu sitio.
