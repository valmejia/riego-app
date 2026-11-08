// client/src/hooks/usePolling.js — consulta periódica que se pausa con la pestaña oculta
import { useCallback, useEffect, useRef, useState } from 'react';

export function usePolling(fetcher, intervalMs, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const seq = useRef(0);

  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    try {
      const d = await fetcherRef.current();
      if (mine === seq.current) { setData(d); setError(null); }
    } catch (e) {
      // Se conserva el último dato bueno; solo se marca el error.
      if (mine === seq.current) setError(e.message || 'Error');
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const s = seq;
    setLoading(true);
    refresh();
    const id = setInterval(() => { if (!document.hidden) refresh(); }, intervalMs);
    const onVis = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); s.current++; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, refresh, ...deps]);

  return { data, error, loading, refresh };
}
