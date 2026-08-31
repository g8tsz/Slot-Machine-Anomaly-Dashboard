import type { AnomalyAlert, AnomalyType } from '../types';

const TYPE_LABELS: Record<AnomalyType, string> = {
  bill_validator_stringing: 'Bill validator stringing',
  hand_pay_suppression: 'Hand-pay suppression',
  tito_ticket_switching: 'TITO ticket switching',
  abnormal_hold: 'Abnormal hold %',
};

interface AnomalySummaryCardsProps {
  alerts: AnomalyAlert[];
}

export function AnomalySummaryCards({ alerts }: AnomalySummaryCardsProps) {
  const byType = alerts.reduce<Record<AnomalyType, number>>(
    (acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    },
    {
      bill_validator_stringing: 0,
      hand_pay_suppression: 0,
      tito_ticket_switching: 0,
      abnormal_hold: 0,
    }
  );

  const cards: { type: AnomalyType; count: number }[] = [
    { type: 'bill_validator_stringing', count: byType.bill_validator_stringing },
    { type: 'hand_pay_suppression', count: byType.hand_pay_suppression },
    { type: 'tito_ticket_switching', count: byType.tito_ticket_switching },
    { type: 'abnormal_hold', count: byType.abnormal_hold },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map(({ type, count }) => (
        <div
          key={type}
          className="rounded-lg border border-floor-600 bg-floor-800/50 p-3 hover:border-floor-500 transition-colors"
        >
          <p className="text-2xl font-mono font-semibold text-slot-gold">{count}</p>
          <p className="text-xs text-floor-400 mt-0.5">{TYPE_LABELS[type]}</p>
        </div>
      ))}
    </div>
  );
}
