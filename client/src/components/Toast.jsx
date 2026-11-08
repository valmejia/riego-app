export default function Toast({ toast }) {
  return (
    <div aria-live="assertive" className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[70] pointer-events-none">
      {toast && (
        <div className={`px-4 py-2.5 rounded-xl shadow-lg border text-body-md font-semibold flex items-center gap-2
          ${toast.error ? 'bg-error-container text-on-error-container border-error/40' : 'bg-surface-container-highest text-on-surface border-primary/30'}`}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{toast.error ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
