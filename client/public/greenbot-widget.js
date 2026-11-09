/*!
 * GreenBot widget — chat flotante de Hydra Cloud (riego de plantas, sin React)
 * Conecta con el webhook de Make (módulo Webhook → ... → Webhook response).
 *
 * Uso:
 *   <script src="greenbot-widget.js"
 *           data-webhook="https://hook.us2.make.com/TU_ID"
 *           data-device="maceta1"
 *           defer></script>
 *
 * Atributos del <script>:
 *   data-webhook="..."          (obligatorio) URL del webhook del escenario Chat en Make
 *   data-device="maceta1"       id de la maceta del usuario; se envía como device_id
 *                               (también acepta data-device-id, el nombre anterior)
 *   data-history="1"            cuántos mensajes enviar al webhook (ver nota abajo)
 *   data-title / data-subtitle / data-welcome / data-support   textos opcionales
 *
 * Contrato con Make:
 *   Envía   POST  { "device_id": "maceta1", "messages": [ ... ], "transcript": "Usuario: ...\nAsistente: ..." }
 *   Recibe  200   { "reply": "..." }
 *
 * Nota sobre el historial: el módulo de Groq en Make lee el campo transcript (la
 * conversación reciente en texto), no messages[]. Para que el chat pueda confirmar
 * el tipo de planta ("¿es un helecho?" → "sí"), sube data-history (por ejemplo a 6)
 * una vez que el módulo de Groq use transcript.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var cfg = {
    webhook: (script && script.dataset.webhook) || "PEGA_AQUI_TU_WEBHOOK_URL",
    device: ((script && (script.dataset.device || script.dataset.deviceId)) || "maceta1").trim(),
    title: (script && script.dataset.title) || "GreenBot",
    subtitle: (script && script.dataset.subtitle) || "Asistente de riego de tu planta",
    history: Math.max(1, parseInt((script && script.dataset.history) || "1", 10) || 1),
    timeoutMs: 30000,
    support: (script && script.dataset.support) || "",
    welcome: (script && script.dataset.welcome) || "Hola, soy GreenBot 🌱. Cuéntame qué planta tienes y te ayudo a cuidarla y a ajustar su riego automático."
  };

  // El historial se guarda por maceta, para que no se mezcle entre dispositivos.
  var STORE_KEY = "greenbot_history_v1_" + cfg.device;
  var messages = load();

  function load() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || []; }
    catch { return []; }
  }
  function save() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-40))); }
    catch { /* almacenamiento no disponible: se ignora */ }
  }

  // ── Estilos (aislados dentro del Shadow DOM) ──────────────────────────────
  var CSS = "\
:host{all:initial}\
*{box-sizing:border-box}\
.root{--mint:#4edea3;--mint-soft:#10b981;--ink:#dae2fd;--muted:#bbcabf;--bg:#131b2e;--line:#2d3449;--bot:#222a3d;\
position:fixed;right:20px;bottom:20px;z-index:2147483000;font:15px/1.45 'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:var(--ink)}\
.fab{width:56px;height:56px;border-radius:50%;border:0;background:var(--mint);color:#003824;cursor:pointer;display:grid;place-items:center;box-shadow:0 6px 20px rgba(0,0,0,.25)}\
.fab:focus-visible,.send:focus-visible,.close:focus-visible{outline:3px solid #f2b705;outline-offset:2px}\
.panel{position:absolute;right:0;bottom:70px;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 110px));\
background:var(--bg);border:1px solid var(--line);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.28);display:none;flex-direction:column;overflow:hidden}\
.panel.open{display:flex}\
.head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--mint);color:#003824}\
.head h2{margin:0;font-size:16px;font-weight:650}\
.head p{margin:0;font-size:12.5px;opacity:.9}\
.head .txt{flex:1}\
.close{background:transparent;border:0;color:inherit;cursor:pointer;font-size:22px;line-height:1;padding:4px 8px;border-radius:6px}\
.log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}\
.msg{max-width:86%;padding:9px 12px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}\
.msg.bot{background:var(--bot);border-bottom-left-radius:4px;align-self:flex-start}\
.msg.user{background:var(--mint);color:#003824;border-bottom-right-radius:4px;align-self:flex-end}\
.msg.err{background:#3a1d1d;color:#ffb4ab;align-self:flex-start}\
.dots{display:inline-flex;gap:4px;align-items:center;height:18px}\
.dots i{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:b 1s infinite ease-in-out}\
.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}\
@keyframes b{0%,80%,100%{opacity:.3}40%{opacity:1}}\
@media(prefers-reduced-motion:reduce){.dots i{animation:none;opacity:.7}}\
.form{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line);background:var(--bg)}\
.form textarea{flex:1;resize:none;border:1px solid var(--line);border-radius:10px;padding:9px 10px;font:inherit;color:var(--ink);background:var(--bg);max-height:96px}\
.form textarea:focus-visible{outline:2px solid var(--mint);outline-offset:0}\
.send{border:0;border-radius:10px;padding:0 14px;background:var(--mint);color:#003824;font:inherit;font-weight:600;cursor:pointer}\
.send:disabled{opacity:.5;cursor:not-allowed}\
@media(max-width:480px){.root{right:12px;bottom:12px}}";

  // ── Construcción del DOM ──────────────────────────────────────────────────
  var host = document.createElement("div");
  host.id = "greenbot-host";
  var shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML =
    "<style>" + CSS + "</style>" +
    '<div class="root">' +
      '<section class="panel" id="panel" role="dialog" aria-label="Chat con GreenBot">' +
        '<header class="head"><div class="txt"><h2></h2><p></p></div>' +
          '<button class="close" type="button" aria-label="Cerrar chat">×</button></header>' +
        '<div class="log" id="log" role="log" aria-live="polite"></div>' +
        '<form class="form" id="form">' +
          '<textarea id="input" rows="1" maxlength="1000" placeholder="Escribe tu pregunta" aria-label="Mensaje"></textarea>' +
          '<button class="send" id="send" type="submit">Enviar</button>' +
        "</form>" +
      "</section>" +
      '<button class="fab" id="fab" type="button" aria-label="Abrir chat con GreenBot" aria-expanded="false">' +
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>' +
      "</button>" +
    "</div>";

  var $ = function (id) { return shadow.getElementById(id); };
  var panel = $("panel"), log = $("log"), form = $("form"),
      input = $("input"), send = $("send"), fab = $("fab");
  shadow.querySelector(".head h2").textContent = cfg.title;
  shadow.querySelector(".head p").textContent = cfg.subtitle;

  function setOpen(open) {
    panel.classList.toggle("open", open);
    fab.setAttribute("aria-expanded", String(open));
    if (open) { input.focus(); scroll(); }
  }
  fab.addEventListener("click", function () { setOpen(!panel.classList.contains("open")); });
  shadow.querySelector(".close").addEventListener("click", function () { setOpen(false); fab.focus(); });
  shadow.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });

  function scroll() { log.scrollTop = log.scrollHeight; }

  // Los textos se insertan con textContent: nunca se interpreta HTML de la respuesta.
  function bubble(kind, text) {
    var el = document.createElement("div");
    el.className = "msg " + kind;
    el.textContent = text;
    log.appendChild(el);
    scroll();
    return el;
  }

  function typing() {
    var el = document.createElement("div");
    el.className = "msg bot";
    el.setAttribute("aria-label", "GreenBot está escribiendo");
    el.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
    log.appendChild(el);
    scroll();
    return el;
  }

  // ── Comunicación con Make ─────────────────────────────────────────────────
  // El body del Webhook response en Make es {"reply": "<texto>"} sin escapar,
  // así que si el texto trae comillas o saltos de línea el JSON puede salir roto.
  // Se intenta JSON.parse y, si falla, se extrae el texto a mano.
  function parseReply(raw) {
    try {
      var data = JSON.parse(raw);
      if (data && typeof data.reply === "string") return data.reply;
    } catch { /* se intenta la extracción manual */ }
    var m = raw.match(/"reply"\s*:\s*"([\s\S]*)"\s*}\s*$/);
    return m ? m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : null;
  }

  // Conversación reciente como texto ("Usuario: ..." / "Asistente: ..."), para que Make
  // la mapee en un solo campo (transcript) sin tener que armar arrays.
  function toTranscript(history) {
    return history.map(function (m) {
      return (m.role === "user" ? "Usuario" : "Asistente") + ": " + m.content;
    }).join("\n");
  }

  function askGreenBot(history) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, cfg.timeoutMs);
    return fetch(cfg.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: cfg.device, messages: history, transcript: toTranscript(history) }),
      signal: ctrl.signal
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    }).then(function (raw) {
      var reply = parseReply(raw);
      if (!reply) throw new Error("Respuesta sin campo reply");
      return reply.trim();
    });
  }

  var busy = false;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || busy) return;

    busy = true;
    send.disabled = true;
    input.value = "";
    autosize();

    messages.push({ role: "user", content: text });
    bubble("user", text);
    var wait = typing();

    askGreenBot(messages.slice(-Math.max(1, cfg.history)))
      .then(function (reply) {
        messages.push({ role: "assistant", content: reply });
        wait.remove();
        bubble("bot", reply);
      })
      .catch(function () {
        wait.remove();
        bubble("err", "No pude conectar con GreenBot. Intenta de nuevo" + (cfg.support ? " o escribe a " + cfg.support : "") + ".");
      })
      .then(function () {
        save();
        busy = false;
        send.disabled = false;
        input.focus();
      });
  });

  // Enter envía, Shift+Enter agrega salto de línea.
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });
  function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 96) + "px"; }
  input.addEventListener("input", autosize);

  // ── Arranque ──────────────────────────────────────────────────────────────
  function start() {
    document.body.appendChild(host);
    bubble("bot", cfg.welcome);
    messages.forEach(function (m) { bubble(m.role === "user" ? "user" : "bot", m.content); });
  }
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);

  if (cfg.webhook.indexOf("PEGA_AQUI") === 0) {
    console.warn("[GreenBot] Falta data-webhook con la URL del webhook de Make.");
  }
})();
