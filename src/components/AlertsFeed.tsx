import type { AnomalyAlert, AnomalyType, Severity } from '../types';

const TYPE_LABELS: Record<AnomalyType, string> = {
  bill_validator_stringing: 'Bill validator stringing',
  hand_pay_suppression: 'Hand-pay suppression',
  tito_ticket_switching: 'TITO ticket switching',
  abnormal_hold: 'Abnormal hold %',
};

const SEV_COLORS: Record<Severity, string> = {
  low: 'bg-slot-amber/20 text-slot-amber border-slot-amber/40',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  critical: 'bg-slot-red/20 text-red-400 border-slot-red/40',
};

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = Date.now();
  const diff = (now - ts) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return d.toLocaleTimeString();
}

interface AlertsFeedProps {
  alerts: AnomalyAlert[];
  onAck: (id: string) => void;
}

export function AlertsFeed({ alerts, onAck }: AlertsFeedProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-floor-600">
        <span className="w-2 h-2 rounded-full bg-slot-green live-dot" />
        <span className="text-sm font-medium text-floor-300">Live alerts</span>
        <span className="text-xs text-floor-500 ml-auto">{alerts.length} active</span>
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-floor-700">
        {alerts.length === 0 && (
          <li className="px-3 py-6 text-center text-floor-500 text-sm">No active anomalies</li>
        )}
        {alerts.map((a) => (
          <li
            key={a.id}
            className={`px-3 py-2.5 hover:bg-floor-800/80 transition-colors ${a.acknowledged ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start gap-2">
              <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-mono border ${SEV_COLORS[a.severity]}`}>
                {a.severity}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {TYPE_LABELS[a.type]} · {a.machineLabel}
                </p>
                <p className="text-xs text-floor-400 mt-0.5">{a.message}</p>
                {a.detail && (
                  <p className="text-xs text-floor-500 mt-1">{a.detail}</p>
                )}
                <p className="text-xs text-floor-600 mt-1">{formatTime(a.timestamp)}</p>
              </div>
              {!a.acknowledged && (
                <button
                  onClick={() => onAck(a.id)}
                  className="shrink-0 text-xs text-slot-gold hover:underline"
                >
                  Ack
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
