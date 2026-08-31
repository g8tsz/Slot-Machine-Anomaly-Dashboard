import { useEffect } from 'react';
import { useDashboard } from './useDashboard';
import { startMockStreams } from './mockStreams';
import { AlertsFeed } from './components/AlertsFeed';
import { MachineHoldTable } from './components/MachineHoldTable';
import { HoldChart } from './components/HoldChart';
import { AnomalySummaryCards } from './components/AnomalySummaryCards';

function App() {
  const { alerts, metrics, acknowledgeAlert } = useDashboard();

  useEffect(() => {
    const stop = startMockStreams();
    return stop;
  }, []);

  return (
    <div className="min-h-screen bg-floor-950 text-slate-200">
      <header className="border-b border-floor-700 bg-floor-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-floor-700 flex items-center justify-center">
              <span className="text-slot-gold font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">
                Slot Machine Anomaly Dashboard
              </h1>
              <p className="text-xs text-floor-400">
                Real-time detection: Bill validator stringing · Hand-pay suppression · TITO switching · Abnormal hold %
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-floor-500 text-xs">
            <span className="w-2 h-2 rounded-full bg-slot-green live-dot" />
            Live
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        <section>
          <h2 className="text-sm font-medium text-floor-400 mb-2">Anomalies by type</h2>
          <AnomalySummaryCards alerts={alerts} />
        </section>

        <div className="grid lg:grid-cols-3 gap-5">
          <section className="lg:col-span-2 rounded-xl border border-floor-600 bg-floor-900/50 overflow-hidden">
            <div className="px-4 py-2 border-b border-floor-600 bg-floor-800/50">
              <h2 className="text-sm font-medium text-floor-300">Hold % by machine</h2>
              <p className="text-xs text-floor-500">Actual vs expected; outliers flagged</p>
            </div>
            <div className="p-4">
              <HoldChart metrics={metrics} />
            </div>
          </section>

          <section className="rounded-xl border border-floor-600 bg-floor-900/50 overflow-hidden flex flex-col min-h-[320px]">
            <AlertsFeed alerts={alerts} onAck={acknowledgeAlert} />
          </section>
        </div>

        <section className="rounded-xl border border-floor-600 bg-floor-900/50 overflow-hidden">
          <div className="px-4 py-2 border-b border-floor-600 bg-floor-800/50">
            <h2 className="text-sm font-medium text-floor-300">Machine metrics</h2>
            <p className="text-xs text-floor-500">Coin-in, coin-out, hold % per EGM</p>
          </div>
          <div className="p-4 overflow-x-auto">
            <MachineHoldTable metrics={metrics} />
          </div>
        </section>
      </main>

      <footer className="border-t border-floor-800 mt-8 py-3">
        <div className="max-w-7xl mx-auto px-4 text-center text-floor-500 text-xs">
          Slot Machine Anomaly Dashboard · Simulated real-time feeds · Replace with SAS/back-office integration
        </div>
      </footer>
    </div>
  );
}

export default App;
