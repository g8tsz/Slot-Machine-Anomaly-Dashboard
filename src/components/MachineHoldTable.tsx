import type { MachineMetrics } from '../types';

function holdColor(actual: number, expected: number): string {
  const diff = actual - expected;
  if (Math.abs(diff) <= 3) return 'text-slot-green';
  if (Math.abs(diff) <= 8) return 'text-slot-amber';
  return 'text-slot-red';
}

interface MachineHoldTableProps {
  metrics: MachineMetrics[];
}

export function MachineHoldTable({ metrics }: MachineHoldTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-floor-600 text-floor-400">
            <th className="pb-2 pr-4 font-medium">Machine</th>
            <th className="pb-2 pr-4 font-medium">Zone</th>
            <th className="pb-2 pr-4 font-medium text-right">Coin-in</th>
            <th className="pb-2 pr-4 font-medium text-right">Coin-out</th>
            <th className="pb-2 pr-4 font-medium text-right">Hold %</th>
            <th className="pb-2 font-medium text-right">Expected</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-floor-700">
          {metrics.map((m) => (
            <tr key={m.machineId} className="hover:bg-floor-800/50">
              <td className="py-2 pr-4 font-mono text-slot-gold">{m.label}</td>
              <td className="py-2 pr-4 text-floor-400">{m.zone}</td>
              <td className="py-2 pr-4 text-right font-mono">
                ${m.coinIn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="py-2 pr-4 text-right font-mono">
                ${m.coinOut.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className={`py-2 pr-4 text-right font-mono font-medium ${holdColor(m.holdPercent, m.expectedHoldPercent)}`}>
                {m.holdPercent.toFixed(1)}%
              </td>
              <td className="py-2 text-right font-mono text-floor-500">
                {m.expectedHoldPercent.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
