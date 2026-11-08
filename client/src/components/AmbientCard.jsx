// Temperatura y humedad del aire (DHT22)
import GlowCard, { CardHeader } from './GlowCard';
import StatusBadge from './StatusBadge';
import { fmt, clamp, estadoTemp, estadoAire } from '../lib/format';

export default function AmbientCard({ data, extremos }) {
  const t = data?.temperatura, ha = data?.humedad_ambiental;
  const sinDht = typeof t !== 'number' && typeof ha !== 'number' && data?.humedad != null;
  return (
    <GlowCard tone="primary">
      <CardHeader icon="thermostat" tone="primary" title="Clima del huerto" subtitle="Sensor DHT22 · ambiente"
        right={sinDht
          ? <StatusBadge tone="warn" icon="sensors_off">DHT22 sin datos</StatusBadge>
          : <StatusBadge tone="primary" icon="partly_cloudy_day">{estadoTemp(t).split(':')[0]}</StatusBadge>} />

      <div className="grid grid-cols-2 gap-space-md mb-space-lg">
        <div>
          <span className="text-body-sm text-on-surface-variant">Temperatura</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-telemetry-value-lg text-[36px] font-bold text-on-surface">{fmt(t, 1)}</span>
            <span className="text-headline-sm text-on-surface-variant">°C</span>
          </div>
          <p className="text-body-sm text-primary m-0 mt-1">{estadoTemp(t)}</p>
        </div>
        <div>
          <span className="text-body-sm text-on-surface-variant">Humedad del aire</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-telemetry-value-lg text-[36px] font-bold text-on-surface">{fmt(ha)}</span>
            <span className="text-headline-sm text-on-surface-variant">%</span>
          </div>
          <div className="w-full h-1.5 rounded-pill bg-white/10 mt-2 overflow-hidden" aria-hidden="true">
            <div className="h-full bg-amber rounded-pill transition-all" style={{ width: `${clamp(ha)}%` }} />
          </div>
          <p className="text-body-sm text-on-surface-variant m-0 mt-1">{estadoAire(ha)}</p>
        </div>
      </div>

      <div className="mt-auto bg-black/25 border border-white/5 rounded-xl p-space-md flex justify-between text-body-sm text-on-surface-variant">
        <span>Mín. 24 h: <b className="text-on-surface font-semibold">{fmt(extremos?.min, 1)} °C</b></span>
        <span>Máx. 24 h: <b className="text-on-surface font-semibold">{fmt(extremos?.max, 1)} °C</b></span>
      </div>
    </GlowCard>
  );
}
