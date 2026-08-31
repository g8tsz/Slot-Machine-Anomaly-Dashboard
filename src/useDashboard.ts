import { useState, useEffect } from 'react';
import type { AnomalyAlert, MachineMetrics } from './types';
import { getAlerts, getMetrics, subscribe, acknowledgeAlert } from './mockStreams';

export function useDashboard() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(() => getAlerts());
  const [metrics, setMetrics] = useState<MachineMetrics[]>(() => getMetrics());

  useEffect(() => {
    const unsub = subscribe(() => {
      setAlerts([...getAlerts()]);
      setMetrics([...getMetrics()]);
    });
    return unsub;
  }, []);

  return {
    alerts,
    metrics,
    acknowledgeAlert,
  };
}
