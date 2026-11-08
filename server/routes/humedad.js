// server/routes/humedad.js
const express = require('express');
const router = express.Router();
const Humedad = require('../models/Humedad');
const verificarToken = require('../middleware/auth');  // Importar middleware

// POST: recibir datos reenviados desde Make, requiere verificación de token
// server/routes/humedad.js
router.post('/', verificarToken, async (req, res) => {
  try {
    const {
      device_id, humedad, raw,
      temperatura, humedad_ambiental,
      riego, motivo, lluvia_mm, prob_lluvia_max,
      fecha
    } = req.body;

    const nuevo = new Humedad({
      device_id, humedad, raw,
      temperatura, humedad_ambiental,
      riego, motivo, lluvia_mm, prob_lluvia_max,
      fecha: fecha ? new Date(fecha) : new Date()
    });

    await nuevo.save();
    console.log('[Guardado]', device_id, humedad + '%', motivo);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET: la lectura de datos permanece abierta para el frontend React
router.get('/:device_id', async (req, res) => {
  try {
    const ultimo = await Humedad.findOne({ device_id: req.params.device_id })
      .sort({ timestamp: -1 });
    res.json(ultimo || { humedad: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;