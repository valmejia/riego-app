// server/middleware/auth.js
const crypto = require('crypto');

// Comparación en tiempo constante para no filtrar el token por diferencias de tiempo.
function iguales(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function leerBearer(req) {
  const h = req.headers['authorization'] || '';
  const [tipo, token] = h.split(' ');
  return tipo === 'Bearer' && token ? token : null;
}

// Crea un middleware que exige el token guardado en process.env[nombreVar].
// opcional=true: si la variable está vacía, la ruta queda abierta (compatibilidad).
function exigirToken(nombreVar, { opcional = false } = {}) {
  return function (req, res, next) {
    const secreto = process.env[nombreVar];
    if (!secreto) {
      if (opcional) return next();
      // Falla cerrado: sin token configurado nadie puede escribir.
      return res.status(500).json({ ok: false, error: `${nombreVar} no configurado en el servidor` });
    }
    const token = leerBearer(req);
    if (!token) return res.status(401).json({ ok: false, error: 'Token no proporcionado' });
    if (!iguales(token, secreto)) return res.status(403).json({ ok: false, error: 'Token invalido' });
    next();
  };
}

const verificarToken = exigirToken('API_TOKEN');
const verificarDispositivo = exigirToken('DEVICE_TOKEN', { opcional: true });

module.exports = verificarToken;
module.exports.verificarToken = verificarToken;
module.exports.verificarDispositivo = verificarDispositivo;
