// server/middleware/auth.js
const TOKEN_SECRETO = process.env.API_TOKEN;

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Sin cabecera Authorization
  if (!authHeader) {
    return res.status(401).json({ ok: false, error: 'Token no proporcionado' });
  }

  // El formato debe ser "Bearer <token>"
  const partes = authHeader.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ ok: false, error: 'Formato de token invalido' });
  }

  const token = partes[1];

  // Comparar el token
  if (token !== TOKEN_SECRETO) {
    return res.status(403).json({ ok: false, error: 'Token invalido' });
  }

  // Verificación exitosa, continuar con el procesamiento posterior
  next();
}

module.exports = verificarToken;