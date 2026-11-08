const mongoose = require('mongoose');

const ComandoSchema = new mongoose.Schema({
  accion: { type: String, required: true }, // 'regar' o 'detener'
  ejecutado: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comando', ComandoSchema);