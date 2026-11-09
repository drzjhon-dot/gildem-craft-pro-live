# Actualizar GitHub + Netlify a v8.5.0

1. Descarga y descomprime el ZIP de **v8.5.0**.
2. En GitHub Desktop, abre `https://github.com/drzjhon-dot/gildem-craft-pro-live`.
3. Copia el contenido del ZIP descomprimido en la **raíz del repositorio local**, manteniendo `.git` y reemplazando archivos existentes.
4. Haz `Commit to main` y `Push origin`.
5. Netlify compilará automáticamente y publicará el resultado. Verifica `/version.json` en tu dominio; tiene que decir `8.5.0`.

**Importante:** el ZIP lleva menos de 100 archivos y **no incluye `dist`, `node_modules` ni `.git`**. GitHub Web también puede subir ese contenido, pero GitHub Desktop es más fiable para reemplazar carpetas completas. No metas una carpeta extra entre `package.json` y la raíz del repositorio.

El sitio publicado no se actualiza solo por descargar el ZIP. Las recetas y los precios requieren acceso a AODP desde el navegador/Netlify.
