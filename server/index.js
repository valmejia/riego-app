require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const humedadRoutes = require('./routes/humedad');
const comandosRoutes = require('./routes/comandos');
const dispositivosRoutes = require('./routes/dispositivos');

const PORT = Number(process.env.PORT) || 5000;

if (!process.env.MONGO_URI) {
  console.error('Falta MONGO_URI en server/.env (usa .env.example como guía)');
  process.exit(1);
}
if (!process.env.API_TOKEN) {
  console.warn('[aviso] API_TOKEN vacío: las rutas de escritura responderán 500 hasta configurarlo.');
}

const app = express();

// ngrok envía X-Forwarded-For; necesario para que req.ip sea el real.
app.set('trust proxy', 1);

// CORS: por defecto abierto; restringe con CORS_ORIGIN="https://midominio,http://localhost:5173"
const origenes = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors(origenes.length ? { origin: origenes } : undefined));
app.use(express.json({ limit: '20kb' }));

app.get('/', (req, res) => res.send('API de Hydra Cloud funcionando'));
app.get('/api/health', (req, res) => {
  res.json({ ok: true, mongo: mongoose.connection.readyState === 1, hora: new Date() });
});

app.use('/api/humedad', humedadRoutes);
app.use('/api/comandos', comandosRoutes);
app.use('/api/dispositivos', dispositivosRoutes);

app.use((req, res) => res.status(404).json({ ok: false, error: 'Ruta no encontrada' }));
// JSON mal formado u otros errores: responder JSON en lugar de una página HTML.
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ ok: false, error: status === 400 ? 'JSON inválido' : 'Error interno' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Error MongoDB:', err.message);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => console.warn('[aviso] MongoDB desconectado'));
