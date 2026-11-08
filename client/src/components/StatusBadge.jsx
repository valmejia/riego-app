// client/src/components/StatusBadge.jsx
export default function StatusBadge({ children, tone = 'primary', dot = true, pulse = false }) {
  const tones = {
    primary: 'bg-primary/15 text-primary',
    secondary: 'bg-secondary/15 text-secondary',
    tertiary: 'bg-tertiary/15 text-tertiary',
    neutral: 'bg-surface-container-highest text-on-surface',
    error: 'bg-error/15 text-error',
  };
  const dotTones = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
    neutral: 'bg-outline',
    error: 'bg-error',
  };

  return (
    <span
      className={`px-space-sm py-1 rounded-full font-body-sm font-semibold flex items-center gap-1.5 ${tones[tone]}`}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dotTones[tone]} ${pulse ? 'animate-pulse' : ''}`} />}
      {children}
    </span>
  );
}