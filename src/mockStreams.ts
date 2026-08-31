/**
 * Simulated real-time data streams for slot machine events.
 * In production these would be WebSocket/SSE feeds from EGM/SAS/back-office.
 */

import type {
  AnomalyAlert,
  MachineMetrics,
  BillValidatorEvent,
  HandPayEvent,
  TITOEvent,
} from './types';
import {
  checkBillValidatorStringing,
  checkHandPaySuppression,
  checkTITOTicketSwitching,
  checkAbnormalHold,
  pruneStaleAlerts,
} from './anomalyEngine';

const MACHINES = [
  { id: 'EGM-2041', label: '2041', zone: 'High Limit', bank: 'A' },
  { id: 'EGM-2042', label: '2042', zone: 'High Limit', bank: 'A' },
  { id: 'EGM-1088', label: '1088', zone: 'Main Floor', bank: 'B' },
  { id: 'EGM-1089', label: '1089', zone: 'Main Floor', bank: 'B' },
  { id: 'EGM-3101', label: '3101', zone: 'Smoking', bank: 'C' },
  { id: 'EGM-3102', label: '3102', zone: 'Smoking', bank: 'C' },
  { id: 'EGM-4105', label: '4105', zone: 'VIP', bank: 'D' },
  { id: 'EGM-4106', label: '4106', zone: 'VIP', bank: 'D' },
];

const DENOMS = [1, 5, 10, 20, 50, 100];
const EXPECTED_HOLD = 8.5;
const GLOBAL_HOLD_STD = 4.2;

let metricsCache: MachineMetrics[] = [];
let alerts: AnomalyAlert[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function randomMachine() {
  return MACHINES[Math.floor(Math.random() * MACHINES.length)];
}

function buildMetrics(): MachineMetrics[] {
  const now = Date.now();
  return MACHINES.map((m) => {
    const coinIn = 50000 + Math.random() * 150000;
    const variance = (Math.random() - 0.5) * 20;
    const holdPercent = EXPECTED_HOLD + variance;
    const coinOut = coinIn * (1 - holdPercent / 100);
    return {
      machineId: m.id,
      label: m.label,
      zone: m.zone,
      bank: m.bank,
      coinIn,
      coinOut,
      holdPercent,
      expectedHoldPercent: EXPECTED_HOLD,
      holdStdDev: 3 + Math.random() * 2,
      gamesPlayed: Math.floor(1000 + Math.random() * 5000),
      lastActivity: now - Math.random() * 60000,
    };
  });
}

function maybeBillValidatorEvent(): void {
  if (Math.random() > 0.35) return;
  const m = randomMachine();
  const event: BillValidatorEvent = {
    machineId: m.id,
    denomination: DENOMS[Math.floor(Math.random() * DENOMS.length)],
    accepted: true,
    timestamp: Date.now(),
    sequenceId: `bv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  const alert = checkBillValidatorStringing(event, m.label, m.zone);
  if (alert) {
    alerts = [alert, ...alerts].slice(0, 200);
    notify();
  }
}

function maybeHandPayEvent(): void {
  if (Math.random() > 0.85) return;
  const m = randomMachine();
  const amount = [500, 1200, 2500, 5000, 10000][Math.floor(Math.random() * 5)];
  const occurredAt = Date.now() - 1000 * (60 + Math.random() * 180);
  const delaySec = Math.random() > 0.7 ? 90 + Math.random() * 200 : 20 + Math.random() * 60;
  const event: HandPayEvent = {
    machineId: m.id,
    amount,
    reportedAt: Date.now(),
    occurredAt,
    delaySeconds: delaySec,
  };
  const alert = checkHandPaySuppression(event, m.label, m.zone);
  if (alert) {
    alerts = [alert, ...alerts].slice(0, 200);
    notify();
  }
}

function maybeTITOEvent(): void {
  if (Math.random() > 0.5) return;
  const m = randomMachine();
  const type: 'voucher_in' | 'voucher_out' = Math.random() > 0.5 ? 'voucher_in' : 'voucher_out';
  const amount = Math.round((50 + Math.random() * 450) / 5) * 5;
  const ticketId = `T${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const event: TITOEvent = {
    machineId: m.id,
    type,
    amount,
    ticketId,
    timestamp: Date.now(),
  };
  const alert = checkTITOTicketSwitching(event, m.label, m.zone);
  if (alert) {
    alerts = [alert, ...alerts].slice(0, 200);
    notify();
  }
}

function refreshMetrics(): void {
  metricsCache = buildMetrics();
  const anomalous = metricsCache.filter(
    (mm) => Math.abs(mm.holdPercent - mm.expectedHoldPercent) > 10
  );
  if (anomalous.length > 0 && Math.random() > 0.6) {
    const m = anomalous[Math.floor(Math.random() * anomalous.length)];
    const alert = checkAbnormalHold(m, GLOBAL_HOLD_STD);
    if (alert) {
      alerts = [alert, ...alerts].slice(0, 200);
      notify();
    }
  }
  notify();
}

export function getMetrics(): MachineMetrics[] {
  return metricsCache;
}

export function getAlerts(): AnomalyAlert[] {
  const now = Date.now();
  alerts = pruneStaleAlerts(alerts, now);
  return alerts;
}

export function acknowledgeAlert(id: string): void {
  const a = alerts.find((x) => x.id === id);
  if (a) a.acknowledged = true;
  notify();
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function seedInitialAlerts(): void {
  const m = MACHINES[0];
  const now = Date.now();
  alerts = [
    {
      id: 'seed-1',
      type: 'abnormal_hold',
      severity: 'high',
      machineId: m.id,
      machineLabel: m.label,
      zone: m.zone,
      message: `Hold % above expected: 18.2% (expected ~${EXPECTED_HOLD}%, z=2.8)`,
      detail: 'Coin-in/out variance may indicate tampering or malfunction.',
      value: 18.2,
      expected: EXPECTED_HOLD,
      threshold: 2.5,
      timestamp: now - 120000,
      acknowledged: false,
    },
    {
      id: 'seed-2',
      type: 'hand_pay_suppression',
      severity: 'medium',
      machineId: MACHINES[2].id,
      machineLabel: MACHINES[2].label,
      zone: MACHINES[2].zone,
      message: 'Hand-pay report delayed: $1,200 reported 95s after jackpot',
      detail: `Report delay exceeds 120s threshold.`,
      value: 95,
      expected: 120,
      timestamp: now - 60000,
      acknowledged: false,
    },
  ];
}

export function startMockStreams(): () => void {
  if (metricsCache.length === 0) {
    metricsCache = buildMetrics();
    seedInitialAlerts();
    notify();
  }
  const t1 = setInterval(maybeBillValidatorEvent, 4000);
  const t2 = setInterval(maybeHandPayEvent, 8000);
  const t3 = setInterval(maybeTITOEvent, 5000);
  const t4 = setInterval(refreshMetrics, 10000);
  return () => {
    clearInterval(t1);
    clearInterval(t2);
    clearInterval(t3);
    clearInterval(t4);
  };
}
