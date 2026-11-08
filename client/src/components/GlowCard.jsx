// Tarjeta con el resplandor y la trama de puntos del diseño original.
const GLOW = {
  primary: 'rgba(78, 222, 163, 0.14)',
  tertiary: 'rgba(76, 215, 246, 0.14)',
  water: 'rgba(47, 159, 208, 0.16)',
  amber: 'rgba(194, 128, 46, 0.16)',
  neutral: 'rgba(255, 255, 255, 0.05)',
};
const DOTS = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')";

export default function GlowCard({ tone = 'primary', as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag
      {...rest}
      className={`relative overflow-hidden rounded-2xl border border-white/5 shadow-md p-space-lg flex flex-col ${className}`}
      style={{
        backgroundColor: 'var(--color-card)',
        backgroundImage: `radial-gradient(circle at 100% 0%, ${GLOW[tone]} 0%, transparent 55%), radial-gradient(circle at 0% 100%, rgba(255,255,255,0.02) 0%, transparent 50%), ${DOTS}`,
        backgroundSize: 'cover, cover, 20px 20px',
      }}
    >
      {children}
    </Tag>
  );
}

const ICON_TONE = {
  primary: 'bg-primary/10 text-primary',
  tertiary: 'bg-tertiary/10 text-tertiary',
  water: 'bg-water/15 text-water-ink',
  amber: 'bg-amber/15 text-amber-ink',
  neutral: 'bg-white/5 text-on-surface-variant',
};

export function CardHeader({ icon, tone = 'primary', title, subtitle, right }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-space-sm mb-space-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border border-white/5 ${ICON_TONE[tone]}`}>
          <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-on-surface text-headline-sm leading-tight m-0">{title}</h3>
          {subtitle && <p className="text-body-sm text-on-surface-variant m-0 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}
