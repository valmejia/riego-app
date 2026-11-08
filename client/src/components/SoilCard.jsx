// Humedad del suelo (sensor HW-080)
import GlowCard, { CardHeader } from './GlowCard';
import StatusBadge from './StatusBadge';
import { fmt, clamp, estadoSuelo, MOTIVO_LABEL } from '../lib/format';

function Gauge({ value, umbral }) {
  const R = 52, C = 2 * Math.PI * R, ARC = 0.75; // arco de 270°
  const pct = clamp(value) / 100;
  const marca = clamp(umbral) / 100;
  const ang = (135 + 270 * marca) * (Math.PI / 180);
  return (
    <svg viewBox="0 0 140 140" className="w-40 h-40 shrink-0" role="img"
      aria-label={`Humedad del suelo ${fmt(value)} por ciento, umbral de riego ${umbral} por ciento`}>
      <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"
        strokeDasharray={`${C * ARC} ${C}`} strokeLinecap="round" transform="rotate(135 70 70)" />
      {typeof value === 'number' && (
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-water)" strokeWidth="10"
          strokeDasharray={`${C * ARC * pct} ${C}`} strokeLinecap="round" transform="rotate(135 70 70)"
          style={{ transition: 'stroke-dasharray .6s ease' }} />
      )}
      {/* Marca del umbral de riego */}
      <line x1={70 + 46 * Math.cos(ang)} y1={70 + 46 * Math.sin(ang)} x2={70 + 64 * Math.cos(ang)} y2={70 + 64 * Math.sin(ang)}
        stroke="var(--color-on-surface)" strokeWidth="2" strokeLinecap="round" />
      <text x="70" y="70" textAnchor="middle" className="fill-on-surface" style={{ font: '700 30px var(--font-telemetry-value-lg)' }}>
        {fmt(value)}<tspan style={{ fontSize: 14 }} dx="2">%</tspan>
      </text>
      <text x="70" y="92" textAnchor="middle" className="fill-on-surface-variant" style={{ font: '600 10px var(--font-label-caps)', letterSpacing: '.06em' }}>
        UMBRAL {umbral}%
      </text>
    </svg>
  );
}

export default function SoilCard({ data, umbral }) {
  const h = data?.humedad;
  const est = estadoSuelo(h, umbral);
  return (
    <GlowCard tone="water">
      <CardHeader icon="water_drop" tone="water" title="Agua en la tierra" subtitle="Sensor HW-080 · raíces"
        right={<StatusBadge tone={est.tone} icon={est.icon}>{est.label}</StatusBadge>} />
      <div className="flex flex-col sm:flex-row items-center gap-space-lg">
        <Gauge value={h} umbral={umbral} />
        <dl className="flex-1 w-full grid grid-cols-2 sm:grid-cols-1 gap-space-sm m-0">
          <div className="bg-black/25 rounded-xl p-space-md border border-white/5">
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase">Decisión</dt>
            <dd className="m-0 mt-1 text-body-md text-on-surface">
              {data?.motivo ? MOTIVO_LABEL[data.motivo] ?? data.motivo : 'Sin decisión registrada'}
            </dd>
          </div>
          <div className="bg-black/25 rounded-xl p-space-md border border-white/5">
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase">Lectura cruda (ADC)</dt>
            <dd className="m-0 mt-1 font-telemetry-value-md text-telemetry-value-md text-on-surface">{fmt(data?.raw)}</dd>
          </div>
        </dl>
      </div>
    </GlowCard>
  );
}
