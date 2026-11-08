// client/src/components/AdviceCard.jsx
export default function AdviceCard({ humedad }) {
  const consejo =
    humedad == null
      ? '🌿 Esperando la primera lectura…'
      : humedad < 30
      ? '💧 La tierra está seca. Considera regar pronto o revisar la bomba.'
      : humedad > 75
      ? '⚠️ El suelo está muy húmedo. Evita regar para no ahogar las raíces.'
      : '🌿 Tu planta está en un nivel saludable. Sigue así.';

  return (
    <div className="bg-surface-container-low p-space-lg rounded-xl shadow-md flex flex-col gap-space-sm">
      <div className="flex items-center gap-space-xs text-primary">
        <span className="material-symbols-outlined text-[22px]">tips_and_updates</span>
        <span className="font-headline-sm font-bold">Consejo para tu Albahaca</span>
      </div>
      <div className="p-space-md bg-surface-container rounded-xl">
        <p className="font-body-sm leading-relaxed">{consejo}</p>
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-surface-container-high/40 text-[12px] text-on-surface-variant">
          <span>💧 Riega temprano</span>
          <span>☀️ Evita sol abrasador</span>
          <span>✂️ Poda regular</span>
        </div>
      </div>
    </div>
  );
}