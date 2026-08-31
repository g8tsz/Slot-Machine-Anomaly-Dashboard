# Slot Machine Anomaly Dashboard

Real-time detection dashboard for slot machine (EGM) anomalies in a casino environment. Built for ops and surveillance to flag:

- **Bill validator stringing** — Rapid same-denomination bill inserts in a short window (possible stringing/tricking the validator)
- **Hand-pay jackpot suppression** — Delayed or missing reporting of attendant-paid jackpots
- **TITO ticket switching** — Ticket-in/ticket-out anomalies: duplicate redemptions, ticket used at different machine than issued
- **Abnormal hold %** — Per-machine hold percentage deviating significantly from expected (z-score threshold)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Tech

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** for layout and theme
- **Recharts** for hold % bar chart
- Simulated event streams (timers) — replace with WebSocket/SSE from your SAS, slot management, or back-office APIs

## Integration

Replace `src/mockStreams.ts` with real feeds:

1. **Bill validator events** — From EGM/SAS: machine ID, denomination, timestamp.
2. **Hand-pay events** — From slot accounting: machine, amount, `occurredAt`, `reportedAt` (or delay).
3. **TITO events** — Voucher in/out with ticket ID and machine ID to detect cross-machine or duplicate redemption.
4. **Machine metrics** — Coin-in, coin-out, games played (and expected hold if available) for hold % and variance checks.

Detection logic lives in `src/anomalyEngine.ts`; adjust thresholds (e.g. `BILL_STRING_WINDOW_MS`, `HAND_PAY_MAX_DELAY_SEC`, `HOLD_Z_SCORE_THRESHOLD`) to match your floor and compliance rules.
