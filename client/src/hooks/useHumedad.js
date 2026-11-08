// client/src/hooks/useHumedad.js
import { useEffect, useState } from 'react';

export function useHumedad(deviceId = 'maceta1', intervalMs = 5000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/humedad/${deviceId}`);
        const json = await res.json();
        if (active && json?.humedad != null) setData(json);
        if (active) setError(null);
      } catch (err) {
        if (active) setError(err.message);
      }
    };

    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [deviceId, intervalMs]);

  return { data, error };
}