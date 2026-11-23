# TribiTrip: backend y clientes
Requiere Node.js 24 y MongoDB local o Atlas. Se usa MongoDB por decisión del proyecto, sustituyendo las referencias a PostgreSQL del backlog.

## Preparación
Desde tribitrip/tribitrip:
1. Ejecutar `npm ci`.
2. Ejecutar `npm --prefix server ci`.
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

En **Cotizaciones → Catálogo de servicios**, pulsa **Nuevo servicio** para registrar un servicio o paquete en el catálogo compartido. Captura nombre, descripción y precio de referencia en MXN. Destino, categoría y proveedor son opcionales. Usa la búsqueda para consultar servicios por nombre o destino y seleccionarlos al cotizar.

Para cotizar, selecciona un cliente y una oportunidad accesible. Agrega líneas manuales o del catálogo, ajusta cantidades, descripciones y precios, y registra vigencia, condiciones y observaciones. También puedes abrir el listado de cotizaciones desde el detalle de una oportunidad. El formulario admite impuestos y cargos como importes fijos opcionales. Trabaja en MXN y usa hasta dos decimales. La API calcula y guarda los importes en centavos y asigna un folio basado en el ObjectId completo.

**Crear nueva versión** archiva la versión actual y abre otro borrador con el mismo folio y los mismos vínculos. La revisión evita sobrescribir cambios concurrentes. Cada línea de catálogo conserva el nombre, la descripción de referencia, el destino, el proveedor y el precio de referencia capturados al agregarla, además de la descripción y el precio aplicado.

Una versión vigente pasa de **Borrador** a **Enviada**. Desde Enviada se puede registrar aceptación o rechazo mientras siga vigente. Al terminar la fecha en Ciudad de México, un borrador o una cotización enviada aparecen como **Vencida** y se puede registrar ese estado desde el detalle. Las versiones enviadas, rechazadas y vencidas pueden archivarse para abrir un nuevo borrador. La aceptación bloquea el folio y fija el número de versión aceptada. Solo puede haber una cotización aceptada por oportunidad.

En el detalle, usa **Ver documento imprimible** o abre una versión anterior. **Imprimir o guardar como PDF** abre el diálogo del navegador. El documento usa los importes persistidos y los datos de cliente capturados para esa versión. Las cotizaciones anteriores al versionado se leen como versión 1 y, si todavía carecen de captura del cliente, el documento consulta su ficha actual. La primera escritura captura esos datos.

Para verificar en un entorno MongoDB aislado, recorre el alta y el versionado, comprueba el acceso con dos asesores y un administrador y abre los documentos de ambas versiones. Valida la impresión en navegador con cotizaciones de una y muchas líneas, el rechazo tras expirar, el bloqueo tras aceptar y los conflictos de edición y aceptación simultáneas. Confirma que el índice único parcial esté creado y que cambiar el catálogo no afecte los importes históricos.

## Reservas y pagos informativos

Desde **Reservas → Nueva reserva**, o desde una cotización aceptada, selecciona la cotización y registra la reserva interna. La oportunidad debe estar en etapa Ganada y debe pertenecer al mismo cliente y asesor. Puedes capturar un localizador externo y un proveedor de referencia manualmente. El CRM copia las fechas de la solicitud y los servicios e importes de la versión aceptada. Si ya se reservó esa cotización, abre la reserva existente. En **Clientes y prospectos**, la acción **Historial de reservas** muestra las reservas de ese contacto.

Una reserva empieza como **Pendiente de pago**. Puede pasar a Confirmada o Cancelada. Una Confirmada puede pasar a En viaje o Cancelada. En viaje solo pasa a Completada. Completada y Cancelada son terminales. La confirmación es un estado interno y puede registrarse con saldo pendiente.

En el detalle, **Registrar pago informativo** captura fecha, monto, método, referencia y observaciones. El servidor calcula el total reportado y resta ese monto del importe acordado. Se rechazan fechas futuras, sobrepagos y duplicados por método y referencia dentro de la reserva. Las reservas canceladas conservan su historial y dejan de recibir pagos. Las completadas admiten registros posteriores de pagos reportados. El historial se agrega sin edición, anulación o reembolso desde esta versión.

Para verificar con MongoDB en un entorno aislado, registra desde una cotización aceptada de oportunidad ganada y comprueba el historial del cliente, los estados, los índices únicos y la visibilidad con dos asesores. Repite el alta simultáneamente y comprueba que ambas respuestas señalen la misma reserva. Registra pagos concurrentes con un saldo insuficiente para ambos y verifica que la suma nunca exceda el importe acordado. Recarga el detalle en navegador y confirma que los datos históricos se conservan.

## Ficha comercial, búsquedas y reportes

Abre un cliente por su nombre en el listado para consultar su ficha y navegar a los registros relacionados. La ficha consulta los módulos de origen y la edición de contacto usa `revisionContacto` para detectar conflictos. Los documentos aceptados y las reservas conservan sus copias históricas.

Los listados de clientes, oportunidades, cotizaciones y reservas aplican filtros y paginación en el servidor. El filtro por asesor en oportunidades es administrativo.

En el dashboard, clientes son contactos activos e inactivos. Los prospectos se cuentan aparte. Conversión es ganadas entre ganadas y perdidas, o 0 si todavía no hay cierres. Las ventas suman el importe acordado de reservas no canceladas, incluidas pendientes de pago. Los pagos siguen siendo informativos.

En **Reportes comerciales**, selecciona hasta 366 días inclusivos en Ciudad de México. Destinos usa la fecha de alta de la solicitud y agrupa variaciones de espacios, mayúsculas y acentos. Ventas usa la fecha de registro de la reserva, con agrupación mensual y la misma regla del dashboard. Una cancelación excluye la reserva de los reportes posteriores para su mes original.

## Verificación

Consulta [PLAN_PRUEBAS_MVP.md](PLAN_PRUEBAS_MVP.md) para las pruebas en un entorno autorizado, incluida la revisión obligatoria de impresión y guardado como PDF.
npm.cmd run lint
npm.cmd run build
npm.cmd --prefix server test

Prueba manual con MongoDB: crear administrador, iniciar sesión, crear asesor, registrar y editar contacto, intentar duplicado, cerrar sesión; comprobar con otro asesor que no puede consultar el contacto ajeno ni administrar usuarios. Desactivar el asesor y comprobar que su sesión deja de funcionar.
## Render y registros HTTP

Configura un Web Service Node.js 24 por ambiente, con la raíz del repositorio como directorio de trabajo. Usa `npm ci --include=dev && npm --prefix server ci --omit=dev && npm run build` como comando de compilación y `node server/index.js` como comando de inicio. Configura `SKIP_INSTALL_DEPS=true` para que el comando de compilación controle la instalación y `NODE_VERSION` con una versión de Node 24.

Inyecta `MONGODB_URI` del ambiente, `APP_ORIGIN` con su origen HTTPS público y `NODE_ENV=production`. Render suministra `PORT` y `RENDER=true`. Fuera de Render el host predeterminado es `127.0.0.1`. Se puede definir `HOST` explícitamente. El servicio entrega la SPA compilada y `/api` bajo el mismo origen. El chequeo de salud de Render puede usar `/api/health`.

Desde la pestaña Network del navegador, copia el valor de `X-Request-ID` y búscalo en Render Logs. Cada respuesta completada genera un evento JSON `http_request` con método, ruta normalizada, estado y duración. Un fallo interno registra además un evento `http_error` con el mismo ID. Esto permite seguir una solicitud dentro de Express mediante correlación de logs. El alcance se limita al proceso de la aplicación.

Para calcular métricas en una ventana, cuenta solo los eventos `http_request` completados. Calcula el porcentaje de 5xx dividiendo su número entre el total de eventos de la muestra. Usa `durationMs` para el promedio y percentiles como p95.
Documentación de referencia: https://expressjs.com/en/5x/guide/error-handling/ y https://mongoosejs.com/docs/validation.html
