// client/src/components/TelemetryCard.jsx
const TONES = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary' },
  tertiary: { bg: 'bg-tertiary/10', text: 'text-tertiary' },
};

export default function TelemetryCard({
  icon,
  tone = 'primary',
  title,
  subtitle,
  badge,
  className = '',
  children,
}) {
  const t = TONES[tone];
  return (
    <div className={`bg-surface-container-low p-space-lg rounded-xl shadow-md flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between mb-space-md">
        <div className="flex items-center gap-space-xs">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.bg} ${t.text}`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <div>
            <span className="font-headline-sm font-bold block">{title}</span>
            <span className={`font-body-sm ${t.text}`}>{subtitle}</span>
          </div>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}