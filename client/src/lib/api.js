// client/src/lib/api.js — acceso al backend (directo o a través de ngrok)
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
// Maceta activa: ?device=maceta2 en la URL, o VITE_DEVICE_ID, o "maceta1".
function deviceInicial() {
  try {
    const q = new URLSearchParams(window.location.search).get('device');
    if (q && /^[\w-]{1,40}$/.test(q)) return q;
  } catch { /* sin window */ }
  return import.meta.env.VITE_DEVICE_ID || 'maceta1';
}
export const DEVICE_ID = deviceInicial();
const TOKEN_KEY = 'hydra_token';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}
export function setToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* sin storage */ }
}

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function request(path, { method = 'GET', body, auth = false, timeoutMs = 10000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers = {
    // Evita la página de aviso que ngrok (plan gratuito) inyecta a los navegadores.
    'ngrok-skip-browser-warning': '1',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const t = getToken();
    if (!t) throw new ApiError('Configura tu token de control en Ajustes', 401);
    headers.Authorization = `Bearer ${t}`;
  }
  try {
    const res = await fetch(BASE + path, {
      method, headers, signal: ctrl.signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {
      // Respuesta HTML: típicamente el túnel de ngrok caído o la URL cambió.
      throw new ApiError('El servidor no respondió JSON (¿túnel ngrok caído?)', res.status);
    }
    if (!res.ok) {
      const msg = data?.error || `Error HTTP ${res.status}`;
      throw new ApiError(res.status === 403 ? 'Token inválido' : msg, res.status);
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') throw new ApiError('Tiempo de espera agotado', 0);
    if (e instanceof ApiError) throw e;
    throw new ApiError('Sin conexión con el servidor', 0);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  ultima: (id = DEVICE_ID) => request(`/api/humedad/${encodeURIComponent(id)}`),
  historial: (horas, id = DEVICE_ID) => request(`/api/humedad/${encodeURIComponent(id)}/historial?horas=${horas}`),
  comandos: (limite = 15, id = DEVICE_ID) => request(`/api/comandos/recientes?limite=${limite}&device_id=${encodeURIComponent(id)}`),
  dispositivo: (id = DEVICE_ID) => request(`/api/dispositivos/${encodeURIComponent(id)}`),
  guardarDispositivo: (cambios, id = DEVICE_ID) =>
    request(`/api/dispositivos/${encodeURIComponent(id)}`, { method: 'PUT', body: cambios, auth: true }),
  regar: (duracion, id = DEVICE_ID) => request('/api/comandos', { method: 'POST', body: { device_id: id, accion: 'regar', duracion, origen: 'app' }, auth: true }),
  detener: (id = DEVICE_ID) => request('/api/comandos', { method: 'POST', body: { device_id: id, accion: 'detener', origen: 'app' }, auth: true }),
  health: () => request('/api/health', { timeoutMs: 5000 }),
};
