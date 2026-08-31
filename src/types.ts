/** Slot Machine Anomaly Dashboard – shared types */

export type AnomalyType =
  | 'bill_validator_stringing'
  | 'hand_pay_suppression'
  | 'tito_ticket_switching'
  | 'abnormal_hold';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface AnomalyAlert {
  id: string;
  type: AnomalyType;
  severity: Severity;
  machineId: string;
  machineLabel: string;
  zone?: string;
  message: string;
  detail?: string;
  value?: number;
  expected?: number;
  threshold?: number;
  timestamp: number;
  acknowledged: boolean;
}

export interface MachineMetrics {
  machineId: string;
  label: string;
  zone: string;
  bank: string;
  /** Coin-in (total wagered) */
  coinIn: number;
  /** Coin-out (total paid) */
  coinOut: number;
  /** Hold % = (coinIn - coinOut) / coinIn * 100 */
  holdPercent: number;
  /** Expected hold % for this game */
  expectedHoldPercent: number;
  /** Standard deviation of hold used for anomaly */
  holdStdDev?: number;
  gamesPlayed: number;
  lastActivity: number;
}

export interface BillValidatorEvent {
  machineId: string;
  denomination: number;
  accepted: boolean;
  timestamp: number;
  sequenceId?: string;
}

export interface HandPayEvent {
  machineId: string;
  amount: number;
  reportedAt: number;
  occurredAt: number;
  delaySeconds?: number;
}

export interface TITOEvent {
  machineId: string;
  type: 'voucher_in' | 'voucher_out';
  amount: number;
  ticketId: string;
  timestamp: number;
}
