import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { MachineMetrics } from '../types';

interface HoldChartProps {
  metrics: MachineMetrics[];
}

export function HoldChart({ metrics }: HoldChartProps) {
  const data = useMemo(
    () =>
      metrics.map((m) => ({
        name: m.label,
        hold: m.holdPercent,
        expected: m.expectedHoldPercent,
        delta: m.holdPercent - m.expectedHoldPercent,
      })),
    [metrics]
  );

  const expectedVal = metrics[0]?.expectedHoldPercent ?? 8.5;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <ReferenceLine y={expectedVal} stroke="#e5a84a" strokeDasharray="4 4" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: '#1c2632',
              border: '1px solid #334155',
              borderRadius: '6px',
            }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Hold %']}
            labelFormatter={(label) => `Machine ${label}`}
          />
          <Bar
            dataKey="hold"
            fill="#d4a853"
            radius={[4, 4, 0, 0]}
            name="Hold %"
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-floor-500 mt-1">
        Gold bars = actual hold %. Dashed line = expected hold %.
      </p>
    </div>
  );
}
