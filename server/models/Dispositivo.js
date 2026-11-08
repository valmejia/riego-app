// server/models/Dispositivo.js — configuración por maceta (modo y umbral)
const mongoose = require('mongoose');

const DispositivoSchema = new mongoose.Schema({
  device_id:     { type: String, required: true, unique: true },
  nombre_planta: { type: String, default: 'Albahaca Dulce', maxlength: 60 },
  modo:          { type: String, enum: ['auto', 'manual'], default: 'auto' },
  umbral_riego:  { type: Number, min: 5, max: 90, default: 30 }, // % suelo bajo el que se riega
  actualizado:   { type: Date, default: Date.now }
});

DispositivoSchema.statics.obtener = async function (device_id) {
  return this.findOneAndUpdate(
    { device_id },
    { $setOnInsert: { device_id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('Dispositivo', DispositivoSchema);
