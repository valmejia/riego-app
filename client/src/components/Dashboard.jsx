// client/src/components/Dashboard.jsx
import { useState } from 'react';
import { useHumedad } from '../hooks/useHumedad';

const MOTIVO_LABEL = {
  suelo_humedo: 'Suelo húmedo, no riega',
  lluvia_esperada: 'Lluvia esperada, no riega',
  regando: 'Regando ahora',
};

function fmt(v, sufijo = '') {
  return v != null ? `${v}${sufijo}` : '—';
}

// --- ESTILOS DE FONDO PARA LAS TARJETAS ---
const getCardStyle = (colorTheme) => {
  const glow = colorTheme === 'verde' 
    ? 'rgba(34, 197, 94, 0.15)' // Verde
    : 'rgba(56, 189, 248, 0.15)'; // Azul

  return {
    backgroundColor: '#0f172a',
    backgroundImage: `
      radial-gradient(circle at 100% 0%, ${glow} 0%, transparent 50%),
      radial-gradient(circle at 0% 100%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
      url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')
    `,
    backgroundSize: 'cover, cover, 20px 20px',
  };
};

export default function Dashboard() {
  const { data, loading, error } = useHumedad('maceta1');
  const [isAutonomous, setIsAutonomous] = useState(true);
  const [pumpActive, setPumpActive] = useState(false);

  if (loading) return <div className="p-gutter-lg">Cargando telemetría…</div>;
  if (error)   return <div className="p-gutter-lg text-error">Error: {error}</div>;

  const humedad = data?.humedad;
  const motivo  = data?.motivo;
  const riego   = !!data?.riego;

  const pctHumedad = Math.max(0, Math.min(100, humedad ?? 0));

  const estadoHumedad =
    humedad == null   ? 'Sin datos'
    : humedad >= 70   ? '😊 ¡Perfecta!'
    : humedad >= 40   ? '🙂 Adecuada'
    : humedad >= 20   ? '😐 Empieza a secarse'
    :                   '😟 Necesita agua';

  return (
    <section className="w-full px-gutter-lg py-space-lg flex flex-col gap-space-lg">
      {/* Cabecera + modo */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider">
              🌿 ESTADO EN VIVO • MACETA PRINCIPAL
            </span>
            <span className="px-space-xs py-0.5 rounded bg-primary/10 text-primary font-body-sm font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Conectado
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
            Cuidado Inteligente de tu Huerto
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            AgroBot se encarga de regar tus plantas automáticamente.
          </p>
        </div>

        <div className="flex items-center gap-space-md p-space-xs bg-surface-container-low rounded-xl">
          <div className="flex items-center gap-space-sm pl-space-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${isAutonomous ? 'bg-primary animate-ping' : 'bg-tertiary animate-pulse'}`} />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {isAutonomous ? 'Modo Automático' : 'Modo Manual'}
              </span>
              <span className={`font-label-caps text-label-caps leading-tight mt-1 ${isAutonomous ? 'text-primary' : 'text-tertiary'}`}>
                {isAutonomous ? 'Tu planta está protegida' : 'Control manual activo'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAutonomous(v => !v)}
            className="px-space-md py-space-sm bg-surface-container-high hover:bg-surface-bright rounded-lg font-body-sm transition-all flex items-center gap-space-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">touch_app</span>
            {isAutonomous ? 'Pasar a Manual' : 'Pasar a Automático'}
          </button>
        </div>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg">
        
        {/* 1. Humedad del suelo (Azul) */}
        <div 
          className="relative overflow-hidden rounded-xl shadow-md p-6 flex flex-col justify-between"
          style={getCardStyle('azul')}
        >
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-950 flex items-center justify-center text-sky-400 border border-white/5">
                <span className="material-symbols-outlined">water_drop</span>
              </div>
              <div>
                <span className="font-bold text-white text-lg block leading-tight">Agua en la Tierra</span>
                <span className="block text-sm text-sky-400">Humedad en raíces</span>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#0f172a] border border-sky-400/30 text-sky-400 text-sm flex items-center gap-1.5 font-medium">
              {estadoHumedad}
            </span>
          </div>

          <div className="relative z-10 flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-bold text-sky-400">{fmt(humedad, '%')}</span>
            <span className="text-sm text-sky-400 font-semibold">actual</span>
          </div>
          <p className="relative z-10 text-sm text-gray-400 mt-1">
            {motivo ? MOTIVO_LABEL[motivo] ?? motivo : 'Sin decisión registrada'}
          </p>

          <div className="relative z-10 w-full h-1.5 rounded-full bg-white/10 mt-4 overflow-hidden">
            <div className="h-full bg-sky-400 transition-all" style={{ width: `${pctHumedad}%` }} />
          </div>
        </div>

        {/* 2. Clima (Verde) - Diseño idéntico al de la imagen */}
        <div 
          className="relative overflow-hidden rounded-xl shadow-md p-6 flex flex-col justify-between"
          style={getCardStyle('verde')}
        >
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 border border-white/5">
                <span className="material-symbols-outlined">wb_sunny</span>
              </div>
              <div>
                <span className="font-bold text-white text-lg block leading-tight">Clima del Huerto</span>
                <span className="block text-sm text-emerald-400">Ambiente y frescura</span>
              </div>
            </div>
            
            <span className="px-3 py-1.5 rounded-full bg-[#0f172a] border border-emerald-400/30 text-emerald-400 text-sm flex items-center gap-1.5 font-medium">
              🌤️ Agradable
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-gray-400 text-sm">Temperatura</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl font-bold text-white">{fmt(data?.temperatura)}</span>
                <span className="text-lg text-gray-400">°C</span>
              </div>
              <p className="text-emerald-400 text-sm mt-1">Fresco y templado</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Humedad del Aire</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl font-bold text-emerald-400">{fmt(data?.humedad_ambiental)}</span>
                <span className="text-lg text-gray-400">%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 mt-3 overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: `${data?.humedad_ambiental ?? 0}%` }} />
              </div>
            </div>
          </div>

          <div className="relative z-10 bg-black/30 border border-white/5 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-400 text-[20px]">thumb_up</span>
              <p className="text-sm text-gray-300 leading-tight">
                Temperatura ideal para que crezca sana. El aire no está seco.
              </p>
            </div>
            <div className="flex justify-between mt-3 text-xs text-gray-400">
              <span>Mínima hoy: 18°C</span>
              <span>Máxima hoy: 29°C</span>
            </div>
          </div>
        </div>

        {/* 3. Riego (Morado/Púrpura) */}
        <div 
          className="relative overflow-hidden rounded-xl shadow-md p-6 flex flex-col justify-between md:col-span-2 xl:col-span-1"
          style={getCardStyle('azul')}
        >
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400 border border-white/5">
                <span className="material-symbols-outlined">water_drop</span>
              </div>
              <div>
                <span className="font-bold text-white text-lg block leading-tight">Riego Automático</span>
                <span className="block text-sm text-indigo-400">Bomba de agua</span>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#0f172a] border border-indigo-400/30 text-indigo-400 text-sm flex items-center gap-1.5 font-medium">
              <span className={`w-2 h-2 rounded-full ${riego ? 'bg-indigo-400 animate-pulse' : 'bg-gray-500'}`} />
              {riego ? 'Regando' : 'En reposo'}
            </span>
          </div>

          <button
            onClick={() => setPumpActive(v => !v)}
            className={`relative z-10 w-full py-3 px-4 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              pumpActive ? 'animate-pulse bg-indigo-500/40' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">water_drop</span>
            {pumpActive ? 'BOMBA ACTIVA…' : 'Dar un poco de agua (30 seg) 💧'}
          </button>

          <div className="relative z-10 mt-6 bg-black/30 border border-white/5 rounded-lg p-4 backdrop-blur-sm flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Lluvia esperada:</span>
              <span className="font-semibold text-white">{fmt(data?.lluvia_mm, ' mm')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Prob. lluvia:</span>
              <span className="font-semibold text-white">{fmt(data?.prob_lluvia_max, '%')}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-1">
              <span className="text-gray-400">Última lectura:</span>
              <span className="font-semibold text-white">
                {data?.fecha ? new Date(data.fecha).toLocaleTimeString() : '—'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}