// client/src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest py-space-xl border-t border-white/5 mt-space-xl">
      <div className="max-w-[1400px] mx-auto px-4 md:px-gutter-lg flex flex-col md:flex-row items-center justify-between gap-space-md text-body-sm text-on-surface-variant">
        <div className="flex flex-wrap items-center justify-center gap-space-sm">
          <span className="text-primary font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-pill bg-primary" aria-hidden="true" />
            Hydra Cloud
          </span>
          <span aria-hidden="true">•</span>
          <span>Arduino UNO R4 · HW-080 · DHT22 · Relé SRD-05VDC</span>
        </div>
        <div>© {new Date().getFullYear()} Hydra Cloud · Con GreenBot</div>
      </div>
    </footer>
  );
}
