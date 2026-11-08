// client/src/components/ModeToggle.jsx
export default function ModeToggle({ isAutonomous, onToggle }) {
  return (
    <div className="flex items-center gap-space-md p-space-xs bg-surface-container-low rounded-xl justify-between">
      <div className="flex items-center gap-space-sm pl-space-sm">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isAutonomous ? 'bg-primary animate-ping' : 'bg-tertiary animate-pulse'
          }`}
        />
        <div>
          <span className="font-headline-sm text-headline-sm font-semibold leading-none block">
            {isAutonomous ? 'Modo Automático' : 'Modo Manual'}
          </span>
          <span
            className={`block font-label-caps text-label-caps leading-tight mt-1 ${
              isAutonomous ? 'text-primary' : 'text-tertiary'
            }`}
          >
            {isAutonomous ? 'Tu planta está protegida' : 'Control manual activo'}
          </span>
        </div>
      </div>
      <button
        onClick={onToggle}
        className="px-space-md py-space-sm bg-surface-container-high hover:bg-surface-bright rounded-lg font-body-sm flex items-center gap-space-xs cursor-pointer transition-all"
      >
        <span className="material-symbols-outlined text-primary text-[18px]">touch_app</span>
        {isAutonomous ? 'Pasar a Manual' : 'Pasar a Auto'}
      </button>
    </div>
  );
}