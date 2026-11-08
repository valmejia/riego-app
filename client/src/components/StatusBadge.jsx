// client/src/components/StatusBadge.jsx
const TONES = {
  primary: 'bg-primary/12 text-primary border-primary/25',
  tertiary: 'bg-tertiary/12 text-tertiary border-tertiary/25',
  warn: 'bg-warn/12 text-warn border-warn/30',
  error: 'bg-error/12 text-error border-error/30',
  neutral: 'bg-white/5 text-on-surface-variant border-white/10',
};
const DOT = { primary: 'bg-primary', tertiary: 'bg-tertiary', warn: 'bg-warn', error: 'bg-error', neutral: 'bg-outline' };

export default function StatusBadge({ children, tone = 'primary', icon, dot = !icon, pulse = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill border text-body-sm font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}>
      {dot && <span className={`w-2 h-2 rounded-pill ${DOT[tone]} ${pulse ? 'animate-pulse' : ''}`} aria-hidden="true" />}
      {icon && <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
