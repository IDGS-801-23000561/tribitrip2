# Plan de pruebas integrales de TribiTrip

Pendiente de ejecución. Usar navegador y una instancia MongoDB aislada con autorización. Preparar datos ficticios, un administrador, dos asesores con datos separados, una cuenta inactiva y registros de catálogo autorizados. Registrar por caso el entorno, la versión, el navegador, los datos, el resultado y la evidencia.

## Acceso, sesión y roles

- [ ] HU-001. Probar login válido, contraseña incorrecta, cuenta inactiva, recarga con sesión, URL privada, cierre de sesión y expiración. Confirmar la invalidación de cookie y el rechazo de escrituras de otro origen.
- [ ] HU-002. Como administrador, crear un asesor, editar sus datos, cambiar su rol y desactivarlo. Verificar que sus sesiones se revocan. Probar la edición de la cuenta propia, la protección contra autodesactivación y la concurrencia entre administradores. Como asesor, comprobar que Usuarios queda restringido en menú, URL directa y API.
- [ ] Intercambiar IDs entre dos cuentas de asesor en contactos, fichas, solicitudes, viajeros, oportunidades, cotizaciones, versiones, documentos, reservas y pagos. Esperar 404 para recursos ajenos y 403 en endpoints administrativos. Confirmar el acceso del administrador a ambos ámbitos.

## Clientes, solicitudes, viajeros y oportunidades

- [ ] HU-003. Crear cliente y prospecto. Probar campos obligatorios, formatos y duplicados de correo y teléfono, incluidos los que pertenecen a otro asesor. Repetir el alta simultáneamente.
- [ ] HU-004. Buscar por nombre, correo y teléfono con separadores. Abrir ficha, comprobar asesor y preferencias, editar y recargar. Probar dos pestañas editando la misma revisión. Confirmar que editar el contacto no cambia los datos aceptados o de reservas existentes.
- [ ] HU-004 a HU-006. Verificar que la ficha muestra las solicitudes correctas con sus viajeros y enlaza oportunidades, cotizaciones y reservas del contacto. Crear y editar una solicitud; probar fechas inválidas, importes y cantidades. Registrar y editar viajeros, intentar exceder la cantidad y usar una solicitud ajena.
- [ ] Probar dos altas simultáneas de viajeros para un solo cupo. Comprobar el borrado protegido del cliente con solicitudes y el caso de alta de solicitud y borrado concurrentes.
- [ ] HU-007. Crear una oportunidad desde una solicitud válida, comprobar propietario, etapas y resultados. Intentar enlazar una solicitud ajena y escribir con revisión vencida.
- [ ] HU-008. Abrir embudo como administrador, confirmar conteos por etapa, filtros de responsable y estado y enlaces. Cambiar etapa, volver al embudo y comprobar los conteos. Verificar que el asesor carece de acceso.

## Catálogo y cotizaciones

- [ ] HU-009. Buscar servicios y paquetes por nombre y destino, comprobar resultados vacíos, proveedor y precio, abrir detalle y agregar un servicio a la cotización.
- [ ] HU-010. Crear cotización mixta con conceptos manuales y de catálogo, ajustar cantidades y precios y quitar un concepto. Cotejar subtotal, impuestos, cargos y total en MXN. Verificar folios únicos, listado por oportunidad y persistencia tras recargar.
- [ ] HU-011. Crear versiones consecutivas y consultar las anteriores. Recorrer borrador, envío, aceptación, rechazo y vencimiento. Probar el límite de vigencia en Ciudad de México, una edición con revisión vencida y dos aceptaciones simultáneas para la misma oportunidad. Confirmar que solo una se acepta y que esa versión queda bloqueada.

### Revisión obligatoria de documentos HTML y PDF

- [ ] Revisar en navegador la presentación visual, legibilidad general, márgenes y jerarquía del documento.
- [ ] Comprobar identificación de TribiTrip y datos de cliente para la versión consultada.
- [ ] Verificar folio, versión, estado y fecha de emisión para borradores, versiones históricas y cotizaciones aceptadas.
- [ ] Cotejar servicios, cantidades, precios, subtotales, impuestos, cargos y total en MXN con la versión persistida.
- [ ] Verificar vigencia, condiciones y observaciones, incluidas condiciones extensas y caracteres especiales.
- [ ] Cambiar un precio de catálogo y editar el contacto. Reabrir documentos históricos y aceptados y verificar que conservan los datos guardados.
- [ ] Imprimir desde la vista previa y desde una pestaña independiente. Verificar que el documento no incluya la navegación ni botones del CRM.
- [ ] Guardar como PDF, volver a abrir el archivo y comprobar páginas, datos y legibilidad.
- [ ] Revisar saltos de página, encabezados, cortes, totales y superposición de filas con cotizaciones de 1, varias y 50 líneas, incluidas descripciones largas.
- [ ] Comparar la lectura del PDF a tamaño normal y la impresión física. Registrar incidencias por navegador y tamaño de papel para decidir si se conserva el HTML o se plantea generar PDF directamente.

## Reservas y pagos informativos

- [ ] HU-015. Crear reserva desde cotización aceptada de oportunidad ganada. Verificar folio, cliente, oportunidad, solicitud, copia de fechas e importes e historial del contacto. Probar el rechazo de fuentes no aceptadas o sin oportunidad ganada.
- [ ] Repetir el alta, también en paralelo. Confirmar que se devuelve la misma reserva. Recorrer estados permitidos, probar transiciones inválidas y modificar localizador y proveedor manuales antes del cierre.
- [ ] HU-016. Registrar pagos parciales y final y verificar fecha, monto, método, referencia, observaciones, total y saldo. Probar monto inválido, fecha futura, sobrepago, referencia duplicada y reserva cancelada. Repetir con la misma clave y comprobar un único registro.
- [ ] Enviar dos pagos simultáneos que juntos excedan el saldo. Verificar que solo uno se registra. Probar pago y cancelación concurrentes y comprobar el orden efectivo. Recargar para verificar persistencia.

## Dashboard, reportes y búsquedas

- [ ] HU-017. Preparar clientes activos, inactivos y prospectos, y oportunidades abiertas, ganadas y perdidas. Comprobar conteos, ganadas ÷ (ganadas + perdidas) y el caso sin cierres. Verificar que el asesor solo ve sus accesos de trabajo.
- [ ] Con dos reservas no canceladas de MXN 1,000 y 2,000, una cancelada de MXN 500, una cotización rechazada y un pago de MXN 200, dashboard y reporte deben sumar MXN 3,000 si representan todo el conjunto consultado.
- [ ] HU-018. Probar destinos con espacios, mayúsculas y variantes con o sin acento, orden por frecuencia y ausencia de datos. Probar límites inclusivos de Ciudad de México, cruce de mes, fechas invertidas e intervalos mayores a 366 días. Comprobar denegación al asesor.
- [ ] HU-019. Combinar texto y estado en Clientes, estado y etapa en Oportunidades, y folio y estado en Cotizaciones y Reservas. Probar filtro de asesor exclusivo del administrador, vencimiento de cotizaciones, limpieza, páginas, URLs directas y resultados vacíos.
- [ ] Recorrer todas las rutas principales y el flujo desde cliente hasta pago informativo. Recargar en cada módulo y comprobar permisos por perfil. Confirmar que Reportes, Embudo y Usuarios quedan restringidos al administrador y que F05 queda fuera del MVP.

## Índices, concurrencia y límites

- [ ] Confirmar en MongoDB los índices únicos de usuarios, contactos, folios, cotización aceptada por oportunidad y reserva por cotización. Comprobar TTL de sesiones y repetir las carreras de alta, revisión, aceptación y pagos descritas arriba.
- [ ] Verificar agregaciones de destino y venta con datos persistidos y revisar planes de consulta con volumen representativo.
- [ ] Medir tamaño BSON de clientes con solicitudes y viajeros, cotizaciones con historial y reservas con pagos. Cada documento tiene un límite de 16 MiB. Probar en aislamiento su manejo y comprobar que un rechazo conserva el documento anterior. La ficha, el catálogo, el embudo y los historiales aún pueden cargar secciones completas.
- [ ] Antes del despliegue, comprobar versión de Node de CI, proxy, HTTPS, limitador de login y escenarios de revocación documentados.
