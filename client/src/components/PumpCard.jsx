// Bomba de agua (relé SRD-05VDC) y riego manual
import { useState } from 'react';
import GlowCard, { CardHeader } from './GlowCard';
import StatusBadge from './StatusBadge';
import { fmt, fechaHora, haceCuanto } from '../lib/format';

const DURACIONES = [10, 30, 60];

export default function PumpCard({ regando, restante, pendiente, recibeOrdenes, ultimoContacto, ultimoRiego, onRegar, onDetener, enviando, offline }) {
  const [dur, setDur] = useState(30);
  const estado = regando
    ? { tone: 'tertiary', label: restante ? `Regando · ${restante} s` : 'Regando', pulse: true }
    : pendiente?.accion === 'regar' ? { tone: 'warn', label: 'Riego en cola', pulse: true }
    : pendiente ? { tone: 'warn', label: 'Detener en cola', pulse: true }
    : { tone: 'neutral', label: 'En reposo', pulse: false };

  return (
    <GlowCard tone="tertiary">
      <CardHeader icon="shower" tone="tertiary" title="Bomba de agua" subtitle="Relé SRD-05VDC"
        right={<StatusBadge tone={estado.tone} pulse={estado.pulse}>{estado.label}</StatusBadge>} />

      <fieldset className="border-0 p-0 m-0 mb-space-md">
        <legend className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-space-sm">Duración del riego</legend>
        <div className="grid grid-cols-3 gap-space-sm">
          {DURACIONES.map(d => (
            <label key={d} className={`text-center py-2 rounded-lg cursor-pointer border text-body-md font-semibold transition-colors
              ${dur === d ? 'bg-tertiary/15 border-tertiary/50 text-tertiary' : 'bg-black/20 border-white/5 text-on-surface-variant hover:text-on-surface'}`}>
              <input type="radio" name="duracion" value={d} checked={dur === d} onChange={() => setDur(d)} className="sr-only" />
              {d} s
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-space-sm">
        <button type="button" onClick={() => onRegar(dur)} disabled={enviando || regando || pendiente?.accion === 'regar'}
          className="flex-1 py-3 px-4 rounded-xl border-0 bg-tertiary text-on-tertiary font-bold text-body-lg flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">water_drop</span>
          Regar ahora
        </button>
        <button type="button" onClick={onDetener} disabled={enviando || (!regando && !pendiente)}
          className="py-3 px-4 rounded-xl bg-transparent border border-error/40 text-error font-bold flex items-center gap-1.5 cursor-pointer hover:bg-error/10 disabled:opacity-30 disabled:cursor-not-allowed">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">stop_circle</span>
          Detener
        </button>
      </div>
      {!recibeOrdenes ? (
        <p role="status" className="text-body-sm text-warn m-0 mt-space-sm flex items-start gap-1">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">warning</span>
          <span>
            El Arduino no está recogiendo órdenes{ultimoContacto ? ` (último contacto ${haceCuanto(ultimoContacto)})` : ''}.
            Revisa que tenga el sketch nuevo y <code className="font-label-code">API_HOST</code> con tu dominio de ngrok.
            Las órdenes caducan a los 10 min.
          </span>
        </p>
      ) : offline && (
        <p className="text-body-sm text-warn m-0 mt-space-sm flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">warning</span>
          Make no envía lecturas recientes, pero el Arduino sí recibe órdenes.
        </p>
      )}

      <div className="mt-auto pt-space-md">
        <div className="bg-black/25 border border-white/5 rounded-xl p-space-md flex flex-col gap-1.5 text-body-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Último riego:</span>
            <span className="font-semibold text-on-surface">{ultimoRiego ? fechaHora(ultimoRiego) : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Orden pendiente:</span>
            <span className="font-semibold text-on-surface">{pendiente ? `${pendiente.accion} ${pendiente.accion === 'regar' ? `(${fmt(pendiente.duracion)} s)` : ''}` : 'ninguna'}</span>
          </div>
        </div>
      </div>
    </GlowCard>
  );
}
