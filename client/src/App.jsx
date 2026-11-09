// client/src/App.jsx — Hydra Cloud
import { useCallback, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import SoilCard from './components/SoilCard';
import AmbientCard from './components/AmbientCard';
import PumpCard from './components/PumpCard';
import ControlCard from './components/ControlCard';
import ForecastCard from './components/ForecastCard';
import HistoryChart from './components/HistoryChart';
import ActivityLog from './components/ActivityLog';
import AdviceCard from './components/AdviceCard';
import GreenBot from './components/GreenBot';
import SettingsDrawer from './components/SettingsDrawer';
import Toast from './components/Toast';
import StatusBadge from './components/StatusBadge';
import { api, DEVICE_ID } from './lib/api';
import { usePolling } from './hooks/usePolling';
import { useNow } from './hooks/useNow';
import { haceCuanto, fechaHora } from './lib/format';

// Si la última lectura es más vieja que esto, el Arduino se considera desconectado.
const STALE_MS = (Number(import.meta.env.VITE_STALE_MIN) || 3) * 60 * 1000;

export default function App() {
  const now = useNow(3000);
  const [horas, setHoras] = useState(24);
  const [ajustes, setAjustes] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const tel = usePolling(api.ultima, 5000);
  const cmd = usePolling(() => api.comandos(15), 5000);
  const disp = usePolling(api.dispositivo, 4000); // incluye el estado real de la bomba
  const hist = usePolling(() => api.historial(horas), 60000, [horas]);
  const health = usePolling(api.health, 30000);

  const data = tel.data?.humedad != null ? tel.data : null;
  const fechaLectura = data?.timestamp || data?.fecha;
  const offline = !!data && now - new Date(fechaLectura).getTime() > STALE_MS;

  const conexion = useMemo(() => {
    if (tel.error && !health.data?.ok) return { tone: 'error', label: 'Servidor sin conexión' };
    if (!data) return { tone: 'neutral', label: tel.loading ? 'Conectando…' : 'Sin lecturas' };
    if (offline) return { tone: 'warn', label: `Sin señal · ${haceCuanto(fechaLectura, now)}` };
    return { tone: 'primary', label: 'UNO R4 · en línea' };
  }, [tel.error, tel.loading, health.data, data, offline, fechaLectura, now]);

  const pendiente = cmd.data?.find(c => c.estado === 'pendiente') || null;
  const ultimoRiego = cmd.data?.find(c => c.accion === 'regar' && c.estado === 'ejecutado');
  // Estado real del relé: lo informa el Arduino cada 3-10 s en /pendiente.
  // Si lleva más de 30 s sin contacto no se puede afirmar que siga regando.
  const contacto = disp.data?.ultimo_contacto ? new Date(disp.data.ultimo_contacto).getTime() : 0;
  const bombaReal = contacto && now - contacto < 30000 ? !!disp.data.bomba : false;
  // ¿El Arduino está recogiendo órdenes? (consulta /pendiente cada 10 s)
  const recibeOrdenes = !!contacto && now - contacto < 45000;

  const extremos = useMemo(() => {
    const puntos = hist.data?.puntos || [];
    if (!puntos.length) return null;
    const desde = new Date(puntos[puntos.length - 1].t).getTime() - 24 * 3600 * 1000;
    const t = puntos.filter(p => new Date(p.t).getTime() >= desde)
      .map(p => p.temperatura).filter(v => typeof v === 'number');
    return t.length ? { min: Math.min(...t), max: Math.max(...t) } : null;
  }, [hist.data]);

  const avisar = useCallback((msg, error = false) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, error });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  async function accion(fn, okMsg, refrescar) {
    setEnviando(true);
    try {
      const r = await fn();
      const informativo = ['Ya hay un riego en cola', 'Riego en cola cancelado', 'La bomba ya está apagada'];
      avisar(informativo.includes(r?.mensaje) ? r.mensaje : okMsg);
      refrescar?.forEach(p => p.refresh());
    } catch (e) {
      avisar(e.message, true);
      if (e.status === 401 || e.status === 403) setAjustes(true);
    } finally {
      setEnviando(false);
    }
  }

  const d = disp.data;
  const contexto = useMemo(() => ({
    device_id: DEVICE_ID, planta: d?.nombre_planta, modo: d?.modo, umbral_riego: d?.umbral_riego,
    humedad_suelo: data?.humedad ?? null, temperatura: data?.temperatura ?? null,
    humedad_aire: data?.humedad_ambiental ?? null, bomba_encendida: bombaReal,
    motivo: data?.motivo ?? null, lluvia_mm: data?.lluvia_mm ?? null, prob_lluvia: data?.prob_lluvia_max ?? null,
    ultima_lectura: fechaLectura || null, arduino_en_linea: !!data && !offline,
  }), [d, data, fechaLectura, offline, bombaReal]);

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased min-h-screen flex flex-col">
      <a href="#panel" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:bg-primary focus:text-on-primary focus:px-3 focus:py-2 focus:rounded-lg">Saltar al panel</a>
      <Header conexion={conexion} planta={d?.nombre_planta} onSettings={() => setAjustes(true)} />

      <main id="panel" className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-gutter-lg pt-28 lg:pt-28 pb-space-xl flex flex-col gap-space-lg scroll-mt-28">
        {/* Encabezado */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div>
            <div className="flex flex-wrap items-center gap-space-sm mb-1">
              <span className="font-label-caps text-label-caps text-primary uppercase">Estado en vivo · {d?.nombre_planta || 'Maceta principal'}</span>
              <StatusBadge tone={d?.modo === 'manual' ? 'tertiary' : 'primary'} icon={d?.modo === 'manual' ? 'touch_app' : 'smart_toy'}>
                {d?.modo === 'manual' ? 'Modo manual' : 'Modo automático'}
              </StatusBadge>
            </div>
            <h1 className="m-0 text-headline-lg font-bold text-on-surface">Cuidado inteligente de tu huerto</h1>
            <p className="m-0 mt-1 text-body-lg text-on-surface-variant">
              {fechaLectura ? `Última lectura ${fechaHora(fechaLectura)} (${haceCuanto(fechaLectura, now)})` : 'Esperando datos del Arduino…'}
            </p>
          </div>
        </div>

        {(tel.error || offline) && (
          <div role="alert" className={`flex items-start gap-3 p-space-md rounded-xl border ${tel.error ? 'bg-error/10 border-error/30 text-error' : 'bg-warn/10 border-warn/30 text-warn'}`}>
            <span className="material-symbols-outlined" aria-hidden="true">{tel.error ? 'cloud_off' : 'wifi_off'}</span>
            <p className="m-0 text-body-md">
              {tel.error
                ? `No se pudo actualizar: ${tel.error}. Se muestran los últimos datos conocidos.`
                : `El Arduino no envía lecturas desde ${fechaHora(fechaLectura)}. Los valores pueden estar desactualizados.`}
            </p>
          </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg transition-opacity ${offline ? 'opacity-70' : ''}`}>
          <SoilCard data={data} umbral={d?.umbral_riego ?? 30} />
          <AmbientCard data={data} extremos={extremos} />
          <PumpCard regando={bombaReal} restante={disp.data?.bomba_restante} pendiente={pendiente}
            recibeOrdenes={recibeOrdenes} ultimoContacto={disp.data?.ultimo_contacto}
            ultimoRiego={disp.data?.ultimo_riego || ultimoRiego?.ejecutadoEn || ultimoRiego?.timestamp}
            enviando={enviando} offline={offline}
            onRegar={dur => accion(() => api.regar(dur), `Orden de riego enviada (${dur} s)`, [cmd])}
            onDetener={() => accion(api.detener, 'Orden de detener enviada', [cmd, disp])} />
          <ControlCard key={d?.umbral_riego ?? 'x'} disp={d} enviando={enviando}
            onGuardar={c => accion(() => api.guardarDispositivo(c), c.modo ? `Modo ${c.modo === 'auto' ? 'automático' : 'manual'} activado` : 'Umbral guardado', [disp])} />
          <ForecastCard data={data} />
          <AdviceCard data={data} disp={d} offline={offline} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-lg">
          <div className="xl:col-span-2 min-w-0">
            <HistoryChart horas={horas} setHoras={setHoras} historial={hist.data} loading={hist.loading} error={hist.error} umbral={d?.umbral_riego ?? 30} />
          </div>
          <ActivityLog comandos={cmd.data} error={cmd.error} />
        </div>
      </main>

      <Footer />
      <GreenBot context={contexto} />
      {ajustes && <SettingsDrawer disp={d} health={health.data}
        onClose={msg => { setAjustes(false); if (typeof msg === 'string') avisar(msg); }}
        onGuardarPlanta={nombre => accion(() => api.guardarDispositivo({ nombre_planta: nombre }), 'Nombre guardado', [disp])} />}
      <Toast toast={toast} />
    </div>
  );
}
