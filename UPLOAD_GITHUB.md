# Sube v9.0 NOVA sin conflictos

Esta carpeta es **el proyecto completo** (no un parche). No mezcles archivos antiguos.

## Método recomendado: GitHub Desktop

1. Haz una copia de seguridad del repositorio antiguo si quieres conservar tus planes/código.
2. Abre la carpeta local de tu repositorio `gildem-craft-pro-live` en el Explorador.
3. Elimina todos los archivos antiguos dentro de esa carpeta **excepto la carpeta oculta `.git`**. No borres `.git`.
4. Descomprime el ZIP de NOVA y copia **todo su contenido** directamente a esa carpeta, conservando las subcarpetas `src`, `netlify/functions`, `scripts`, `assets` y `tests`.
5. Abre GitHub Desktop: comprueba que aparezcan los archivos nuevos y las eliminaciones de los viejos, selecciona Commit y luego Push origin.
6. Netlify construirá con `npm run build` y publicará `dist` (definido en `netlify.toml`).

## Método alternativo: web de GitHub

En un repositorio limpio, usa Add file > Upload files. Arrastra **todos los archivos y directorios descomprimidos**, no el ZIP como un solo archivo. Si GitHub no permite subir carpetas anidadas en tu navegador, usa GitHub Desktop.

## Verificar antes de publicar

```sh
npm test
npm run build
```

No subas `dist/` manualmente: Netlify la generará. No dejes los tests v8 ni el `app.js` antiguo. Esta entrega funciona sin ellos.

Los datos de mercado reales dependen de AODP West; sus cotizaciones pueden faltar. La versión v9 usa recetas RAW de ao-bin-dumps y conserva un respaldo comunitario, sin recetas ficticias para operar.
