const mongoose = require('mongoose');

const ACCIONES = ['regar', 'detener'];
const ESTADOS = ['pendiente', 'ejecutado', 'cancelado', 'expirado'];

const ComandoSchema = new mongoose.Schema({
  device_id:   { type: String, default: 'maceta1', index: true }, // maceta destino
  accion:      { type: String, required: true, enum: ACCIONES },
  duracion:    { type: Number, min: 1, max: 120, default: 30 },  // segundos de riego
  origen:      { type: String, default: 'make' },                // make | app
  // `ejecutado` se mantiene por compatibilidad con el sketch: false = pendiente.
  ejecutado:   { type: Boolean, default: false },
  estado:      { type: String, enum: ESTADOS, default: 'pendiente' },
  ejecutadoEn: { type: Date, default: null },
  timestamp:   { type: Date, default: Date.now }
});

ComandoSchema.index({ device_id: 1, ejecutado: 1, timestamp: 1 });

module.exports = mongoose.model('Comando', ComandoSchema);
module.exports.ACCIONES = ACCIONES;
