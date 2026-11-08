// Registro de órdenes enviadas a la bomba
import GlowCard, { CardHeader } from './GlowCard';
import StatusBadge from './StatusBadge';
import { fechaHora } from '../lib/format';

const ESTADO = {
  pendiente: { tone: 'warn', label: 'En cola' },
  ejecutado: { tone: 'primary', label: 'Ejecutado' },
  cancelado: { tone: 'neutral', label: 'Cancelado' },
  expirado: { tone: 'error', label: 'Caducado' },
};

export default function ActivityLog({ comandos, error }) {
  return (
    <GlowCard tone="neutral" as="section" id="actividad" aria-labelledby="act-title" className="scroll-mt-28">
      <CardHeader icon="history" tone="neutral" title={<span id="act-title">Actividad</span>} subtitle="Órdenes de riego recientes" />
      {error && !comandos ? (
        <p className="text-error text-body-md m-0">No se pudo cargar: {error}</p>
      ) : !comandos?.length ? (
        <p className="text-on-surface-variant text-body-md m-0">Todavía no hay órdenes.</p>
      ) : (
        <ol className="list-none m-0 p-0 flex flex-col gap-1 max-h-[420px] overflow-auto">
          {comandos.map(c => {
            const e = ESTADO[c.estado] || ESTADO.pendiente;
            return (
              <li key={c.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/[0.03]">
                <span className={`material-symbols-outlined text-[20px] ${c.accion === 'regar' ? 'text-tertiary' : 'text-error'}`} aria-hidden="true">
                  {c.accion === 'regar' ? 'water_drop' : 'stop_circle'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-body-md text-on-surface font-semibold">
                    {c.accion === 'regar' ? `Regar ${c.duracion ?? 30} s` : 'Detener bomba'}
                  </div>
                  <div className="text-body-sm text-on-surface-variant">
                    {fechaHora(c.timestamp)} · {{ app: 'Panel web', greenbot: 'GreenBot' }[c.origen] || 'Make'}
                  </div>
                </div>
                <StatusBadge tone={e.tone}>{e.label}</StatusBadge>
              </li>
            );
          })}
        </ol>
      )}
    </GlowCard>
  );
}
