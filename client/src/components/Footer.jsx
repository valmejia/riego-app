// client/src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest py-space-xl border-t border-surface-container-high/40">
      <div className="w-full px-gutter-lg flex flex-col md:flex-row items-center justify-between gap-space-md font-body-sm text-on-surface-variant">
        <div className="flex items-center gap-space-md">
          <span className="text-primary font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            AgroBot Cuidador Inteligente
          </span>
          <span>•</span>
          <span>Tus plantas siempre verdes y con agua justa</span>
        </div>
        <div>© 2025 AgroBot • Jardinería sin preocupaciones.</div>
      </div>
    </footer>
  );
}