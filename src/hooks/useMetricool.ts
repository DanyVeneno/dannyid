import { useEffect } from "react";

declare global {
  interface Window { beTracker?: { t: (o: { hash: string }) => void } }
}

/**
 * Rastreador de Metricool, OPT-IN: solo se carga si defines VITE_METRICOOL_HASH.
 * El hash se valida (32 hex) antes de usarse y el script se carga una sola vez, sin eval ni inline.
 */
export function useMetricool(hash?: string) {
  useEffect(() => {
    if (!hash || !/^[a-f0-9]{32}$/i.test(hash)) return;
    const s = document.createElement("script");
    s.src = "https://tracker.metricool.com/resources/be.js";
    s.async = true;
    s.onload = () => window.beTracker?.t({ hash });
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, [hash]);
}
