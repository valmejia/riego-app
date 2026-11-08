// server/routes/dispositivos.js — modo auto/manual, umbral y nombre de la planta
const express = require('express');
const router = express.Router();
const Dispositivo = require('../models/Dispositivo');
const { verificarToken } = require('../middleware/auth');

const publico = d => ({
  device_id: d.device_id, nombre_planta: d.nombre_planta,
  modo: d.modo, umbral_riego: d.umbral_riego, actualizado: d.actualizado
});

router.get('/:device_id', async (req, res) => {
  try {
    res.json(publico(await Dispositivo.obtener(req.params.device_id)));
  } catch (err) {
    console.error('[dispositivo GET]', err.message);
    res.status(500).json({ error: 'Error al leer la configuración' });
  }
});

router.put('/:device_id', verificarToken, async (req, res) => {
  try {
    const cambios = {};
    const b = req.body || {};
    if (b.modo !== undefined) {
      if (!['auto', 'manual'].includes(b.modo)) return res.status(400).json({ ok: false, error: 'modo debe ser auto o manual' });
      cambios.modo = b.modo;
    }
    if (b.umbral_riego !== undefined) {
      const u = Number(b.umbral_riego);
      if (!Number.isFinite(u) || u < 5 || u > 90) return res.status(400).json({ ok: false, error: 'umbral_riego entre 5 y 90' });
      cambios.umbral_riego = Math.round(u);
    }
    if (typeof b.nombre_planta === 'string' && b.nombre_planta.trim()) {
      cambios.nombre_planta = b.nombre_planta.trim().slice(0, 60);
    }
    cambios.actualizado = new Date();
    const d = await Dispositivo.findOneAndUpdate(
      { device_id: req.params.device_id }, { $set: cambios },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
    res.json({ ok: true, ...publico(d) });
  } catch (err) {
    console.error('[dispositivo PUT]', err.message);
    res.status(500).json({ ok: false, error: 'Error al guardar la configuración' });
  }
});

module.exports = router;
