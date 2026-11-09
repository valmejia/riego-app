// Servidor simulado para desarrollar el panel sin Arduino ni MongoDB.
//   npm run mock      (en otra terminal: npm run dev)
// Imita /api/humedad, /api/comandos, /api/dispositivos, /api/health y un webhook de GreenBot en /greenbot.
import http from 'node:http';

const PORT = Number(process.env.PORT) || 5000;
const TOKEN = process.env.API_TOKEN || 'demo';
const now = () => Date.now();

// Historial sintético de 7 días: secado lento + riegos cuando baja de 30%.
const lecturas = [];
let h = 55;
for (let t = now() - 7 * 864e5; t <= now(); t += 5 * 60e3) {
  const hora = new Date(t).getHours();
  const temp = 21 + 6 * Math.sin(((hora - 9) / 24) * 2 * Math.PI) + (Math.random() - 0.5);
  h -= 0.12 + Math.max(0, temp - 22) * 0.02;
  let riego = false;
  if (h < 30) { h = 62; riego = true; }
  lecturas.push({
    device_id: 'maceta1', humedad: +h.toFixed(1), raw: Math.round(1023 - h * 6),
    temperatura: +temp.toFixed(1), humedad_ambiental: +(58 - (temp - 21) * 2 + Math.random() * 3).toFixed(1),
    riego, motivo: riego ? 'regando' : 'suelo_humedo', lluvia_mm: 0.4, prob_lluvia_max: 20,
    timestamp: new Date(t).toISOString(), fecha: new Date(t).toISOString(),
  });
}
let disp = { device_id: 'maceta1', nombre_planta: 'Albahaca Dulce', modo: 'auto', umbral_riego: 30, actualizado: new Date() };
let comandos = [
  { id: 'c1', accion: 'regar', duracion: 30, origen: 'make', estado: 'ejecutado', timestamp: new Date(now() - 3 * 36e5), ejecutadoEn: new Date(now() - 3 * 36e5 + 8000) },
  { id: 'c2', accion: 'regar', duracion: 30, origen: 'app', estado: 'expirado', timestamp: new Date(now() - 26 * 36e5) },
];
let pumpUntil = 0;
let ultimoRiego = null;

// Cada 10 s llega una lectura nueva y se "ejecutan" las órdenes pendientes.
setInterval(() => {
  const last = lecturas[lecturas.length - 1];
  const p = comandos.find(c => c.estado === 'pendiente');
  if (p) {
    p.estado = 'ejecutado'; p.ejecutadoEn = new Date();
    pumpUntil = p.accion === 'regar' ? now() + p.duracion * 1000 : 0;
    if (p.accion === 'regar') ultimoRiego = new Date();
  }
  const regando = now() < pumpUntil;
  const hum = Math.min(90, last.humedad + (regando ? 4 : -0.1));
  lecturas.push({ ...last, humedad: +hum.toFixed(1), riego: regando, motivo: regando ? 'regando' : 'suelo_humedo',
    timestamp: new Date().toISOString(), fecha: new Date().toISOString() });
}, 10000);

function send(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' });
  res.end(JSON.stringify(body));
}
const auth = req => req.headers.authorization === `Bearer ${TOKEN}`;

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url, 'http://x');
  let body = {};
  if (req.method !== 'GET') { let raw = ''; for await (const c of req) raw += c; try { body = JSON.parse(raw || '{}'); } catch { /* */ } }
  const p = url.pathname;

  if (p === '/api/health') return send(res, 200, { ok: true, mongo: true, hora: new Date() });
  if (/^\/api\/humedad\/[^/]+\/historial$/.test(p)) {
    const horas = Math.min(168, Number(url.searchParams.get('horas')) || 24);
    const filas = lecturas.filter(l => new Date(l.timestamp) >= now() - horas * 36e5);
    const paso = Math.max(1, Math.ceil(filas.length / 240));
    const puntos = [];
    for (let i = 0; i < filas.length; i += paso) {
      const g = filas.slice(i, i + paso), avg = k => +(g.reduce((a, r) => a + r[k], 0) / g.length).toFixed(1);
      puntos.push({ t: g[g.length - 1].timestamp, humedad: avg('humedad'), temperatura: avg('temperatura'), humedad_ambiental: avg('humedad_ambiental'), riego: g.some(r => r.riego) });
    }
    return send(res, 200, { horas, total: filas.length, puntos });
  }
  if (p.startsWith('/api/humedad/')) return send(res, 200, lecturas[lecturas.length - 1]);
  if (p === '/api/comandos/recientes') return send(res, 200, [...comandos].reverse().slice(0, 15));
  if (p === '/api/comandos' && req.method === 'POST') {
    if (!auth(req)) return send(res, 403, { ok: false, error: 'Token invalido' });
    if (body.accion === 'detener') { comandos.forEach(c => { if (c.estado === 'pendiente') c.estado = 'cancelado'; }); pumpUntil = 0; }
    const c = { id: 'c' + (comandos.length + 1), accion: body.accion || 'regar', duracion: body.duracion || 30, origen: body.origen || 'make', estado: body.accion === 'detener' ? 'ejecutado' : 'pendiente', timestamp: new Date(), ejecutadoEn: null };
    comandos.push(c);
    return send(res, 201, { ok: true, mensaje: 'Orden guardada', id: c.id });
  }
  if (p.startsWith('/api/dispositivos/')) {
    if (req.method === 'PUT') {
      if (!auth(req)) return send(res, 403, { ok: false, error: 'Token invalido' });
      disp = { ...disp, ...body, actualizado: new Date() };
    }
    const bomba = now() < pumpUntil;
    return send(res, 200, { ...disp, bomba, bomba_restante: bomba ? Math.ceil((pumpUntil - now()) / 1000) : 0, ultimo_contacto: new Date(), ultimo_riego: ultimoRiego });
  }
  if (p === '/greenbot' && req.method === 'POST') {
    // El widget no manda context: se usa la última lectura, como haría Make con GET /api/humedad/:device_id
    const u = lecturas[lecturas.length - 1];
    const c = body.context || { planta: disp.nombre_planta, humedad_suelo: u.humedad, temperatura: u.temperatura, umbral_riego: disp.umbral_riego };
    return send(res, 200, { reply: `Tu ${c.planta || 'planta'} tiene la tierra al ${c.humedad_suelo}% y el aire a ${c.temperatura} °C. ${c.humedad_suelo < c.umbral_riego ? 'Conviene regar pronto.' : 'Por ahora no necesita agua.'}` });
  }
  send(res, 404, { ok: false, error: 'Ruta no encontrada' });
}).listen(PORT, () => console.log(`Mock de Hydra Cloud en http://localhost:${PORT}  (token: ${TOKEN})`));
