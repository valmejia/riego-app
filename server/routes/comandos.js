const express = require('express');
const router = express.Router();
const Comando = require('../models/Comando');
const verificarToken = require('../middleware/auth');

// Ruta que Make usará para crear la orden (Protegida)
router.post('/', verificarToken, async (req, res) => {
  try {
    const nuevoComando = new Comando({ accion: req.body.accion || 'regar' });
    await nuevoComando.save();
    console.log('Comando recibido de Make:', nuevoComando.accion);
    res.status(201).json({ ok: true, mensaje: 'Orden guardada' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Ruta que el Arduino consultará (Pública, sin token para que sea fácil)
router.get('/pendiente', async (req, res) => {
  try {
    // Busca el comando más reciente que no se haya ejecutado
    const comando = await Comando.findOne({ ejecutado: false }).sort({ timestamp: 1 });
    if (comando) {
      res.json({ hayComando: true, accion: comando.accion, id: comando._id });
    } else {
      res.json({ hayComando: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta para que el Arduino marque el comando como completado
router.put('/completar/:id', async (req, res) => {
  try {
    await Comando.findByIdAndUpdate(req.params.id, { ejecutado: true });
    console.log('Comando completado por Arduino');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;