# GitHub Desktop → Netlify · v8.6.6

1. Asegúrate de que no hay un Merge pendiente. Si lo hay, guarda una copia de tu trabajo y cancela el Merge antes de continuar.
2. Haz Fetch/Pull desde `main` en GitHub Desktop.
3. Si tu carpeta tiene v8.6.5, extrae y copia el ZIP «SOLO_CAMBIOS_DESDE_8_6_5». Para versiones desconocidas, clona el repositorio en una carpeta nueva y copia el ZIP completo.
4. Repository → Show in Explorer. Copia los archivos y **carpetas internas** del ZIP directamente ahí. No crees otra carpeta que envuelva `app.js`.
5. Commit to main → Push origin. Netlify recibirá el cambio cuando haya créditos para el deploy.
6. En Netlify Deploys comprueba Published; en la app verifica que muestra `v8.6.6`.
7. Genera un plan usando «Usar todo lo posible» y comprueba capital utilizado, actividad semanal y profundidad de materiales.

**No subas 120 archivos manualmente desde la web de GitHub:** usa Desktop o un ZIP de menos de 100 cambios. Nunca hagas Force Push para resolver conflictos.
