// client/src/components/Header.jsx
export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
      <div className="h-20 w-full px-gutter-lg flex items-center justify-between gap-gutter">
        <div className="flex items-center gap-space-lg flex-shrink-0">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
              🌱
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-bold leading-tight">
                AgroBot <span className="text-primary">IoT</span>
              </span>
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                Autonomous Irrigation
              </span>
            </div>
          </div>
          <div className="hidden xl:flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container-high rounded-full border border-secondary-container/40">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label-code text-primary font-semibold">
              ESP32-WROOM: Conectado
            </span>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-space-xs px-space-xs py-space-xs bg-surface-container-low rounded-xl">
          <a className="px-space-md py-space-sm bg-primary-container text-on-primary-container font-semibold rounded-lg" href="#">
            Mi Maceta
          </a>
          <a className="px-space-md py-space-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#historial">
            Historial
          </a>
          <a className="px-space-md py-space-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#consejos">
            Consejos
          </a>
        </nav>

        <div className="flex items-center gap-space-md flex-shrink-0">
          <div className="hidden sm:flex items-center gap-space-sm px-space-md py-space-sm bg-surface-container-low rounded-lg border border-surface-container-high">
            <span className="material-symbols-outlined text-primary text-[20px]">potted_plant</span>
            <div className="flex flex-col text-left">
              <span className="font-label-caps text-on-surface-variant leading-none">Mi Maceta</span>
              <span className="font-body-sm font-semibold text-primary">🌿 Albahaca Dulce</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}