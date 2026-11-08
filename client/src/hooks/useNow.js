import { useEffect, useState } from 'react';
// Re-renderiza cada `ms` para que los textos "hace X min" se mantengan al día.
export function useNow(ms = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(id); }, [ms]);
  return now;
}
