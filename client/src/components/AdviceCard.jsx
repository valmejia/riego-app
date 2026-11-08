// Consejos generados a partir de las lecturas actuales
import GlowCard, { CardHeader } from './GlowCard';

function consejos({ data, disp, offline }) {
  const out = [];
  const h = data?.humedad, t = data?.temperatura, ha = data?.humedad_ambiental;
  const u = disp?.umbral_riego ?? 30;
  if (offline) out.push(['wifi_off', 'warn', 'El Arduino dejó de reportar. Revisa el WiFi, la alimentación y que el túnel de ngrok siga activo.']);
  if (data?.humedad == null) return [...out, ['hourglass_top', 'neutral', 'Esperando la primera lectura del sensor.']];
  if (h < u) out.push(['water_drop', 'tertiary', disp?.modo === 'manual'
    ? `La tierra está al ${Math.round(h)}% y estás en modo manual: riega o vuelve a automático.`
    : `La tierra está bajo el umbral (${u}%). La bomba debería activarse en el próximo ciclo.`]);
  else if (h > 80) out.push(['flood', 'warn', 'Suelo encharcado: revisa el drenaje de la maceta y que la bomba no se haya quedado encendida.']);
  else out.push(['eco', 'primary', 'La humedad del suelo está en rango saludable. ¡Sigue así!']);
  if (h <= 1 || h >= 99) out.push(['sensors_off', 'warn', `Lectura extrema (${Math.round(h)}%): puede ser el HW-080 desconectado o corroído. Comprueba el cableado.`]);
  if (typeof t === 'number' && t > 30) out.push(['sunny', 'warn', 'Hace calor: riega temprano por la mañana y aleja la maceta del sol directo.']);
  if (typeof t === 'number' && t < 10) out.push(['ac_unit', 'tertiary', 'Temperatura baja: reduce el riego, la planta evapora menos agua.']);
  if (typeof ha === 'number' && ha > 80) out.push(['coronavirus', 'warn', 'Aire muy húmedo: ventila para evitar hongos.']);
  if (typeof t !== 'number') out.push(['sensors_off', 'neutral', 'El DHT22 no envía datos. Revisa su pin de datos y la resistencia pull-up.']);
  return out;
}

const TONE = { primary: 'text-primary', tertiary: 'text-tertiary', warn: 'text-warn', neutral: 'text-on-surface-variant' };

export default function AdviceCard(props) {
  const lista = consejos(props);
  return (
    <GlowCard tone="primary" as="section" id="consejos" aria-labelledby="cons-title" className="scroll-mt-28">
      <CardHeader icon="tips_and_updates" tone="primary" title={<span id="cons-title">Consejos para tu {props.disp?.nombre_planta || 'planta'}</span>} subtitle="Según las lecturas actuales" />
      <ul className="list-none m-0 p-0 flex flex-col gap-space-sm">
        {lista.map(([icon, tone, txt], i) => (
          <li key={i} className="flex gap-3 p-space-md bg-black/25 rounded-xl border border-white/5">
            <span className={`material-symbols-outlined text-[20px] ${TONE[tone]}`} aria-hidden="true">{icon}</span>
            <p className="m-0 text-body-md text-on-surface leading-relaxed">{txt}</p>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-space-md mt-auto text-body-sm text-on-surface-variant">
        <span>💧 Riega temprano</span><span>☀️ Evita el sol abrasador</span><span>✂️ Poda regular</span>
      </div>
    </GlowCard>
  );
}
