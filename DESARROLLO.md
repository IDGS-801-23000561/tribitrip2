# TribiTrip: backend y clientes
Requiere Node.js 24 y MongoDB local o Atlas. Se usa MongoDB por decisión del proyecto, sustituyendo las referencias a PostgreSQL del backlog.

## Preparación
Desde tribitrip/tribitrip:
1. Ejecutar npm.cmd install.
2. Ejecutar npm.cmd --prefix server install.
3. Copiar server/.env.example a server/.env.
4. Configurar MONGODB_URI y una ADMIN_PASSWORD de 12 a 128 caracteres. No compartir .env ni credenciales.
5. Ejecutar npm.cmd --prefix server run seed:admin (una sola vez).
6. En una terminal: npm.cmd --prefix server run dev.
7. En otra terminal: npm.cmd run dev.
8. Abrir http://localhost:5173 e ingresar con ADMIN_EMAIL y la contraseña configurada.

## Alcance implementado
Sesiones de ocho horas con cookie HttpOnly y SameSite estricto, tokens aleatorios almacenados como hash, contraseñas scrypt, límites de intentos y validación de origen. La desactivación y los cambios de usuario invalidan sus sesiones.
Administrador: consulta todos los contactos y administra usuarios. Asesor: registra y administra únicamente sus propios contactos. No se permite desactivarse ni quitarse el rol de administrador.
Clientes con alta, consulta, edición, eliminación, validación en servidor e índices únicos globales para correo y teléfono. Los duplicados no revelan datos de otros asesores.
Los contactos anteriores de localStorage no se borran ni se importan automáticamente; no pertenecen a una cuenta autenticada.
HU-003 y HU-004 avanzadas: siguen pendientes paginación, ficha comercial y relaciones con solicitudes/oportunidades. Viajeros y módulos de semana 3 siguen pendientes. F05 queda fuera del alcance.

## Verificación
npm.cmd run lint
npm.cmd run build
npm.cmd --prefix server test

Prueba manual con MongoDB: crear administrador, iniciar sesión, crear asesor, registrar y editar contacto, intentar duplicado, cerrar sesión; comprobar con otro asesor que no puede consultar el contacto ajeno ni administrar usuarios. Desactivar el asesor y comprobar que su sesión deja de funcionar.
Para producción servir frontend y /api bajo el mismo origen mediante HTTPS, configurar APP_ORIGIN con el origen público y NODE_ENV=production. La API escucha en loopback para uso detrás de un proxy.
Documentación de referencia: https://expressjs.com/en/5x/guide/error-handling/ y https://mongoosejs.com/docs/validation.html
