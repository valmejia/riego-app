// GreenBot — chat flotante conectado al webhook de Make.
// Contrato:  POST { device_id, messages:[{role,content}], context:{...lecturas} }  →  200 { reply }
// device_id va en la raíz para que Make sepa de qué maceta se habla (varias macetas a futuro).
import { useEffect, useRef, useState } from 'react';
import { DEVICE_ID } from '../lib/api';

const WEBHOOK = import.meta.env.VITE_GREENBOT_WEBHOOK || '';
// Cuántos mensajes enviar a Make. Súbelo cuando el módulo de Groq arme el array completo.
const HISTORY = Number(import.meta.env.VITE_GREENBOT_HISTORY) || 1;
const STORE = `greenbot_history_v1_${DEVICE_ID}`; // una conversación por maceta
const WELCOME = 'Hola, soy GreenBot 🌱. Cuéntame qué planta tienes y te ayudo a cuidarla y a ajustar su riego automático.';
const SUGERENCIAS = ['¿Cómo está mi planta?', '¿Debo regar hoy?', '¿Por qué no se activa la bomba?'];

function load() { try { return JSON.parse(sessionStorage.getItem(STORE)) || []; } catch { return []; } }
function save(m) { try { sessionStorage.setItem(STORE, JSON.stringify(m.slice(-40))); } catch { /* sin storage */ } }

// Make a veces arma el JSON con texto sin escapar: si JSON.parse falla se extrae a mano.
function parseReply(raw) {
  try { const d = JSON.parse(raw); if (d && typeof d.reply === 'string') return d.reply; } catch { /* manual */ }
  const m = raw.match(/"reply"\s*:\s*"([\s\S]*)"\s*}\s*$/);
  if (m) return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  // Webhook response en texto plano
  return raw && !raw.trim().startsWith('<') && raw.length < 4000 ? raw : null;
}

async function ask(messages, context, device_id) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(WEBHOOK, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id, messages, context }), signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reply = parseReply(await res.text());
    if (!reply) throw new Error('Respuesta sin campo reply');
    return reply.trim();
  } finally { clearTimeout(timer); }
}

export default function GreenBot({ context }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(load);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const logRef = useRef(null), inputRef = useRef(null), fabRef = useRef(null);

  useEffect(() => { save(messages); }, [messages]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [messages, busy, open, err]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  async function send(contenido) {
    const t = (contenido ?? text).trim();
    if (!t || busy) return;
    setText(''); setErr(null);
    const next = [...messages, { role: 'user', content: t }];
    setMessages(next);
    if (!WEBHOOK) { setErr('Falta VITE_GREENBOT_WEBHOOK en client/.env'); return; }
    setBusy(true);
    try {
      const reply = await ask(next.slice(-Math.max(1, HISTORY)), context, context?.device_id || DEVICE_ID);
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setErr('No pude conectar con GreenBot. Intenta de nuevo en un momento.');
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function close() { setOpen(false); fabRef.current?.focus(); }

  return (
    <div className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-50" onKeyDown={e => e.key === 'Escape' && open && close()}>
      {open && (
        <section role="dialog" aria-label="Chat con GreenBot"
          className="absolute right-0 bottom-[72px] w-[min(390px,calc(100vw-32px))] h-[min(580px,calc(100dvh-120px))] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
          <header className="flex items-center gap-3 px-4 py-3 bg-primary text-on-primary">
            <span className="w-9 h-9 rounded-pill bg-on-primary/15 flex items-center justify-center" aria-hidden="true">
              <span className="material-symbols-outlined">psychiatry</span>
            </span>
            <div className="flex-1">
              <h2 className="m-0 text-body-lg font-bold">GreenBot</h2>
              <p className="m-0 text-body-sm opacity-80">Asistente de Hydra Cloud</p>
            </div>
            {messages.length > 0 && (
              <button type="button" onClick={() => { setMessages([]); setErr(null); }} aria-label="Borrar conversación"
                className="w-9 h-9 rounded-lg border-0 bg-transparent text-on-primary hover:bg-on-primary/10 cursor-pointer flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete_sweep</span>
              </button>
            )}
            <button type="button" onClick={close} aria-label="Cerrar chat"
              className="w-9 h-9 rounded-lg border-0 bg-transparent text-on-primary hover:bg-on-primary/10 cursor-pointer flex items-center justify-center">
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </header>

          <div ref={logRef} role="log" aria-live="polite" className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            <Bubble role="assistant">{WELCOME}</Bubble>
            {messages.map((m, i) => <Bubble key={i} role={m.role}>{m.content}</Bubble>)}
            {busy && (
              <div className="self-start bg-surface-container-high rounded-2xl rounded-bl-sm px-4 py-3" aria-label="GreenBot está escribiendo">
                <span className="flex gap-1">{[0, 1, 2].map(i => <i key={i} className="w-1.5 h-1.5 rounded-pill bg-on-surface-variant animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
              </div>
            )}
            {err && <div className="self-start max-w-[86%] px-3 py-2 rounded-xl bg-error-container/40 text-error text-body-md">{err}</div>}
            {messages.length === 0 && !busy && (
              <div className="flex flex-wrap gap-2 mt-2">
                {SUGERENCIAS.map(s => (
                  <button key={s} type="button" onClick={() => send(s)}
                    className="px-3 py-1.5 rounded-pill border border-primary/30 bg-primary/10 text-primary text-body-sm cursor-pointer hover:bg-primary/20">{s}</button>
                ))}
              </div>
            )}
          </div>

          <form className="flex gap-2 p-3 border-t border-white/5" onSubmit={e => { e.preventDefault(); send(); }}>
            <textarea ref={inputRef} rows={1} maxLength={1000} value={text} placeholder="Escribe tu pregunta" aria-label="Mensaje"
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              className="flex-1 resize-none max-h-24 rounded-xl border border-white/10 bg-surface-container px-3 py-2.5 text-body-lg text-on-surface placeholder:text-on-surface-variant focus:outline-2 focus:outline-primary" />
            <button type="submit" disabled={busy || !text.trim()} aria-label="Enviar"
              className="w-11 rounded-xl border-0 bg-primary text-on-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center">
              <span className="material-symbols-outlined" aria-hidden="true">send</span>
            </button>
          </form>
        </section>
      )}
      <button ref={fabRef} type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        aria-label={open ? 'Cerrar chat con GreenBot' : 'Abrir chat con GreenBot'}
        className="w-14 h-14 rounded-pill border-0 bg-primary text-on-primary shadow-[0_6px_20px_rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center hover:scale-105 transition-transform">
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">{open ? 'close' : 'chat'}</span>
      </button>
    </div>
  );
}

function Bubble({ role, children }) {
  const user = role === 'user';
  // Texto plano: React escapa el contenido, nunca se interpreta HTML de la respuesta.
  return (
    <div className={`max-w-[86%] px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap break-words text-body-lg ${user
      ? 'self-end bg-primary text-on-primary rounded-br-sm'
      : 'self-start bg-surface-container-high text-on-surface rounded-bl-sm'}`}>
      {children}
    </div>
  );
}
