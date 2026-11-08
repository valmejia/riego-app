// client/src/components/Header.jsx
import StatusBadge from './StatusBadge';

const NAV = [
  { href: '#panel', label: 'Panel' },
  { href: '#historial', label: 'Historial' },
  { href: '#actividad', label: 'Actividad' },
  { href: '#consejos', label: 'Consejos' },
];

export default function Header({ conexion, planta, onSettings }) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-white/5">
      <div className="h-16 md:h-20 max-w-[1400px] mx-auto px-4 md:px-gutter-lg flex items-center justify-between gap-gutter">
        <a href="#panel" className="flex items-center gap-space-sm no-underline text-on-surface shrink-0">
          <Logo />
          <span className="flex flex-col">
            <span className="text-headline-sm font-bold leading-tight">
              Hydra <span className="text-primary">Cloud</span>
            </span>
            <span className="hidden sm:block font-label-caps text-label-caps text-on-surface-variant uppercase">
              Riego inteligente
            </span>
          </span>
        </a>

        <nav aria-label="Secciones" className="hidden lg:flex items-center gap-1 p-1 bg-surface-container-low rounded-xl">
          {NAV.map(n => (
            <a key={n.href} href={n.href}
              className="px-space-md py-space-sm text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors no-underline">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-space-sm shrink-0">
          <StatusBadge tone={conexion.tone} pulse={conexion.tone === 'primary'} className="hidden sm:inline-flex">
            <span className="font-label-code">{conexion.label}</span>
          </StatusBadge>
          <div className="hidden md:flex items-center gap-space-sm px-space-md py-1.5 bg-surface-container-low rounded-lg border border-white/5">
            <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">potted_plant</span>
            <span className="flex flex-col">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase leading-none">Mi maceta</span>
              <span className="text-body-sm font-semibold text-primary">{planta || '—'}</span>
            </span>
          </div>
          <button type="button" onClick={onSettings} aria-label="Ajustes"
            className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface flex items-center justify-center cursor-pointer border-0 transition-colors">
            <span className="material-symbols-outlined" aria-hidden="true">settings</span>
          </button>
        </div>
      </div>
      {/* Navegación compacta para móvil */}
      <nav aria-label="Secciones" className="lg:hidden flex gap-1 px-4 pb-2 overflow-x-auto">
        {NAV.map(n => (
          <a key={n.href} href={n.href}
            className="px-3 py-1.5 text-body-sm text-on-surface-variant bg-surface-container-low rounded-lg no-underline whitespace-nowrap">
            {n.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export function Logo({ size = 40 }) {
  return (
    <span className="rounded-xl bg-primary/15 flex items-center justify-center shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path d="M7 17.5a4.5 4.5 0 0 1 .4-9A6 6 0 0 1 19 9.6a4 4 0 0 1-.6 7.9H7z" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 11.5c1.4 1.8 2 2.9 2 3.8a2 2 0 1 1-4 0c0-.9.6-2 2-3.8z" fill="var(--color-tertiary)" />
      </svg>
    </span>
  );
}
