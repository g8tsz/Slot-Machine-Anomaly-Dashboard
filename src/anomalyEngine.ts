/**
 * Real-time anomaly detection logic for:
 * - Bill validator stringing (rapid same-denom inserts)
 * - Hand-pay jackpot suppression (delayed or missing reports)
 * - TITO ticket switching (voucher in/out mismatches, duplicate redeems)
 * - Abnormal hold % (per-machine vs expected/variance)
 */

import type {
  AnomalyAlert,
  Severity,
  MachineMetrics,
  BillValidatorEvent,
  HandPayEvent,
  TITOEvent,
} from './types';

const ALERT_TTL_MS = 1000 * 60 * 30; // 30 min
const BILL_STRING_WINDOW_MS = 8000;   // 8s window for stringing
const BILL_STRING_MIN_COUNT = 5;      // 5+ same-denom in window = stringing
const HAND_PAY_MAX_DELAY_SEC = 120;   // 2 min max delay to report
const HOLD_Z_SCORE_THRESHOLD = 2.5;   // 2.5 std devs = abnormal

let alertIdCounter = 0;
function nextAlertId(): string {
  return `alert-${Date.now()}-${++alertIdCounter}`;
}

// --- Bill validator stringing ---
const bvEventsByMachine = new Map<string, BillValidatorEvent[]>();

function pruneBvEvents(machineId: string, now: number): void {
  const events = bvEventsByMachine.get(machineId) ?? [];
  const cutoff = now - BILL_STRING_WINDOW_MS;
  bvEventsByMachine.set(
    machineId,
    events.filter((e) => e.timestamp >= cutoff)
  );
}

export function checkBillValidatorStringing(
  event: BillValidatorEvent,
  machineLabel: string,
  zone?: string
): AnomalyAlert | null {
  const list = bvEventsByMachine.get(event.machineId) ?? [];
  list.push(event);
  bvEventsByMachine.set(event.machineId, list);
  pruneBvEvents(event.machineId, event.timestamp);

  const recent = bvEventsByMachine.get(event.machineId) ?? [];
  const sameDenom = recent.filter((e) => e.denomination === event.denomination);
  if (sameDenom.length >= BILL_STRING_MIN_COUNT) {
    return {
      id: nextAlertId(),
      type: 'bill_validator_stringing',
      severity: sameDenom.length >= 8 ? 'high' : 'medium',
      machineId: event.machineId,
      machineLabel,
      zone,
      message: `Possible bill validator stringing: ${sameDenom.length} x $${event.denomination} in ${BILL_STRING_WINDOW_MS / 1000}s`,
      detail: `Same denomination ($${event.denomination}) inserted in rapid succession.`,
      value: sameDenom.length,
      threshold: BILL_STRING_MIN_COUNT,
      timestamp: event.timestamp,
      acknowledged: false,
    };
  }
  return null;
}

// --- Hand-pay suppression ---
export function checkHandPaySuppression(
  event: HandPayEvent,
  machineLabel: string,
  zone?: string
): AnomalyAlert | null {
  const delay = event.delaySeconds ?? (event.reportedAt - event.occurredAt) / 1000;
  if (delay > HAND_PAY_MAX_DELAY_SEC) {
    return {
      id: nextAlertId(),
      type: 'hand_pay_suppression',
      severity: delay > 300 ? 'critical' : 'high',
      machineId: event.machineId,
      machineLabel,
      zone,
      message: `Hand-pay report delayed: $${event.amount.toLocaleString()} reported ${Math.round(delay)}s after jackpot`,
      detail: `Report delay exceeds ${HAND_PAY_MAX_DELAY_SEC}s threshold. Possible suppression or procedural failure.`,
      value: delay,
      expected: HAND_PAY_MAX_DELAY_SEC,
      timestamp: event.reportedAt,
      acknowledged: false,
    };
  }
  return null;
}

// --- TITO ticket switching ---
const voucherInByTicket = new Map<string, { machineId: string; amount: number; ts: number }>();
const voucherOutByMachine = new Map<string, { totalOut: number; lastTs: number }>();

export function checkTITOTicketSwitching(
  event: TITOEvent,
  machineLabel: string,
  zone?: string
): AnomalyAlert | null {
  if (event.type === 'voucher_out') {
    const prev = voucherOutByMachine.get(event.machineId);
    voucherOutByMachine.set(event.machineId, {
      totalOut: (prev?.totalOut ?? 0) + event.amount,
      lastTs: event.timestamp,
    });
    return null;
  }

  // voucher_in: check if this ticket was already redeemed or from different machine
  const existing = voucherInByTicket.get(event.ticketId);
  if (existing) {
    if (existing.machineId !== event.machineId) {
      return {
        id: nextAlertId(),
        type: 'tito_ticket_switching',
        severity: 'critical',
        machineId: event.machineId,
        machineLabel,
        zone,
        message: `TITO ticket ${event.ticketId} redeemed at different machine than issued`,
        detail: `Ticket issued at machine ${existing.machineId}, redeemed at ${event.machineId}. Possible ticket switching.`,
        value: event.amount,
        timestamp: event.timestamp,
        acknowledged: false,
      };
    }
    return {
      id: nextAlertId(),
      type: 'tito_ticket_switching',
      severity: 'high',
      machineId: event.machineId,
      machineLabel,
      zone,
      message: `Duplicate TITO redemption: ticket ${event.ticketId} ($${event.amount})`,
      detail: `Same ticket ID redeemed more than once.`,
      value: event.amount,
      timestamp: event.timestamp,
      acknowledged: false,
    };
  }
  voucherInByTicket.set(event.ticketId, {
    machineId: event.machineId,
    amount: event.amount,
    ts: event.timestamp,
  });
  return null;
}

// --- Abnormal hold % ---
export function checkAbnormalHold(
  metrics: MachineMetrics,
  globalHoldStdDev: number
): AnomalyAlert | null {
  const stdDev = metrics.holdStdDev ?? globalHoldStdDev;
  if (stdDev <= 0) return null;
  const z = (metrics.holdPercent - metrics.expectedHoldPercent) / stdDev;
  if (Math.abs(z) < HOLD_Z_SCORE_THRESHOLD) return null;

  const severity: Severity =
    Math.abs(z) >= 4 ? 'critical' : Math.abs(z) >= 3 ? 'high' : 'medium';
  const direction = z > 0 ? 'above' : 'below';

  return {
    id: nextAlertId(),
    type: 'abnormal_hold',
    severity,
    machineId: metrics.machineId,
    machineLabel: metrics.label,
    zone: metrics.zone,
    message: `Hold % ${direction} expected: ${metrics.holdPercent.toFixed(1)}% (expected ~${metrics.expectedHoldPercent.toFixed(1)}%, z=${z.toFixed(2)})`,
    detail: `Coin-in: $${metrics.coinIn.toLocaleString()}, Coin-out: $${metrics.coinOut.toLocaleString()}. Variance may indicate tampering or malfunction.`,
    value: metrics.holdPercent,
    expected: metrics.expectedHoldPercent,
    threshold: HOLD_Z_SCORE_THRESHOLD,
    timestamp: metrics.lastActivity,
    acknowledged: false,
  };
}

export function pruneStaleAlerts(alerts: AnomalyAlert[], now: number): AnomalyAlert[] {
  return alerts.filter((a) => now - a.timestamp < ALERT_TTL_MS);
}
