// server/routes/comandos.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Comando = require('../models/Comando');
const Dispositivo = require('../models/Dispositivo');
const { verificarToken, verificarDispositivo } = require('../middleware/auth');

const TTL_MS = () => (Number(process.env.COMANDO_TTL_MIN) || 10) * 60 * 1000;
const DEVICE = () => process.env.DEFAULT_DEVICE_ID || 'maceta1';

// device_id desde body o query. Las órdenes antiguas (sin device_id) cuentan
// como de la maceta por defecto para no perderlas tras la migración.
function leerDevice(v) {
  const id = typeof v === 'string' ? v.trim().slice(0, 40) : '';
  return id || DEVICE();
}
function filtroDevice(id) {
  return id === DEVICE() ? { $or: [{ device_id: id }, { device_id: { $exists: false } }] } : { device_id: id };
}

// Marca como expirados los comandos que llevan demasiado tiempo esperando.
// Sin esto, si el Arduino pasa horas sin conexión, al volver ejecuta todos los
// "regar" acumulados uno tras otro y encharca la maceta.
async function expirarViejos() {
  await Comando.updateMany(
    { ejecutado: false, timestamp: { $lt: new Date(Date.now() - TTL_MS()) } },
    { $set: { ejecutado: true, estado: 'expirado' } }
  );
}

// POST: crear orden (Make o el panel web). Protegido con API_TOKEN.
router.post('/', verificarToken, async (req, res) => {
  try {
    const accion = req.body?.accion || 'regar';
    if (!Comando.ACCIONES.includes(accion)) {
      return res.status(400).json({ ok: false, error: `accion debe ser: ${Comando.ACCIONES.join(', ')}` });
    }
    const duracion = Math.min(120, Math.max(1, Math.round(Number(req.body?.duracion) || 30)));
    const origen = ['app', 'greenbot'].includes(req.body?.origen) ? req.body.origen : 'make';
    const device_id = leerDevice(req.body?.device_id);

    // "detener" anula cualquier "regar" que siga en cola.
    if (accion === 'detener') {
      await Comando.updateMany(
        { ...filtroDevice(device_id), ejecutado: false, accion: 'regar' },
        { $set: { ejecutado: true, estado: 'cancelado' } }
      );
    } else {
      // Evita duplicados: si ya hay un riego en cola no se apila otro.
      const yaHay = await Comando.findOne({ ...filtroDevice(device_id), ejecutado: false, accion: 'regar',
        timestamp: { $gte: new Date(Date.now() - TTL_MS()) } });
      if (yaHay) return res.status(200).json({ ok: true, mensaje: 'Ya hay un riego en cola', id: yaHay._id });
    }

    const nuevo = await Comando.create({ device_id, accion, duracion, origen });
    console.log(`Comando recibido (${origen}) para ${device_id}:`, accion, accion === 'regar' ? `${duracion}s` : '');
    res.status(201).json({ ok: true, mensaje: 'Orden guardada', id: nuevo._id });
  } catch (err) {
    console.error('[comandos POST]', err.message);
    res.status(500).json({ ok: false, error: 'No se pudo guardar la orden' });
  }
});

// GET: el Arduino consulta la siguiente orden. Se priorizan los "detener".
// Se añaden `duracion` y `modo`/`umbral` al JSON: los campos extra no rompen
// un sketch que solo lea hayComando/accion/id.
router.get('/pendiente', verificarDispositivo, async (req, res) => {
  try {
    await expirarViejos();
    const device_id = leerDevice(req.query.device_id);
    const disp = await Dispositivo.obtener(device_id);
    const f = filtroDevice(device_id);
    const comando =
      (await Comando.findOne({ ...f, ejecutado: false, accion: 'detener' }).sort({ timestamp: 1 })) ||
      (await Comando.findOne({ ...f, ejecutado: false }).sort({ timestamp: 1 }));
    const extra = { modo: disp.modo, umbral: disp.umbral_riego };
    if (comando) {
      res.json({ hayComando: true, accion: comando.accion, id: comando._id, duracion: comando.duracion, ...extra });
    } else {
      res.json({ hayComando: false, ...extra });
    }
  } catch (err) {
    console.error('[pendiente]', err.message);
    res.status(500).json({ error: 'Error al consultar comandos' });
  }
});

// PUT: el Arduino marca el comando como completado
router.put('/completar/:id', verificarDispositivo, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'id invalido' });
    }
    const c = await Comando.findOneAndUpdate(
      { _id: req.params.id, ejecutado: false },
      { $set: { ejecutado: true, estado: 'ejecutado', ejecutadoEn: new Date() } },
      { new: true }
    );
    if (!c) return res.status(404).json({ ok: false, error: 'Comando no encontrado o ya cerrado' });
    console.log('Comando completado por Arduino:', c.accion);
    res.json({ ok: true });
  } catch (err) {
    console.error('[completar]', err.message);
    res.status(500).json({ error: 'Error al completar el comando' });
  }
});

// GET: últimos comandos para el registro de actividad del panel
router.get('/recientes', async (req, res) => {
  try {
    await expirarViejos();
    const limite = Math.min(50, Math.max(1, Number(req.query.limite) || 15));
    const lista = await Comando.find(filtroDevice(leerDevice(req.query.device_id))).sort({ timestamp: -1 }).limit(limite).lean();
    res.json(lista.map(c => ({
      id: c._id, device_id: c.device_id || DEVICE(), accion: c.accion, duracion: c.duracion, origen: c.origen || 'make',
      estado: c.estado || (c.ejecutado ? 'ejecutado' : 'pendiente'),
      timestamp: c.timestamp, ejecutadoEn: c.ejecutadoEn || null
    })));
  } catch (err) {
    console.error('[recientes]', err.message);
    res.status(500).json({ error: 'Error al leer comandos' });
  }
});

module.exports = router;
