// Ajustes: token de control, nombre de la planta y datos de conexión
import { useState } from 'react';
import { getToken, setToken, DEVICE_ID } from '../lib/api';

// Se monta solo cuando está abierto, así el estado inicial se lee en cada apertura.
export default function SettingsDrawer({ onClose, disp, onGuardarPlanta, health }) {
  const [token, setTok] = useState(getToken);
  const [planta, setPlanta] = useState(disp?.nombre_planta || '');
  const [ver, setVer] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="ajustes-title"
      onKeyDown={e => e.key === 'Escape' && onClose()}>
      <button type="button" aria-label="Cerrar ajustes" onClick={onClose} className="absolute inset-0 bg-black/60 border-0 cursor-default" />
      <aside className="relative w-full max-w-md h-full overflow-y-auto bg-surface-container-low border-l border-white/10 p-space-lg flex flex-col gap-space-lg">
        <div className="flex items-center justify-between">
          <h2 id="ajustes-title" className="m-0 text-headline-md font-bold text-on-surface">Ajustes</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" autoFocus
            className="w-10 h-10 rounded-xl border-0 bg-surface-container-high text-on-surface cursor-pointer flex items-center justify-center">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <form className="flex flex-col gap-space-sm" onSubmit={e => { e.preventDefault(); setToken(token.trim()); onClose('Token guardado en este navegador'); }}>
          <label htmlFor="tok" className="font-label-caps text-label-caps text-on-surface-variant uppercase">Token de control</label>
          <div className="flex gap-2">
            <input id="tok" type={ver ? 'text' : 'password'} value={token} onChange={e => setTok(e.target.value)} autoComplete="off"
              placeholder="El API_TOKEN de server/.env"
              className="flex-1 rounded-xl border border-white/10 bg-surface-container px-3 py-2.5 text-body-lg text-on-surface font-label-code" />
            <button type="button" onClick={() => setVer(v => !v)} aria-label={ver ? 'Ocultar token' : 'Mostrar token'}
              className="w-11 rounded-xl border border-white/10 bg-transparent text-on-surface-variant cursor-pointer flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{ver ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          <p className="m-0 text-body-sm text-on-surface-variant">
            Necesario para regar, detener o cambiar el modo. Se guarda solo en este navegador; no lo uses en equipos compartidos.
          </p>
          <button type="submit" className="self-start px-space-md py-2 rounded-lg border-0 bg-primary text-on-primary font-semibold cursor-pointer">Guardar token</button>
        </form>

        <form className="flex flex-col gap-space-sm" onSubmit={e => { e.preventDefault(); onGuardarPlanta(planta); }}>
          <label htmlFor="planta" className="font-label-caps text-label-caps text-on-surface-variant uppercase">Nombre de la planta</label>
          <div className="flex gap-2">
            <input id="planta" value={planta} maxLength={60} onChange={e => setPlanta(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-surface-container px-3 py-2.5 text-body-lg text-on-surface" />
            <button type="submit" disabled={!planta.trim()} className="px-space-md rounded-xl border-0 bg-surface-container-high text-on-surface font-semibold cursor-pointer disabled:opacity-40">Guardar</button>
          </div>
        </form>

        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-space-md gap-y-2 text-body-md bg-black/25 rounded-xl p-space-md border border-white/5">
          <dt className="text-on-surface-variant">Dispositivo</dt><dd className="m-0 font-label-code text-on-surface">{DEVICE_ID}</dd>
          <dt className="text-on-surface-variant">API</dt><dd className="m-0 font-label-code text-on-surface break-all">{import.meta.env.VITE_API_URL || 'proxy local → :5000'}</dd>
          <dt className="text-on-surface-variant">Servidor</dt><dd className="m-0 text-on-surface">{health?.ok ? 'En línea' : 'Sin respuesta'}</dd>
          <dt className="text-on-surface-variant">MongoDB</dt><dd className="m-0 text-on-surface">{health?.mongo ? 'Conectado' : '—'}</dd>
          <dt className="text-on-surface-variant">GreenBot</dt><dd className="m-0 text-on-surface">{import.meta.env.VITE_GREENBOT_WEBHOOK ? 'Webhook configurado' : 'Falta VITE_GREENBOT_WEBHOOK'}</dd>
        </dl>
      </aside>
    </div>
  );
}
