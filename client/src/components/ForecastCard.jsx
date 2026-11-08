// Pronóstico de lluvia que Make adjunta a cada lectura
import GlowCard, { CardHeader } from './GlowCard';
import StatusBadge from './StatusBadge';
import { fmt, clamp } from '../lib/format';

export default function ForecastCard({ data }) {
  const mm = data?.lluvia_mm, p = data?.prob_lluvia_max;
  const llueve = (typeof p === 'number' && p >= 60) || (typeof mm === 'number' && mm >= 2);
  return (
    <GlowCard tone="neutral">
      <CardHeader icon="rainy" tone="neutral" title="Pronóstico" subtitle="Lluvia esperada mañana"
        right={typeof p === 'number'
          ? <StatusBadge tone={llueve ? 'tertiary' : 'neutral'} icon={llueve ? 'umbrella' : 'sunny'}>{llueve ? 'Lloverá' : 'Seco'}</StatusBadge>
          : null} />
      <div className="grid grid-cols-2 gap-space-md">
        <div>
          <span className="text-body-sm text-on-surface-variant">Precipitación</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-telemetry-value-lg text-telemetry-value-lg text-on-surface">{fmt(mm, 1)}</span>
            <span className="text-body-md text-on-surface-variant">mm</span>
          </div>
        </div>
        <div>
          <span className="text-body-sm text-on-surface-variant">Probabilidad</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-telemetry-value-lg text-telemetry-value-lg text-on-surface">{fmt(p)}</span>
            <span className="text-body-md text-on-surface-variant">%</span>
          </div>
          <div className="w-full h-1.5 rounded-pill bg-white/10 mt-2 overflow-hidden" aria-hidden="true">
            <div className="h-full bg-tertiary rounded-pill" style={{ width: `${clamp(p)}%` }} />
          </div>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant m-0 mt-space-md">
        {llueve ? 'Hydra Cloud pospone el riego automático para aprovechar la lluvia.' : 'Sin lluvia prevista: el riego automático sigue activo.'}
      </p>
    </GlowCard>
  );
}
