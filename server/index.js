import { connect } from './models.js';
import { app } from './app.js';
try {
  await connect();
  app.listen(Number(process.env.PORT || 3001), '127.0.0.1', () => console.log('API TribiTrip disponible en http://127.0.0.1:' + (process.env.PORT || 3001)));
} catch (error) {
  console.error('No se pudo iniciar la API:', error.name, 'Revisa la conexión y configuración de MongoDB.');
  process.exitCode = 1;
}
