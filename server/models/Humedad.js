// server/models/Humedad.js
const mongoose = require('mongoose');

const HumedadSchema = new mongoose.Schema({
  device_id:         { type: String, required: true },
  humedad:           { type: Number, required: true, min: 0, max: 100 }, // suelo % (HW-080)
  raw:               { type: Number },                                   // lectura ADC cruda
  temperatura:       { type: Number, default: null },  // °C ambiental (DHT22)
  humedad_ambiental: { type: Number, default: null },  // % HR (DHT22)
  riego:             { type: Boolean, default: false }, // relé/bomba encendida
  motivo:            { type: String, default: null },   // suelo_humedo | lluvia_esperada | regando
  lluvia_mm:         { type: Number, default: null },   // precipitación esperada mañana
  prob_lluvia_max:   { type: Number, default: null },   // % probabilidad
  fecha:             { type: Date, default: Date.now }, // timestamp del dispositivo
  timestamp:         { type: Date, default: Date.now }  // timestamp de recepción
});

// Sin este índice cada consulta del panel recorre toda la colección.
HumedadSchema.index({ device_id: 1, timestamp: -1 });

module.exports = mongoose.model('Humedad', HumedadSchema, 'humedad');
