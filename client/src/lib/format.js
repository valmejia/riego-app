// client/src/lib/format.js
export function fmt(v, decimales = 0) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  return v.toLocaleString('es', { maximumFractionDigits: decimales, minimumFractionDigits: decimales });
}

export function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, typeof v === 'number' && Number.isFinite(v) ? v : 0));
}

export function haceCuanto(fecha, ahora = Date.now()) {
  if (!fecha) return 'sin datos';
  const s = Math.max(0, Math.round((ahora - new Date(fecha).getTime()) / 1000));
  if (s < 10) return 'ahora mismo';
  if (s < 60) return `hace ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

export function horaCorta(fecha) {
  return new Date(fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

export function fechaHora(fecha) {
  const d = new Date(fecha);
  const hoy = new Date();
  const mismoDia = d.toDateString() === hoy.toDateString();
  return mismoDia ? `hoy ${horaCorta(d)}` : d.toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const MOTIVO_LABEL = {
  suelo_humedo: 'Suelo húmedo, no hace falta regar',
  lluvia_esperada: 'Se espera lluvia, se pospone el riego',
  regando: 'Regando ahora',
};

// Estado del suelo según el umbral configurado
export function estadoSuelo(h, umbral = 30) {
  if (typeof h !== 'number') return { label: 'Sin datos', tone: 'neutral', icon: 'help' };
  if (h < umbral * 0.66) return { label: 'Necesita agua', tone: 'error', icon: 'water_loss' };
  if (h < umbral) return { label: 'Empieza a secarse', tone: 'warn', icon: 'humidity_low' };
  if (h > 80) return { label: 'Encharcado', tone: 'warn', icon: 'flood' };
  if (h >= umbral + 25) return { label: 'Muy húmedo', tone: 'tertiary', icon: 'humidity_high' };
  return { label: 'Óptimo', tone: 'primary', icon: 'check_circle' };
}

export function estadoTemp(t) {
  if (typeof t !== 'number') return 'Sin lectura del DHT22';
  if (t < 10) return 'Frío: protege la planta';
  if (t < 18) return 'Fresco';
  if (t <= 28) return 'Templado, ideal';
  if (t <= 33) return 'Caluroso: vigila el riego';
  return 'Calor extremo';
}

export function estadoAire(h) {
  if (typeof h !== 'number') return 'Sin lectura del DHT22';
  if (h < 30) return 'Aire seco';
  if (h <= 70) return 'Humedad agradable';
  return 'Aire muy húmedo: riesgo de hongos';
}
