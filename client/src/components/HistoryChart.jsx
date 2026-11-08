// Historial: humedad (suelo + aire, mismo eje %) y temperatura en una gráfica aparte (nunca dos ejes).
import { useEffect, useMemo, useRef, useState } from 'react';
import GlowCard, { CardHeader } from './GlowCard';
import { fmt, horaCorta, fechaHora } from '../lib/format';

const RANGOS = [[6, '6 h'], [24, '24 h'], [168, '7 días']];
const M = { top: 12, right: 64, bottom: 26, left: 36 };

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function niceTicks(min, max, n = 4) {
  const step = Math.pow(10, Math.floor(Math.log10((max - min) / n || 1)));
  const err = (max - min) / n / step;
  const s = step * (err >= 5 ? 10 : err >= 2 ? 5 : err >= 1.5 ? 2 : 1);
  const out = [];
  for (let v = Math.ceil(min / s) * s; v <= max + 1e-9; v += s) out.push(Math.round(v * 10) / 10);
  return out;
}

function Plot({ puntos, series, domain, height, unidad, hover, setHover, horas, mostrarRiego }) {
  const [ref, W] = useWidth();
  const iw = W - M.left - M.right, ih = height - M.top - M.bottom;
  const t0 = puntos.length ? new Date(puntos[0].t).getTime() : 0;
  const t1 = puntos.length ? new Date(puntos[puntos.length - 1].t).getTime() : 1;
  const x = t => M.left + ((new Date(t).getTime() - t0) / Math.max(1, t1 - t0)) * iw;
  const [d0, d1] = domain;
  const y = v => M.top + ih - ((v - d0) / (d1 - d0)) * ih;
  const ticks = niceTicks(d0, d1);

  const paths = series.map(s => {
    let d = '', abierto = false;
    puntos.forEach(p => {
      const v = p[s.key];
      if (typeof v !== 'number') { abierto = false; return; }  // hueco donde no hubo dato
      d += `${abierto ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(v).toFixed(1)}`;
      abierto = true;
    });
    return d;
  });

  // Tramos con bomba encendida
  const bandas = [];
  if (mostrarRiego) {
    let ini = null;
    puntos.forEach((p, i) => {
      if (p.riego && ini === null) ini = i;
      if ((!p.riego || i === puntos.length - 1) && ini !== null) {
        const fin = p.riego ? i : i - 1;
        bandas.push([x(puntos[Math.max(0, ini - 1)].t), x(puntos[fin].t)]);
        ini = null;
      }
    });
  }

  const xTicks = useMemo(() => {
    if (!puntos.length) return [];
    const n = Math.max(2, Math.floor(iw / 110));
    return Array.from({ length: n + 1 }, (_, i) => t0 + ((t1 - t0) * i) / n);
  }, [puntos.length, iw, t0, t1]);

  function onMove(e) {
    if (!puntos.length) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const t = t0 + ((px - M.left) / iw) * (t1 - t0);
    let best = 0, bd = Infinity;
    puntos.forEach((p, i) => { const d = Math.abs(new Date(p.t).getTime() - t); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  }

  const hp = hover != null ? puntos[hover] : null;
  const last = puntos[puntos.length - 1];

  return (
    <div ref={ref} className="relative w-full">
      <svg width={W} height={height} className="block touch-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {bandas.map(([a, b], i) => (
          <rect key={i} x={a} y={M.top} width={Math.max(3, b - a)} height={ih} fill="var(--color-tertiary)" opacity="0.12" rx="2" />
        ))}
        {ticks.map(v => (
          <g key={v}>
            <line x1={M.left} x2={M.left + iw} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" />
            <text x={M.left - 6} y={y(v) + 4} textAnchor="end" className="fill-on-surface-variant" style={{ font: '400 11px var(--font-label-code)' }}>{v}</text>
          </g>
        ))}
        {xTicks.map((t, i) => (
          <text key={i} x={x(t)} y={height - 6} textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
            className="fill-on-surface-variant" style={{ font: '400 11px var(--font-label-code)' }}>
            {horas > 24 ? new Date(t).toLocaleDateString('es', { weekday: 'short', day: 'numeric' }) : horaCorta(t)}
          </text>
        ))}
        {series.map((s, i) => <path key={s.key} d={paths[i]} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
        {/* Etiquetas directas al final de cada línea */}
        {last && series.map((s, i) => typeof last[s.key] === 'number' && (
          <g key={s.key}>
            <circle cx={x(last.t)} cy={y(last[s.key])} r="4" fill={s.color} stroke="var(--color-card)" strokeWidth="2" />
            <text x={x(last.t) + 8} y={y(last[s.key]) + 4 + (series.length > 1 && Math.abs(y(last[series[0].key]) - y(last[series[1]?.key])) < 14 ? (i ? 7 : -7) : 0)}
              className="fill-on-surface" style={{ font: '600 11px var(--font-body-md)' }}>{s.short}</text>
          </g>
        ))}
        {hp && (
          <g pointerEvents="none">
            <line x1={x(hp.t)} x2={x(hp.t)} y1={M.top} y2={M.top + ih} stroke="var(--color-on-surface-variant)" strokeDasharray="3 3" />
            {series.map(s => typeof hp[s.key] === 'number' && (
              <circle key={s.key} cx={x(hp.t)} cy={y(hp[s.key])} r="5" fill={s.color} stroke="var(--color-card)" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
      {hp && (
        <div className="absolute pointer-events-none z-10 bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 shadow-lg text-body-sm"
          style={{ top: 4, left: Math.min(W - 170, Math.max(0, x(hp.t) + 10)) }}>
          <div className="text-on-surface-variant mb-1">{fechaHora(hp.t)}</div>
          {series.map(s => (
            <div key={s.key} className="flex items-center gap-2 text-on-surface">
              <span className="w-2.5 h-[3px] rounded-pill" style={{ background: s.color }} aria-hidden="true" />
              {s.label}: <b>{fmt(hp[s.key], 1)}{unidad}</b>
            </div>
          ))}
          {hp.riego && <div className="text-on-surface mt-1">💧 Bomba encendida</div>}
        </div>
      )}
    </div>
  );
}

const S_HUM = [
  { key: 'humedad', label: 'Suelo', short: 'Suelo', color: 'var(--color-water)' },
  { key: 'humedad_ambiental', label: 'Aire', short: 'Aire', color: 'var(--color-amber)' },
];
const S_TEMP = [{ key: 'temperatura', label: 'Temperatura', short: '°C', color: 'var(--color-primary)' }];

export default function HistoryChart({ horas, setHoras, historial, loading, error, umbral }) {
  const [hover, setHover] = useState(null);
  const [tabla, setTabla] = useState(false);
  const puntos = historial?.puntos || [];
  const temps = puntos.map(p => p.temperatura).filter(v => typeof v === 'number');
  const tDom = temps.length ? [Math.floor(Math.min(...temps) - 2), Math.ceil(Math.max(...temps) + 2)] : [10, 35];

  return (
    <GlowCard tone="water" as="section" id="historial" aria-labelledby="hist-title" className="scroll-mt-28">
      <CardHeader icon="monitoring" tone="water" title={<span id="hist-title">Historial</span>}
        subtitle={historial ? `${historial.total} lecturas · ${puntos.length} puntos` : 'Evolución de los sensores'}
        right={
          <div className="flex items-center gap-1 p-1 bg-black/30 rounded-lg border border-white/5" role="group" aria-label="Rango de tiempo">
            {RANGOS.map(([h, l]) => (
              <button key={h} type="button" aria-pressed={horas === h} onClick={() => setHoras(h)}
                className={`px-2.5 py-1 rounded-md border-0 text-body-sm font-semibold whitespace-nowrap cursor-pointer ${horas === h ? 'bg-surface-container-highest text-on-surface' : 'bg-transparent text-on-surface-variant hover:text-on-surface'}`}>{l}</button>
            ))}
          </div>
        } />

      {error && !puntos.length ? (
        <p className="text-error text-body-md">No se pudo cargar el historial: {error}</p>
      ) : !puntos.length ? (
        <p className="text-on-surface-variant text-body-md py-space-xl text-center">{loading ? 'Cargando historial…' : 'Aún no hay lecturas en este rango.'}</p>
      ) : tabla ? (
        <div className="max-h-[360px] overflow-auto rounded-xl border border-white/5">
          <table className="w-full text-body-sm border-collapse">
            <caption className="sr-only">Lecturas del historial</caption>
            <thead className="sticky top-0 bg-surface-container-high">
              <tr className="text-left text-on-surface-variant">
                {['Hora', 'Suelo %', 'Aire %', 'Temp °C', 'Bomba'].map(h => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...puntos].reverse().map((p, i) => (
                <tr key={i} className="border-t border-white/5 text-on-surface">
                  <td className="px-3 py-1.5 whitespace-nowrap">{fechaHora(p.t)}</td>
                  <td className="px-3 py-1.5">{fmt(p.humedad, 1)}</td>
                  <td className="px-3 py-1.5">{fmt(p.humedad_ambiental, 1)}</td>
                  <td className="px-3 py-1.5">{fmt(p.temperatura, 1)}</td>
                  <td className="px-3 py-1.5">{p.riego ? 'Sí' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-space-lg">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h4 className="m-0 text-body-md font-semibold text-on-surface">Humedad (%)</h4>
              <Legend items={[...S_HUM, { label: 'Bomba encendida', band: true }]} />
            </div>
            <Plot puntos={puntos} series={S_HUM} domain={[0, 100]} height={220} unidad="%" hover={hover} setHover={setHover} horas={horas} mostrarRiego />
            <p className="m-0 text-body-sm text-on-surface-variant">Umbral de riego actual: {umbral}%</p>
          </div>
          <div>
            <h4 className="m-0 mb-1 text-body-md font-semibold text-on-surface">Temperatura (°C)</h4>
            <Plot puntos={puntos} series={S_TEMP} domain={tDom} height={150} unidad=" °C" hover={hover} setHover={setHover} horas={horas} />
          </div>
        </div>
      )}

      {puntos.length > 0 && (
        <button type="button" onClick={() => setTabla(v => !v)}
          className="self-start mt-space-md px-3 py-1.5 rounded-lg border border-white/10 bg-transparent text-on-surface-variant hover:text-on-surface text-body-sm cursor-pointer flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{tabla ? 'show_chart' : 'table_rows'}</span>
          {tabla ? 'Ver gráfica' : 'Ver como tabla'}
        </button>
      )}
    </GlowCard>
  );
}

function Legend({ items }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 list-none m-0 p-0 text-body-sm text-on-surface-variant">
      {items.map(it => (
        <li key={it.label} className="flex items-center gap-1.5">
          {it.band
            ? <span className="w-3 h-3 rounded-sm" style={{ background: 'var(--color-tertiary)', opacity: 0.3 }} aria-hidden="true" />
            : <span className="w-4 h-[3px] rounded-pill" style={{ background: it.color }} aria-hidden="true" />}
          {it.label}
        </li>
      ))}
    </ul>
  );
}
