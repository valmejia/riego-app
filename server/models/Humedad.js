// server/models/Humedad.js
const mongoose = require('mongoose');

const HumedadSchema = new mongoose.Schema({
  device_id:            { type: String, required: true },
  humedad:              { type: Number, required: true },   // suelo %
  raw:                  { type: Number },
  temperatura:          { type: Number, default: null },   // °C ambiental
  humedad_ambiental:    { type: Number, default: null },   // % HR
  riego:                { type: Boolean, default: false }, // decisión de riego
  motivo:               { type: String, default: null },   // suelo_humedo | lluvia_esperada | regando
  lluvia_mm:            { type: Number, default: null },   // precipitación esperada mañana
  prob_lluvia_max:      { type: Number, default: null },   // % probabilidad
  fecha:                { type: Date, default: Date.now }, // timestamp del dispositivo
  timestamp:            { type: Date, default: Date.now }  // timestamp de recepción
});

module.exports = mongoose.model('Humedad', HumedadSchema, 'humedad');