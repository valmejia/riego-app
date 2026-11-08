// Modo automático/manual y umbral de riego (se guarda en el servidor)
import { useState } from 'react';
import GlowCard, { CardHeader } from './GlowCard';

export default function ControlCard({ disp, onGuardar, enviando }) {
  const modo = disp?.modo || 'auto';
  const [umbral, setUmbral] = useState(disp?.umbral_riego ?? 30);
  const auto = modo === 'auto';
  const cambiado = disp && umbral !== disp.umbral_riego;

  return (
    <GlowCard tone="primary">
      <CardHeader icon="tune" tone="primary" title="Control de riego"
        subtitle={auto ? 'La maceta decide sola cuándo regar' : 'Solo riega cuando tú lo ordenas'} />

      <div role="radiogroup" aria-label="Modo de riego" className="grid grid-cols-2 gap-1 p-1 bg-black/30 rounded-xl border border-white/5 mb-space-lg">
        {[['auto', 'Automático', 'smart_toy'], ['manual', 'Manual', 'touch_app']].map(([v, l, i]) => (
          <button key={v} type="button" role="radio" aria-checked={modo === v} disabled={enviando}
            onClick={() => modo !== v && onGuardar({ modo: v })}
            className={`py-2.5 rounded-lg border-0 font-semibold text-body-md flex items-center justify-center gap-1.5 cursor-pointer transition-colors
              ${modo === v ? 'bg-primary text-on-primary' : 'bg-transparent text-on-surface-variant hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{i}</span>{l}
          </button>
        ))}
      </div>

      <label htmlFor="umbral" className="flex justify-between items-baseline mb-space-sm">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Regar por debajo de</span>
        <span className="font-telemetry-value-md text-telemetry-value-md text-on-surface">{umbral}%</span>
      </label>
      <input id="umbral" type="range" min="10" max="70" step="1" value={umbral}
        onChange={e => setUmbral(Number(e.target.value))} disabled={!auto}
        className="w-full accent-[var(--color-primary)] disabled:opacity-40" />
      <div className="flex justify-between text-body-sm text-on-surface-variant mt-1">
        <span>Suculentas ~15%</span><span>Hierbas ~35%</span><span>Helechos ~55%</span>
      </div>

      <div className="mt-auto pt-space-md flex items-center justify-between gap-space-sm">
        <p className="text-body-sm text-on-surface-variant m-0">
          El Arduino lee el modo y el umbral en cada consulta a <code className="font-label-code text-primary">/pendiente</code>.
        </p>
        <button type="button" disabled={!cambiado || enviando} onClick={() => onGuardar({ umbral_riego: umbral })}
          className="shrink-0 px-space-md py-2 rounded-lg border-0 bg-surface-container-high hover:bg-surface-bright text-on-surface font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          Guardar
        </button>
      </div>
    </GlowCard>
  );
}
