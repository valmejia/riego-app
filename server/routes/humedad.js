// server/routes/humedad.js
const express = require('express');
const router = express.Router();
const Humedad = require('../models/Humedad');
const { verificarToken } = require('../middleware/auth');

// Convierte a número o null. El DHT22 devuelve NaN cuando falla la lectura
// y eso llega como "nan", null o string vacío según cómo lo arme Make.
function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function bool(v) {
  return v === true || v === 'true' || v === 1 || v === '1';
}

// POST: datos reenviados desde Make (protegido con API_TOKEN)
router.post('/', verificarToken, async (req, res) => {
  try {
    const b = req.body || {};
    const device_id = typeof b.device_id === 'string' ? b.device_id.trim().slice(0, 40) : '';
    const humedad = num(b.humedad);

    if (!device_id) return res.status(400).json({ ok: false, error: 'device_id requerido' });
    if (humedad === null || humedad < 0 || humedad > 100) {
      return res.status(400).json({ ok: false, error: 'humedad debe ser un número entre 0 y 100' });
    }

    const fecha = b.fecha ? new Date(b.fecha) : new Date();
    const nuevo = await Humedad.create({
      device_id,
      humedad,
      raw: num(b.raw),
      temperatura: num(b.temperatura),
      humedad_ambiental: num(b.humedad_ambiental),
      riego: bool(b.riego),
      motivo: typeof b.motivo === 'string' ? b.motivo.slice(0, 40) : null,
      lluvia_mm: num(b.lluvia_mm),
      prob_lluvia_max: num(b.prob_lluvia_max),
      fecha: isNaN(fecha) ? new Date() : fecha
    });

    console.log('[Guardado]', device_id, humedad + '%', nuevo.motivo || '');
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[humedad POST]', err.message);
    res.status(500).json({ ok: false, error: 'No se pudo guardar la lectura' });
  }
});

const CAMPOS = 'humedad temperatura humedad_ambiental riego motivo timestamp';

// GET historial: ?horas=24 (máx 168). Se reduce a ~240 puntos promediando por tramos.
router.get('/:device_id/historial', async (req, res) => {
  try {
    const horas = Math.min(168, Math.max(1, Number(req.query.horas) || 24));
    const desde = new Date(Date.now() - horas * 3600 * 1000);
    const filas = await Humedad.find({ device_id: req.params.device_id, timestamp: { $gte: desde } })
      .select(CAMPOS).sort({ timestamp: 1 }).limit(20000).lean();

    const MAX = 240;
    const paso = Math.max(1, Math.ceil(filas.length / MAX));
    const media = (arr, k) => {
      const v = arr.map(r => r[k]).filter(x => typeof x === 'number');
      return v.length ? Math.round((v.reduce((a, c) => a + c, 0) / v.length) * 10) / 10 : null;
    };
    const puntos = [];
    for (let i = 0; i < filas.length; i += paso) {
      const g = filas.slice(i, i + paso);
      puntos.push({
        t: g[g.length - 1].timestamp,
        humedad: media(g, 'humedad'),
        temperatura: media(g, 'temperatura'),
        humedad_ambiental: media(g, 'humedad_ambiental'),
        riego: g.some(r => r.riego)
      });
    }
    res.json({ horas, total: filas.length, puntos });
  } catch (err) {
    console.error('[historial]', err.message);
    res.status(500).json({ error: 'No se pudo leer el historial' });
  }
});

// GET última lectura (abierto para el panel)
router.get('/:device_id', async (req, res) => {
  try {
    const ultimo = await Humedad.findOne({ device_id: req.params.device_id })
      .sort({ timestamp: -1 }).lean();
    res.json(ultimo || { humedad: null });
  } catch (err) {
    console.error('[humedad GET]', err.message);
    res.status(500).json({ error: 'No se pudo leer la lectura' });
  }
});

module.exports = router;
