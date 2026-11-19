# Estado técnico y funcional de TribiTrip

## 1. Resumen ejecutivo del estado actual

TribiTrip es un CRM para una agencia de viajes. El repositorio contiene los flujos de autenticación por correo, administración de usuarios, gestión de clientes y prospectos, solicitudes de viaje, viajeros asociados, oportunidades comerciales, embudo de ventas, catálogo de servicios, cotizaciones con historial y documentos imprimibles, reservas y pagos informativos. El frontend y la API están conectados en el código para estos flujos. Su operación con datos persistentes y en navegador queda **NO VERIFICADA** en esta auditoría.

El MVP usa exclusivamente MongoDB y comprende seis épicas (F01, F02, F03, F04, F06 y F07) y 17 historias. F05, HU-013 y HU-014 están fuera del alcance. La evaluación arroja **0 COMPLETADAS, 3 PARCIALES, 1 PENDIENTE y 13 NO VERIFICADAS**. Pasaron ESLint, el build de Vite y quince pruebas de servidor sin conexión a MongoDB. El panel principal presenta tarjetas estáticas.

Se revisaron [actividades tribitrip.txt](<actividades tribitrip.txt>) como fuente de criterios, [informacion tribitrip.txt](<informacion tribitrip.txt>) como contexto de requisitos, [cronograma tribitrip.txt](<cronograma tribitrip.txt>) como planificación y [DESARROLLO.md](DESARROLLO.md) como guía técnica. El código determina la implementación observada. Las referencias históricas a una base relacional y a actividades excluidas quedan subordinadas al alcance vigente. [README.md](README.md) conserva el contenido de plantilla de Vite.

## 2. Arquitectura y tecnologías implementadas

- **Cliente.** SPA en JavaScript y JSX con React 19, React Router 8, Vite 8 y Lucide React. Usa contexto para sesión, estado local para formularios y filtros, Fetch para la API y CSS global y por vista con reglas responsivas. Su comportamiento visual queda sin prueba en navegador.
- **Servidor.** Node.js con módulos ES, Express 5, Helmet, cookie-parser y express-rate-limit. `app.js` define rutas y reúne middleware, validación, lógica de negocio y acceso a modelos. No hay directorios independientes de controladores, servicios o repositorios. `index.js` separa el arranque de la aplicación HTTP para facilitar pruebas.
- **Persistencia.** MongoDB con Mongoose 9 y siete modelos de colección (`Usuario`, `Sesion`, `Cliente`, `Oportunidad`, `ServicioTuristico`, `Cotizacion`, `Reserva`). Los esquemas de solicitud y viajero se alojan como subdocumentos de cliente. El destino y presupuesto del contacto son preferencias del contacto.
- **Herramientas.** ESLint 10 con reglas JS, React Hooks y React Refresh, y pruebas nativas con `node:test`. Los manifiestos de raíz y servidor declaran dependencias independientes. Hay lockfiles locales de ambos paquetes, ignorados por Git.

## 3. Estructura de carpetas y archivos importantes

| Ruta | Responsabilidad |
| --- | --- |
| [index.html](index.html), [src/main.jsx](src/main.jsx), [src/App.jsx](src/App.jsx) | Entrada HTML, montaje de React con BrowserRouter y proveedor de sesión. |
| [src/routes/AppRoutes.jsx](src/routes/AppRoutes.jsx), [src/layouts/MainLayout.jsx](src/layouts/MainLayout.jsx), [src/components/Sidebar.jsx](src/components/Sidebar.jsx) | Rutas públicas y privadas, control de acceso visual, navegación y cierre de sesión. |
| [src/auth/](src/auth/), [src/services/api.js](src/services/api.js) | Contexto, restauración y expiración de sesión, cliente HTTP compartido. |
| [src/pages/Login.jsx](src/pages/Login.jsx), [src/pages/Usuarios.jsx](src/pages/Usuarios.jsx) | Inicio de sesión y administración de cuentas. |
| [src/pages/clientes/](src/pages/clientes/), [src/components/ConfirmDialog.jsx](src/components/ConfirmDialog.jsx) | Listado, filtros, formulario de contacto y confirmación de borrado. |
| [src/pages/dashboard/Dashboard.jsx](src/pages/dashboard/Dashboard.jsx) | Vista principal con indicadores estáticos. |
| `src/App.css`, `src/index.css`, `src/accounts.css`, `src/assets/`, `public/` | Estilos generales y de cuenta, imágenes y SVG. |
| [server/index.js](server/index.js), [server/app.js](server/app.js), [server/models.js](server/models.js), [server/security.js](server/security.js) | Arranque, API, esquemas y utilidades criptográficas. |
| [server/travel-models.js](server/travel-models.js), [server/travel-routes.js](server/travel-routes.js), [server/travel.test.js](server/travel.test.js), [src/pages/solicitudes/](src/pages/solicitudes/) | Esquemas de viaje, rutas protegidas, pruebas sin MongoDB y componentes de listado, formulario, detalle y viajeros. |
| [server/opportunity-model.js](server/opportunity-model.js), [server/opportunity-routes.js](server/opportunity-routes.js), [server/opportunity.test.js](server/opportunity.test.js), [src/pages/oportunidades/](src/pages/oportunidades/), [shared/oportunidades.js](shared/oportunidades.js) | Modelo de oportunidad, API, pruebas, listado, detalle, embudo y etapas compartidas. |
| [server/quote-models.js](server/quote-models.js), [server/quote-routes.js](server/quote-routes.js), [server/quote.test.js](server/quote.test.js), [src/pages/cotizaciones/](src/pages/cotizaciones/), [shared/cotizaciones.js](shared/cotizaciones.js) | Catálogo, cotizaciones, pruebas HTTP, pantallas y cálculo monetario compartido. |
| [server/reservation-model.js](server/reservation-model.js), [server/reservation-routes.js](server/reservation-routes.js), [server/reservation.test.js](server/reservation.test.js), [src/pages/reservas/](src/pages/reservas/) | Reservas internas, pagos embebidos, endpoints protegidos, pruebas y vistas de listado, alta, detalle e historial. |
| [server/seed.js](server/seed.js) | Alta inicial del administrador. Revisado en código, sin ejecución. |
| [server/app.test.js](server/app.test.js), [server/security.test.js](server/security.test.js) | Pruebas HTTP, validación de modelos y criptografía. |
| [package.json](package.json), [server/package.json](server/package.json), [vite.config.js](vite.config.js), [eslint.config.js](eslint.config.js), [azure-pipelines.yml](azure-pipelines.yml) | Scripts, dependencias, proxy, lint y definición de CI. |

## 4. Funcionalidades existentes

| Flujo | Implementación observada |
| --- | --- |
| Sesión | Formulario de correo y contraseña, restauración al cargar, redirección de rutas privadas y cierre desde el encabezado. |
| Usuarios | Listado y formulario para alta y edición, asignación de rol, activación o desactivación y cambio opcional de contraseña. La vista y la API limitan el acceso al administrador. |
| Clientes y prospectos | Alta, listado, consulta individual en API, edición y borrado físico con confirmación en UI. El formulario cubre datos básicos, origen, estado, contacto preferido, destino y presupuesto. |
| Consulta de contactos | Filtro por estado y búsqueda por nombre, correo o teléfono en memoria. La vista computa totales, prospectos, activos e inactivos sobre el listado recibido. |
| Solicitudes | Listado, alta, detalle y edición con destino, fechas, presupuesto, cantidad de viajeros, necesidades y estado. |
| Viajeros | Alta, consulta y edición desde el detalle de solicitud, con relación al titular, fecha de nacimiento opcional y conteos por categoría. |
| Oportunidades | Alta, listado, detalle y edición de título y etapa con vínculo a una solicitud y responsable asignado. |
| Embudo de ventas | Vista administrativa con grupos y conteos desde la API, filtros y enlaces al detalle. |
| Catálogo | Consulta y búsqueda de servicios y paquetes por nombre o destino, detalle y selección para cotizar. |
| Cotizaciones | Alta, detalle, listado general o por oportunidad y edición con folio, vigencia, términos, conceptos y totales calculados. |
| Estados y documentos | Transiciones de cotización, aceptación vinculada a una versión, historial y documento imprimible por versión. |
| Reservas y pagos informativos | Alta desde cotización aceptada, historial por cliente, estados, registro de pagos y saldo calculado por la API. |
| Navegación | Layout privado y menú de módulos. |

Los únicos comportamientos comprobados por ejecución se enumeran en la sección 9.

## 5. Estado de las 17 historias de usuario

**COMPLETADA** requiere evidencia suficiente de todos los criterios aplicables. **PARCIAL** indica que existe una parte funcional en código y se identifican criterios faltantes. **PENDIENTE** indica ausencia de flujo funcional. **NO VERIFICADA** indica que se encontró el flujo para los criterios, pero falta una comprobación decisiva que requiere persistencia o sesiones reales. Una ruta placeholder cuenta como navegación.

| ID | Nombre | Estado | Funcionalidades implementadas | Funcionalidades faltantes | Archivos que contienen la implementación | Evidencia de pruebas | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HU-001 | Iniciar sesión en el sistema | NO VERIFICADA | Validación de credenciales, cuenta activa, sesión persistida, rutas privadas y cierre. | Sin brecha funcional identificada frente al criterio. Falta comprobar la ejecución completa. | `src/pages/Login.jsx`, `src/auth/SessionProvider.jsx`, `src/routes/AppRoutes.jsx`, `src/layouts/MainLayout.jsx`, `server/app.js`, `server/security.js`, `server/models.js` | Pasan acceso anónimo 401, origen ajeno 403, cuerpo inválido 400 y verificación de hash. | Pendientes login correcto e incorrecto con cuentas reales de prueba, inactividad, cookie, restauración, expiración y logout completo. |
| HU-002 | Administrar usuarios y roles | NO VERIFICADA | Alta, listado, edición, rol y estado. Restricción administrativa en UI y API. | Sin brecha funcional identificada frente al criterio. Falta comprobar la ejecución completa. | `src/pages/Usuarios.jsx`, `src/routes/AppRoutes.jsx`, `src/components/Sidebar.jsx`, `server/app.js`, `server/models.js` | Pasa rechazo de un rol fuera del enum. | Faltan escrituras, comprobación 403 con asesor autenticado e invalidación efectiva tras cambios. |
| HU-003 | Registrar clientes y prospectos | NO VERIFICADA | Captura nombre, teléfono, correo, origen y estado. Valida campos; comprueba duplicados locales y prevé 409 por índice único. | Sin brecha funcional identificada frente al criterio. Falta comprobar persistencia e índices. | `src/pages/clientes/Clientes.jsx`, `src/services/api.js`, `server/app.js`, `server/models.js` | Pasa rechazo de correo y teléfono inválidos, presupuesto negativo y asesor ausente al validar el modelo. | Verificar alta válida y duplicados reales por correo o teléfono, incluidos los que el asesor no puede listar. |
| HU-004 | Consultar y actualizar clientes | PARCIAL | Listado, búsqueda local, filtro de estado, endpoint de detalle y edición desde tabla. | Ficha comercial con solicitudes y oportunidades, consumo de endpoint de detalle en UI y paginación prevista en tareas. | `src/pages/clientes/Clientes.jsx`, `server/app.js`, `server/models.js` | Pasa denegación anónima al listado. | Búsqueda, edición persistida y aislamiento autenticado sin verificar. |
| HU-005 | Registrar viajeros relacionados | NO VERIFICADA | Alta, consulta y edición de compañeros de viaje vinculados por su solicitud al cliente. Datos requeridos, nacimiento opcional, categorías y límite de cantidad. | Falta la comprobación integrada con MongoDB y navegador. | `server/travel-models.js`, `server/travel-routes.js`, `src/pages/solicitudes/Viajeros.jsx` | Pasan validación de esquema y pruebas HTTP con persistencia simulada para asociaciones, cupo y permisos. | Un viajero pertenece a una solicitud. El cliente se deriva de esa relación. |
| HU-006 | Registrar solicitudes de viaje | NO VERIFICADA | Alta, listado, detalle y edición con cliente, asesor, destino, fechas, presupuesto, cantidad, estado y necesidades. | Falta la comprobación integrada con MongoDB y navegador. | `server/travel-models.js`, `server/travel-routes.js`, `src/pages/solicitudes/`, `src/routes/AppRoutes.jsx` | Pasan validación de esquema y pruebas HTTP con persistencia simulada para alta, consulta, actualización, permisos y borrado de contactos. | El asesor responsable es el titular del contacto. |
| HU-007 | Gestionar oportunidades comerciales | NO VERIFICADA | Alta, listado, detalle, edición con revisión, responsable, etapas y resultados de cierre. | Verificación integrada con MongoDB y navegador. | `server/opportunity-model.js`, `server/opportunity-routes.js`, `src/pages/oportunidades/` | Pasan validaciones de modelo y pruebas HTTP con persistencia simulada de asociaciones, permisos, cambios de etapa y concurrencia. | Se asigna al propietario del contacto. |
| HU-008 | Visualizar embudo de ventas | NO VERIFICADA | Agrupación y conteos por etapa, filtros de responsable y estado, enlaces al detalle y acceso administrativo. | Verificación integrada de persistencia y experiencia de navegador. | `server/opportunity-routes.js`, `src/pages/oportunidades/Embudo.jsx` | Pasan pruebas HTTP simuladas de agrupación, filtros combinados, vacío y acceso por rol. | Recarga al entrar, cambiar filtros o pulsar Actualizar embudo. |
| HU-009 | Consultar catálogo básico de servicios turísticos | NO VERIFICADA | Listado de servicios y paquetes, búsqueda literal por nombre o destino, filtro de destino, detalle y selección desde el cotizador o una nueva cotización. | Verificar lectura y selección con MongoDB y navegador. | `server/quote-models.js`, `server/quote-routes.js`, `src/pages/cotizaciones/Catalogo.jsx` | Pasan pruebas de modelo y HTTP con datos simulados de consulta, búsqueda y selección. | Catálogo de lectura. Requiere documentos registrados en el entorno. |
| HU-010 | Generar cotizaciones personalizadas | NO VERIFICADA | Alta, consulta, listado por oportunidad, edición, folio único, vínculos, conceptos múltiples, condiciones, observaciones, vigencia y cálculo en centavos. | Verificar persistencia, índice único, concurrencia y uso en navegador. | `server/quote-models.js`, `server/quote-routes.js`, `shared/cotizaciones.js`, `src/pages/cotizaciones/` | Pasan pruebas de cálculo, modelo y HTTP con persistencia simulada, incluidos folios simultáneos, permisos y snapshots. | Impuestos y cargos opcionales de RF-06 como importes fijos. |
| HU-011 | Administrar cotizaciones y sus estados | NO VERIFICADA | Estados, transiciones con vigencia, historial numerado, consulta por versión y aceptación exclusiva por oportunidad. | Verificar índice, operaciones concurrentes y controles en navegador. | `server/quote-models.js`, `server/quote-lifecycle.js`, `server/quote-routes.js`, `src/pages/cotizaciones/CotizacionDetalle.jsx` | Pasan pruebas de transiciones, vigencia, permisos, persistencia simulada de versiones y conflicto. | Una cotización aceptada bloquea el folio y fija su versión. |
| HU-012 | Generar documento de cotización | NO VERIFICADA | HTML imprimible de la versión elegida, con datos de agencia y cliente, conceptos, términos e importes persistidos. El navegador permite imprimir o guardar como PDF. | Verificar representación y paginación real en navegador con MongoDB. | `server/quote-document.js`, `server/quote-routes.js`, `src/pages/cotizaciones/CotizacionDocumento.jsx`, `src/pages/cotizaciones/documento.css` | Pasan pruebas del contenido de versiones y de la plantilla HTML con 1 y 50 conceptos. | La impresión y el PDF dependen del navegador. |
| HU-015 | Registrar reservas de clientes | NO VERIFICADA | Alta interna desde cotización aceptada y oportunidad ganada, folio, datos comerciales y fechas, estados, detalle e historial por cliente. | Verificar índices, persistencia y flujo en navegador. | `server/reservation-model.js`, `server/reservation-routes.js`, `src/pages/reservas/`, `src/pages/clientes/Clientes.jsx`, `src/pages/cotizaciones/CotizacionDetalle.jsx` | Pasan pruebas de modelo y API con persistencia simulada para origen, copia, duplicados, estados y autorización. | Repetir el alta conserva la misma reserva. |
| HU-016 | Registrar pagos informativos | NO VERIFICADA | Registro e historial de pagos de referencia, validación, total pagado y saldo calculados en servidor. | Verificar concurrencia y recarga en navegador con MongoDB. | `server/reservation-model.js`, `server/reservation-routes.js`, `src/pages/reservas/PagosInformativos.jsx` | Pasan pruebas de API y modelo para autorización, validación, deduplicación, concurrencia y saldo. | Se rechazan sobrepagos. Los registros permanecen en el historial. |
| HU-017 | Consultar indicadores comerciales | PARCIAL | Conteos de contactos y prospectos sobre datos recibidos en Clientes. Estructura de tarjetas del dashboard. | Dashboard conectado a datos, conteos de contactos y oportunidades abiertas/ganadas/perdidas, conversión y ventas. | `src/pages/dashboard/Dashboard.jsx`, `src/pages/clientes/Clientes.jsx` | Sin pruebas de indicadores. | El criterio histórico de tareas pendientes/vencidas queda fuera por decisión de alcance. |
| HU-018 | Consultar reportes comerciales | PENDIENTE | — | Destinos más solicitados, ventas por periodo, filtros de fechas y tablas o gráficas coherentes con datos persistidos. | — | Sin pruebas. | Depende de solicitudes y reservas. |
| HU-019 | Buscar y filtrar registros | PARCIAL | Búsqueda de contactos por nombre o datos de contacto y filtro por estado sobre registros que devuelve la API según su alcance. | Folios de cotización y reserva, filtros de oportunidades y reservas por estado y verificación de resultados y permisos entre módulos. | `src/pages/clientes/Clientes.jsx`, `server/app.js` | Pasa 401 sin sesión. | No se probó búsqueda con usuarios autenticados; la búsqueda actual es local a Clientes. |

## 6. Análisis detallado de cada épica incluida

- **F01 · Autenticación y gestión de usuarios.** Login, perfil y logout están conectados con React. La administración de cuentas comparte sesión y aplica el rol en servidor. El código bloquea que el administrador se desactive o pierda su propio rol de forma intencional. Falta verificar el ciclo completo con cuentas activas e inactivas y la revocación.
- **F02 · Clientes, prospectos y viajeros.** Clientes y prospectos comparten la colección de contactos, con estados Prospecto, Activo e Inactivo. Origen, contacto preferido y datos de interés se almacenan en el contacto. El listado y el formulario están conectados. Los viajeros se administran desde cada solicitud. La ficha comercial de clientes sigue pendiente. La consulta individual existente puede servir de base para la ficha.
- **F03 · Solicitudes y oportunidades.** La solicitud ya cuenta con esquema, API, listado, detalle y edición. Las oportunidades se registran desde una solicitud existente y sus etapas alimentan el embudo administrativo. Las cuatro historias de F03 tienen implementación y requieren comprobación integrada.
- **F04 · Cotizaciones.** El catálogo y cotizador tienen implementación de lectura, creación, consulta y edición. El listado por oportunidad ya está disponible. El ciclo de estados, el historial comercial y el documento imprimible por versión están implementados. Falta verificar la integración con MongoDB y navegador.
- **F06 · Reservas y pagos informativos.** El flujo registra reservas internas a partir de la versión aceptada, conserva datos comerciales y agrega pagos informativos con saldo calculado en servidor. El historial de reservas está enlazado desde Clientes. La integración con MongoDB y el navegador queda por verificar.
- **F07 · Panel, reportes y búsquedas.** El dashboard no invoca la API. Los conteos y filtros en Clientes son reutilizables como comportamiento de referencia. La vista contiene texto residual sobre actividades; no implica que ese módulo pertenezca al MVP. Los indicadores y reportes requieren datos comerciales que hoy no existen.

## 7. Integración entre frontend, backend y MongoDB

El navegador usa rutas relativas `/api` y cookies de mismo origen en `src/services/api.js`. En desarrollo, Vite escucha en el puerto 5173 con puerto estricto y reenvía `/api` a loopback en 3001. El puerto de Express admite configuración, mientras que el destino del proxy es fijo. La topología documentada de producción sirve la SPA y la API bajo el mismo origen HTTPS, con la API detrás de proxy y escuchando en loopback. La configuración efectiva de despliegue queda sin verificar.

| API | Acceso | Operaciones observadas |
| --- | --- | --- |
| `GET /api/health` | Público | Devuelve el estado de conexión de Mongoose (200 o 503 cuando la API está escuchando). |
| `POST /api/auth/login` | Público con origen validado y límite de intentos | Consulta usuario por correo normalizado, valida estado y contraseña, crea sesión y devuelve perfil. |
| `GET /api/auth/me`, `POST /api/auth/logout` | Con sesión | Devuelve perfil o borra la sesión y limpia la cookie. |
| `GET/POST /api/usuarios`, `PUT /api/usuarios/:id` | Administrador | Listado ordenado por nombre, alta y edición; revoca sesiones tras editar. |
| `GET/POST /api/clientes`, `GET/PUT/DELETE /api/clientes/:id` | Usuario activo | Lista por creación descendente, genera contactos con propietario autenticado, consulta, actualiza o elimina dentro del alcance por rol. |

`Usuario` declara correo único, hash excluido por defecto, rol y estado. `Sesion` referencia al usuario, declara token hash único e índice TTL en `expiresAt`; el middleware además exige una fecha futura. `Cliente` declara correo y teléfono únicos globales, referencia indexada a asesor y timestamps. Cada consulta de detalle, edición y eliminación por asesor incorpora su identificador. El listado del administrador incluye todos los propietarios; el alta del contacto se asigna siempre al usuario autenticado.

### Solicitudes y viajeros

`Cliente.solicitudes[]` almacena solicitudes con ObjectId, timestamps y revisión de escritura. Cada solicitud incluye `viajeros[]`, también con ObjectId y timestamps. El cliente y el responsable se derivan del documento padre. El vínculo es inmutable desde la API y el administrador puede operar solicitudes de cualquier contacto. Los asesores operan exclusivamente las solicitudes y viajeros de sus contactos. Los datos de viajeros se omiten en listados de contactos y solicitudes.

| API | Operaciones |
| --- | --- |
| `GET/POST /api/solicitudes` | Listar por fecha de registro descendente o registrar en un contacto permitido. |
| `GET/PUT /api/solicitudes/:id` | Consultar detalle o editar los campos de la solicitud. |
| `GET/POST /api/solicitudes/:id/viajeros` | Listar viajeros o registrar otro si queda cupo. |
| `PUT /api/solicitudes/:id/viajeros/:viajeroId` | Editar un viajero de la solicitud indicada. |

El alta de solicitud usa `$push` en el cliente, mientras que la eliminación física exige de forma atómica que `solicitudes.0` no exista. Si ya hay una solicitud, incluso cancelada, la API devuelve 409 y conserva el historial. Si se elimina primero el cliente, el alta devuelve 404. La revisión por solicitud evita que dos escrituras concurrentes sustituyan el mismo subdocumento durante una operación. Las fechas civiles se guardan como texto ISO `YYYY-MM-DD` y los viajeros registrados no pueden superar la cantidad declarada. No hay endpoints de borrado o traslado para solicitudes ni viajeros.

`server/index.js` espera la conexión y la inicialización de modelos antes de escuchar. Variables identificadas en código: `MONGODB_URI`, `PORT`, `APP_ORIGIN` y `NODE_ENV`; el script de alta inicial lee `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. `server/.env.example`, mencionado en DESARROLLO, no está disponible en el árbol auditado. Conexión, creación y estado real de índices únicos y TTL, persistencia y proxy en ejecución quedan **NO VERIFICADOS**.

### Oportunidades y embudo

`Oportunidad` es una colección independiente con referencias inmutables a cliente, identificador de solicitud embebida y asesor. Se verifica en una sola consulta que el cliente posee la solicitud y está dentro del ámbito del usuario. El asesor asignado coincide con el propietario del contacto. La solicitud no tiene borrado ni traslado desde la API y el contacto con solicitudes no se puede eliminar. Para introducir traslados o borrados futuros habrá que preservar también las referencias de oportunidades. La oportunidad tiene un identificador estable para futuras cotizaciones.

| API | Operación y permisos |
| --- | --- |
| `GET /api/oportunidades` | Lista las oportunidades del responsable o todas para administrador. |
| `POST /api/oportunidades` | Registra título y vínculo con una solicitud del cliente. Asigna el propietario como responsable e inicia en Solicitud recibida. |
| `GET/PUT /api/oportunidades/:id` | Consulta o actualiza título y etapa dentro del ámbito. PUT exige la revisión leída y devuelve 409 si cambió. |
| `GET /api/oportunidades/embudo` | Exclusivo del administrador. Devuelve los seis grupos de etapas y sus conteos. Acepta filtros combinables `asesor` (ID) y `estado` (Abierta, Ganada o Perdida). |

RF-05 define las etapas Solicitud recibida, Cotización, Seguimiento, Negociación, Ganada y Perdida. El backlog no prescribe un orden, por lo que se permiten transiciones directas y reaperturas. Ganada y Perdida guardan su fecha de cierre y la API deriva el resultado de la etapa. Conservar una etapa cerrada conserva su fecha, cambiar de resultado registra otra y reabrir la borra. Seguimiento es una etapa comercial de RF-05. No incluye las funciones excluidas de F05.

### Catálogo y cotizaciones

`ServicioTuristico` guarda servicios y paquetes con ObjectId, nombre, descripción, tipo, categoría, destino, proveedor y precio de referencia en centavos. HU-009 contempla consulta, búsqueda y selección, sin endpoints de administración ni integraciones externas. El catálogo es compartido por usuarios activos.

`Cotizacion` guarda relaciones inmutables con cliente, oportunidad y asesor. El alta confirma que la oportunidad corresponde al cliente y que ambos comparten asesor. La API deriva el responsable de la oportunidad y aplica el alcance por propietario. Los vínculos se conservan durante la edición. Los módulos existentes protegen contra el borrado del cliente con solicitudes y no exponen borrado o traslado de oportunidades.

| API | Operación |
| --- | --- |
| `GET /api/servicios-turisticos` | Lista registros. Admite búsqueda literal `q` por nombre o destino y filtro `destino`. |
| `GET /api/servicios-turisticos/:id` | Detalle de servicio o paquete. |
| `GET/POST /api/cotizaciones` | Lista dentro del ámbito o guarda una cotización. |
| `GET/PUT /api/cotizaciones/:id` | Consulta detalle e historial resumido o archiva la versión actual y crea un borrador con la revisión leída. |
| `PATCH /api/cotizaciones/:id/estado` | Registra un cambio permitido de la versión actual con `estado` y `revision`. |
| `GET /api/cotizaciones/:id/versiones/:version` | Devuelve los datos comerciales guardados de la versión solicitada. |
| `GET /api/cotizaciones/:id/versiones/:version/documento` | Genera el HTML imprimible de la versión solicitada. |
| `GET /api/oportunidades/:id/cotizaciones` | Lista cotizaciones de una oportunidad accesible. |

Cada cotización conserva vigencia, condiciones, observaciones, timestamps y conceptos embebidos con descripción, cantidad, precio aplicado y subtotal. Las líneas de catálogo también guardan una copia del nombre, descripción, destino, proveedor y precio de referencia. Si un concepto se conserva durante la edición, su copia se mantiene aunque el catálogo cambie.

Se intercambian precios como cadenas decimales de hasta dos posiciones. El frontend y el servidor comparten el cálculo en centavos enteros de MXN. El modelo calcula el subtotal de cada línea, la suma de líneas y el total con impuestos y cargos opcionales de RF-06. Valida cantidades enteras, importes no negativos, entre 1 y 50 conceptos y fecha de vigencia válida. El folio usa `COT-` y el ObjectId completo en mayúsculas, con índice único y sin contador compartido. La revisión de Mongoose detecta escrituras concurrentes. Es un control de concurrencia y no representa una versión comercial.

### Estados, versiones y documento

- Las cotizaciones comienzan en Borrador. Si están vigentes, Borrador pasa a Enviada y Enviada puede pasar a Aceptada o Rechazada. Pasada la vigencia inclusiva en Ciudad de México, Borrador y Enviada se leen como Vencida. El usuario puede registrar ese vencimiento. No se usa un proceso programado. Aceptada y Rechazada no se convierten en Vencida.
- Un PUT conserva el folio, archiva la versión comercial previa con su estado al archivarse e incrementa su número. El borrador nuevo puede originarse en Borrador, Enviada, Rechazada o Vencida. El contenido y estado de un archivo histórico quedan fijos. Solo la versión actual puede cambiar de estado. La cotización aceptada es terminal y queda bloqueada para edición.
- `historial[]` guarda los conceptos, referencias, precios, subtotales, total, condiciones, observaciones, vigencia, datos de cliente y fechas de cada versión anterior. La versión actual mantiene los campos de HU-010. Se archiva y reemplaza en una sola escritura con revisión optimista. Las cotizaciones previas se leen como versión 1 y, hasta su primera escritura, usan los datos actuales del cliente para el documento si carecen de una copia propia.
- La aceptación guarda `versionAceptada` y `resueltaEn`. Un índice único parcial sobre la oportunidad para el estado Aceptada impide dos aceptaciones en la misma oportunidad. La reserva identifica la cotización mediante su ID y `versionAceptada`, copia sus conceptos e importes y obtiene las fechas de la solicitud vinculada a la oportunidad.
- `quote-document.js` genera HTML de una versión persistida. La fecha de emisión es la de envío o, si todavía no se envió, la de creación de la versión. El buscador de versiones y el documento aplican el mismo alcance que el detalle. La interfaz muestra una vista previa y abre el diálogo de impresión o guardado como PDF del navegador.

### Reservas y pagos informativos

`Reserva` enlaza cliente, solicitud, oportunidad, cotización, versión aceptada y asesor. Conserva el folio de origen, la copia del cliente y de los conceptos, las fechas de viaje y los importes acordados. El servidor requiere una cotización aceptada y una oportunidad en etapa Ganada al consultar el origen. Comprueba la coincidencia de cliente, asesor y solicitud. Los módulos de origen conservan sus permisos y contratos.

| API | Operación |
| --- | --- |
| `GET/POST /api/reservas` | Lista reservas bajo el ámbito del usuario, admite filtro `estado` y registra una desde una cotización aceptada. |
| `GET /api/reservas/:id` | Detalle de reserva, importes y pagos reportados. |
| `PATCH /api/reservas/:id/estado` | Actualiza estado, localizador y proveedor de referencia según la revisión y las transiciones permitidas. |
| `GET /api/clientes/:id/reservas` | Historial de reservas del cliente. |
| `GET /api/cotizaciones/:id/reserva` | Reserva asociada o `null` para una cotización accesible sin reserva. |
| `GET/POST /api/reservas/:id/pagos` | Consulta el historial y saldo o registra un pago informativo. |

- El folio de reserva usa `RES-` y el ObjectId completo. Un índice único por cotización asegura un solo registro, incluso con solicitudes concurrentes. El primer POST devuelve 201 y los reintentos válidos devuelven 200 con la reserva original. Se conservan los datos capturados por el primer registro.
- RF-08 define los estados. Se permite Pendiente de pago → Confirmada o Cancelada, Confirmada → En viaje o Cancelada y En viaje → Completada. Completada y Cancelada son terminales. Confirmar es una decisión interna independiente del pago. El localizador y proveedor de referencia son capturas manuales.
- Los pagos se almacenan como subdocumentos de la reserva e incluyen fecha civil, centavos, método, referencia, observaciones, ID de quien registra y timestamp. Se admiten fechas no futuras en Ciudad de México y montos positivos hasta el saldo disponible. Una clave UUID permite reintentar el mismo registro. El servidor también rechaza repetir método y referencia, ignorando diferencias de mayúsculas y espacios.
- Los pagos y su total se guardan en la misma escritura con revisión optimista. Tras un conflicto, la API vuelve a verificar duplicados, cancelación y saldo. Los pagos se agregan al historial y carecen de operaciones de edición, anulación o reembolso. Se permite registrar pagos informativos en reservas completadas, pero no nuevos pagos en canceladas.
- Para F07, `totalCentavos` representa el importe acordado, `pagadoCentavos` suma lo reportado y `saldoCentavos` es la diferencia. Las reservas tienen timestamps e índices por cliente, estado y asesor combinados con fecha de registro para consultas por periodo. Los pagos incluyen fecha del movimiento y timestamp de registro. Estos importes no dependen del catálogo.

## 8. Autenticación, roles y seguridad

- Cookie de sesión de ocho horas con `HttpOnly`, `SameSite=Strict`, ruta `/api` y atributo `Secure` en producción. El servidor genera tokens con 32 bytes aleatorios y almacena su SHA-256. Las contraseñas se protegen con scrypt, sal aleatoria y comparación de tiempo constante.
- Helmet, JSON limitado a 32 KB, validación estricta de origen en métodos de escritura y límite de 15 intentos de login cada 15 minutos. El backend verifica sesión, expiración y usuario activo antes de operaciones privadas.
- El administrador gestiona cuentas y accede a todos los contactos; el asesor opera sus contactos. El backend aplica ambos permisos y el frontend oculta o redirige las rutas administrativas para asesores.
- La API valida tipos, identificadores MongoDB, formatos y estado según el modelo. Usa 400 para entradas inválidas, 401 para sesión o credenciales, 403 para origen o rol, 404 para recurso ausente o fuera del alcance y 409 para duplicados. Los 500 devuelven un mensaje genérico y el registro de errores anota el tipo.
- `api.js` publica un evento de sesión expirada en 401 fuera de login y perfil. El proveedor vuelve a estado anónimo. La inicialización silencia errores de `/auth/me`, de manera que una caída de la API puede verse como ausencia de sesión.

## 9. Pruebas disponibles y resultados

Entorno observado: Node.js 24.13.0 y dependencias presentes en raíz y servidor. Se revisaron los archivos de prueba antes de ejecutarlos. Importan `app.js` y los modelos sin llamar a `connect()`; una prueba abre un puerto efímero local. Ninguna requiere servicios externos.

| Verificación | Resultado y alcance |
| --- | --- |
| `npm.cmd run lint` | Pasó, código de salida 0 y sin hallazgos de ESLint. |
| `npm.cmd --prefix server test` | Pasó, 15 pruebas aprobadas, 0 fallos, 0 omitidas. |
| `server/app.test.js`, HTTP | Confirma 401 en listado sin sesión, 403 en login desde otro origen y 400 en login con cuerpo incompleto. |
| `server/app.test.js`, modelos | Comprueba validación en memoria de correo, teléfono, presupuesto, asesor requerido y enum de rol. |
| `server/security.test.js` | Comprueba sal variable, verificación correcta e incorrecta, rechazo de contraseña corta y transformación del token. |
| `server/travel.test.js` | Dos pruebas de esquema y una prueba HTTP con sesión y operaciones de colección simuladas. Comprueba permisos, asociaciones, estados, cupo, conflicto de escritura y borrado protegido. |
| `server/opportunity.test.js` | Pruebas de modelo y HTTP con persistencia simulada para vínculos, acceso, resultados de etapa, revisiones y filtros del embudo. |
| `server/quote.test.js` | Cinco pruebas de modelos, cálculo, vigencia, HTML y HTTP con persistencia simulada. Incluyen historial, documentos, bloqueo de cotizaciones aceptadas, rechazo, conflictos y compatibilidad previa. |
| `server/reservation.test.js` | Dos pruebas de esquema y HTTP con persistencia simulada. Cubren origen, relaciones, estados, deduplicación, permisos y saldo bajo concurrencia. |
| `npm.cmd run build` | Pasó. Generó los archivos ignorados de `dist/`. |
| `dev` y `preview` de raíz | No ejecutados. Sirven la SPA y la salida de build, respectivamente. No se encontró script de pruebas de frontend ni suite de navegador. |
| `dev`, `start`, `seed:admin` de servidor | No ejecutados. Cargan `.env`; los dos primeros inicializan MongoDB y el tercero escribe un usuario. |

**NO VERIFICADAS** las pruebas integradas de login válido, contraseña incorrecta en HTTP con usuario existente, cookie y sesión tras recarga, logout, rol asesor autenticado, revocación, CRUD, propiedad cruzada, 409 de índices, TTL y flujo desde navegador. Para realizarlas posteriormente se necesita autorización para un entorno aislado de prueba, una instancia MongoDB de pruebas con índices inicializados, cuentas y contactos ficticios y el frontend y backend en ejecución bajo el origen previsto. La auditoría y esta etapa de desarrollo no crearon `.env` ni ejecutaron seeds, instalaciones o conexiones a bases de datos. Para HU-005 y HU-006 falta recorrer alta, edición, recarga y consulta en navegador, validar el índice de solicitudes y confirmar las operaciones atómicas y las reglas de aislamiento contra MongoDB real.

Para HU-007 y HU-008 falta verificar índices y consultas de Mongoose con MongoDB real, enlaces y filtros en navegador, persistencia de cierres, competencia entre dos escrituras y visibilidad tras modificar una oportunidad.

Para HU-009 y HU-010 falta comprobar consulta a colecciones reales, índice de folio, selección desde el navegador, persistencia después de recargar, aislamiento por asesor y concurrencia de ediciones sobre MongoDB. El entorno de prueba requiere servicios registrados con datos autorizados.

Para HU-011 y HU-012 falta validar el índice parcial y la revisión optimista sobre MongoDB real, revisar documentos históricos y aceptados desde el navegador y comprobar paginación, diálogo de impresión y guardado como PDF.

Para HU-015 y HU-016 falta verificar los índices y la revisión con MongoDB real, la copia de los datos aceptados, los reintentos y pagos concurrentes, el historial del cliente y la navegación completa desde una cotización.

## 10. Errores, limitaciones y riesgos detectados

| Prioridad técnica | Hallazgo y efecto |
| --- | --- |
| Alta | Azure Pipelines selecciona Node 20 y solo instala y compila frontend. React Router instalado (8.5.2) declara Node >=22.22.0; Node 20 incumple ese requisito. No se ejecutó CI, por lo que su resultado real queda sin verificar. |
| Alta | La API conserva el borrado físico de contactos sin solicitudes y bloquea el de contactos con solicitudes o viajeros. Cuando se añadan nuevas relaciones, revisar que queden cubiertas por una política de integridad compatible. |
| Alta | La revocación en edición de usuario se ejecuta después de guardar. Si falla la segunda escritura, la cuenta ya cambió y el cliente puede recibir error. La política del último administrador ante cambios concurrentes no tiene una garantía atómica visible. |
| Media | La edición del propio administrador también revoca su sesión. La UI hace un GET inmediato tras guardar, así que una edición persistida puede terminar en redirección a login por 401. |
| Media | Índices de duplicados globales dan una advertencia genérica fuera del alcance del asesor. Conviene validar esa política y comprobar índices reales antes de depender del 409. El frontend solo detecta duplicados del listado que recibió. |
| Media | El listado de contactos no pagina y filtra en memoria. Esto limita escalabilidad y hace necesario aplicar el alcance por rol en cualquier consulta de búsqueda futura del servidor. |
| Media | El formulario comprueba mínimo de 10 dígitos telefónicos, el esquema admite entre 10 y 15. Origen y medio preferido son opciones cerradas en la UI y cadenas con longitud máxima en el esquema. En PUT, omitir presupuesto lo convierte en nulo. |
| Media | `verifyPassword` presupone un hash almacenado válido. Un documento previo o corrupto puede provocar un error interno al interpretar o comparar el hash. |
| Media | El arranque fuerza resolvers DNS públicos en el proceso. Su impacto depende del ambiente, especialmente con redes que resuelven nombres privados. El limitador de login usa la configuración local de Express y no se verificó la identidad del cliente detrás del proxy ni el comportamiento con varias instancias. |
| Media | Lockfiles ignorados y dependencias con rangos. Las instalaciones nuevas pueden resolver versiones distintas. La guía remite a un ejemplo de configuración ausente y el CI actual carece de lint y suite de servidor. |
| Media | Las solicitudes y viajeros acumulados por cliente comparten el límite de 16 MiB por documento de MongoDB. El listado descompone las solicitudes sin paginación y el detalle carga las solicitudes del cliente antes de seleccionar una. Revisar volumen e índices antes de escalar. |
| Media | El listado de oportunidades y las tarjetas del embudo no tienen paginación. La reasignación a otro propietario queda fuera del flujo actual para preservar el alcance de contactos y solicitudes. |
| Media | Catálogo y cotizaciones carecen de paginación. El catálogo necesita registros provisionados en MongoDB. El tope general de 32 KB de la API también aplica al formulario de cotizaciones. |
| Media | El historial de cotizaciones embebido comparte el límite BSON de 16 MiB con su documento. El PDF usa el diálogo de impresión del navegador. |
| Media | Los pagos embebidos comparten el límite BSON de 16 MiB de la reserva. El listado y el historial de pagos aún no tienen paginación. |
| Baja | El cliente no distingue indisponibilidad de API durante la restauración de sesión; el HTML declara idioma inglés aunque la interfaz es española. La vista inicial y el mapa de títulos conservan referencias residuales de actividades. |

Los riesgos de ejecución se infieren del código o configuración. No se reprodujeron con datos persistentes ni se evaluó el despliegue real.

## 11. Funcionalidades incompletas

- **HU-004.** Completar ficha y datos comerciales, integrar el detalle existente y añadir la paginación prevista. Las relaciones dependen de los módulos comerciales.
- **HU-017.** Conectar el dashboard a conteos, conversión y ventas persistidas, con la visibilidad que corresponda al usuario.
- **HU-019.** Extender búsqueda y filtros más allá de los contactos y verificar visibilidad en servidor.
- **HU-015 y HU-016.** Implementadas. Pendiente la verificación integrada con MongoDB y navegador.
- **HU-011 y HU-012.** Implementadas. Pendiente la comprobación integrada con MongoDB y navegador.
- **HU-009 y HU-010.** Implementadas. Pendiente la comprobación integrada con MongoDB y navegador.
- **HU-007 y HU-008.** Disponibles en código. Pendiente la verificación integrada con MongoDB y navegador.
- **HU-005 y HU-006.** La implementación está disponible. Falta validar la integración de navegador, API y MongoDB en el entorno aislado descrito en la sección 9.
- **HU-001 a HU-003.** Conservar las implementaciones existentes. Quedan pendientes las verificaciones de aceptación en un entorno aislado descritas en la sección 9.

## 12. Funcionalidades pendientes

| Épica | Entregables funcionales pendientes |
| --- | --- |
| F07 | Reportes de destinos y ventas (HU-018). |

## 13. Dependencias entre módulos

- Sesión y roles gobiernan los módulos existentes y futuros. Los clientes y usuarios proporcionan identificadores y alcance de acceso para las solicitudes.
- La solicitud se vincula al cliente y asesor. Los viajeros enlazan cliente y solicitud. La oportunidad usa la solicitud como contexto y sus etapas alimentan el embudo.
- La cotización usa cliente y oportunidad. El catálogo suministra servicios seleccionables. El documento usa la cotización persistida; las versiones y aceptación habilitan la creación de la reserva.
- Los pagos informativos se vinculan a reservas. Solicitudes, oportunidades y reservas completan la ficha del cliente y aportan datos para indicadores y reportes. El estado y el folio de cada entidad habilitan las búsquedas de HU-019.
- Antes de crear referencias nuevas hay que decidir integridad ante borrado, visibilidad por propietario y rol, unicidad de folios y conservación de la versión y de los importes aceptados.

## 14. Orden recomendado para continuar el desarrollo

1. Verificar F01, el alta de contactos y HU-005/HU-006 con datos aislados cuando se autorice el entorno. Confirmar el ciclo de persistencia, el aislamiento y el borrado protegido.
2. Verificar HU-007 y HU-008 con datos aislados. Las solicitudes y oportunidades disponibles pueden alimentar la ficha comercial de HU-004.
3. Verificar F04 con MongoDB y navegador, en especial la identificación de la versión aceptada y el índice único por oportunidad.
4. Verificar F06 con datos aislados. Confirmar los índices únicos, la consistencia de saldo y el historial de cliente.
5. Agregar filtros y búsquedas de HU-019 al madurar las entidades correspondientes. Completar HU-017 y HU-018 con datos reales una vez disponibles las fuentes de oportunidades, solicitudes y ventas.

## 15. Instrucciones y contexto para futuras sesiones de Codex

- Tratar este informe como estado observado y `actividades tribitrip.txt` como fuente de criterios vigentes bajo las decisiones de alcance. MongoDB es la única base de datos autorizada. Mantener las seis épicas y 17 historias; F05, HU-013 y HU-014 quedan excluidas. El criterio histórico de tareas en HU-017 queda fuera del MVP.
- Reutilizar `api.js`, `SessionProvider`, guardas de rutas, `MainLayout`, `Sidebar`, `ConfirmDialog`, formularios y estilos existentes. Conservar los flujos de login, usuarios y contactos, y usar los modelos, el middleware de autorización y el manejo de errores actuales como puntos de integración.
- Mantener la autorización en servidor y validar el aislamiento entre asesores en las nuevas operaciones. Preservar el contrato con la SPA y el despliegue de mismo origen. Evaluar compatibilidad con documentos previos antes de endurecer esquemas o añadir relaciones.
- DESARROLLO menciona contactos históricos en localStorage. El código actual de Clientes obtiene los registros de la API y en `src/` no se encontraron lecturas de localStorage ni importación. Cualquier dato legado y su titularidad quedan sin verificar.
- Para continuar, verificar primero los flujos base cuando se autorice un entorno MongoDB aislado. El siguiente bloque corresponde a F07. Cuando se autorice, usar los importes acordados de las reservas, los pagos informativos y las fechas persistidas. Mantener separadas revisión de concurrencia y versión comercial. Esta etapa se limita a HU-015 y HU-016.
