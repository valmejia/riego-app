require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const humedadRoutes = require('./routes/humedad');
const comandosRoutes = require('./routes/comandos');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ruta raíz: confirmar que el servicio está activo
app.get('/', (req, res) => {
  res.send('API de riego funcionando');
});

// Ruta de datos de humedad
app.use('/api/humedad', humedadRoutes);
app.use('/api/comandos', comandosRoutes);

// Conectar a MongoDB y luego iniciar el servidor
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(process.env.PORT, () => {
      console.log(`Servidor en http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => console.error('Error MongoDB:', err));