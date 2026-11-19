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
HU-003 y HU-004 avanzadas: siguen pendientes paginación y ficha comercial de contactos. F05 queda fuera del alcance.

## Solicitudes y viajeros

En el menú **Solicitudes de viaje**, selecciona **Nueva solicitud** y un contacto accesible para registrar el viaje. Abre una solicitud del listado para editarla o registrar y editar acompañantes. El asesor responsable es el propietario del contacto. El administrador puede operar todos los contactos y el asesor opera los propios.

Las solicitudes y los viajeros se almacenan como subdocumentos de cliente. El borrado del contacto queda bloqueado mientras tenga solicitudes, incluso canceladas. La cantidad de viajeros de la solicitud debe cubrir a todos los acompañantes registrados.

Las pruebas HTTP usan persistencia simulada. Para verificar la integración en un entorno MongoDB aislado y autorizado, comprueba que una solicitud y sus viajeros se conservan al recargar, que otro asesor no puede consultarlos ni modificarlos y que el borrado del contacto devuelve un conflicto. Comprueba también que dos altas simultáneas con un solo lugar disponible no exceden el cupo.

## Oportunidades y embudo

En **Oportunidades**, registra un título y selecciona una solicitud de viaje accesible. El cliente y el responsable se toman del vínculo con esa solicitud. Un administrador puede crear la oportunidad para un contacto de cualquier propietario; un asesor solo puede crearla y editarla dentro de su ámbito.

La etapa inicial es **Solicitud recibida**. El detalle permite cambiar libremente entre las seis etapas de RF-05, incluidas Ganada y Perdida. El cierre registra el resultado y su fecha. Volver a una etapa abierta limpia la fecha de cierre. Si otra edición guardó una revisión más reciente, recarga el detalle antes de volver a editar.

En **Embudo de ventas**, disponible para administradores, filtra por responsable o estado y abre el detalle desde cada tarjeta. La vista consulta la API al entrar, al cambiar filtros y al pulsar **Actualizar embudo**.

Para verificar la integración con MongoDB en un entorno autorizado, comprueba el vínculo con la solicitud tras recargar, las restricciones con dos asesores y un administrador, el conflicto con dos pestañas editando la misma revisión y el movimiento de las tarjetas y sus conteos al cambiar de etapa.

## Catálogo y cotizaciones

En **Cotizaciones**, abre el **Catálogo de servicios** para buscar por nombre o destino, filtrar por destino y seleccionar un servicio. El catálogo consulta documentos de MongoDB mediante los endpoints de lectura. Para ver resultados, el entorno autorizado debe contar con registros válidos en la colección del modelo `ServicioTuristico`. Cada registro necesita nombre, descripción y precio en centavos. El tipo puede ser Servicio o Paquete y el destino, la categoría y el proveedor son opcionales.

Para cotizar, selecciona un cliente y una oportunidad accesible. Agrega líneas manuales o del catálogo, ajusta cantidades, descripciones y precios, y registra vigencia, condiciones y observaciones. También puedes abrir el listado de cotizaciones desde el detalle de una oportunidad. El formulario admite impuestos y cargos como importes fijos opcionales. Trabaja en MXN y usa hasta dos decimales. La API calcula y guarda los importes en centavos y asigna un folio basado en el ObjectId completo.

**Crear nueva versión** archiva la versión actual y abre otro borrador con el mismo folio y los mismos vínculos. La revisión evita sobrescribir cambios concurrentes. Cada línea de catálogo conserva el nombre, la descripción de referencia, el destino, el proveedor y el precio de referencia capturados al agregarla, además de la descripción y el precio aplicado.

Una versión vigente pasa de **Borrador** a **Enviada**. Desde Enviada se puede registrar aceptación o rechazo mientras siga vigente. Al terminar la fecha en Ciudad de México, un borrador o una cotización enviada aparecen como **Vencida** y se puede registrar ese estado desde el detalle. Las versiones enviadas, rechazadas y vencidas pueden archivarse para abrir un nuevo borrador. La aceptación bloquea el folio y fija el número de versión aceptada. Solo puede haber una cotización aceptada por oportunidad.

En el detalle, usa **Ver documento imprimible** o abre una versión anterior. **Imprimir o guardar como PDF** abre el diálogo del navegador. El documento usa los importes persistidos y los datos de cliente capturados para esa versión. Las cotizaciones anteriores al versionado se leen como versión 1 y, si todavía carecen de captura del cliente, el documento consulta su ficha actual. La primera escritura captura esos datos.

Para verificar en un entorno MongoDB aislado, recorre el alta y el versionado, comprueba el acceso con dos asesores y un administrador y abre los documentos de ambas versiones. Valida la impresión en navegador con cotizaciones de una y muchas líneas, el rechazo tras expirar, el bloqueo tras aceptar y los conflictos de edición y aceptación simultáneas. Confirma que el índice único parcial esté creado y que cambiar el catálogo no afecte los importes históricos.

## Verificación
npm.cmd run lint
npm.cmd run build
npm.cmd --prefix server test

Prueba manual con MongoDB: crear administrador, iniciar sesión, crear asesor, registrar y editar contacto, intentar duplicado, cerrar sesión; comprobar con otro asesor que no puede consultar el contacto ajeno ni administrar usuarios. Desactivar el asesor y comprobar que su sesión deja de funcionar.
Para producción servir frontend y /api bajo el mismo origen mediante HTTPS, configurar APP_ORIGIN con el origen público y NODE_ENV=production. La API escucha en loopback para uso detrás de un proxy.
Documentación de referencia: https://expressjs.com/en/5x/guide/error-handling/ y https://mongoosejs.com/docs/validation.html
