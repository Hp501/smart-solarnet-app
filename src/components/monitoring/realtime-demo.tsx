"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Radio } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionChart, type ProductionPoint } from "@/components/charts/production-chart";
import { BatteryGauge } from "@/components/charts/battery-gauge";
import { WeatherCard } from "@/components/monitoring/weather-card";
import { LiveTelemetryTable } from "@/components/monitoring/live-telemetry-table";

type TelemetryRow = { id: number; metric: string; value: number; unit: string; recorded_at: string };
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

function makeHistory(): ProductionPoint[] {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, index) => {
    const phase = (index / 23) * Math.PI;
    return {
      time: new Date(now - (23 - index) * 2_000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      solaire: round(Math.max(80, 2800 * Math.sin(phase) + 180 + Math.sin(index * 1.7) * 180), 0),
    };
  });
}

export function RealtimeDemo() {
  const [running, setRunning] = useState(true);
  const [history, setHistory] = useState<ProductionPoint[]>(makeHistory);
  const [soc, setSoc] = useState(78);
  const socRef = useRef(78);
  const [temperature, setTemperature] = useState(30.2);
  const [weather, setWeather] = useState({ temperature_c: 29.4, humidity_pct: 67, cloud_cover_pct: 24, wind_speed_ms: 3.2, irradiance_wm2: 785, recorded_at: new Date().toISOString() });
  const [rows, setRows] = useState<TelemetryRow[]>([]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      setHistory((previous) => {
        const previousPower = previous.at(-1)?.solaire ?? 2100;
        const power = Math.max(250, Math.min(3200, previousPower + (Math.random() - 0.46) * 440));
        const voltage = 228 + Math.random() * 7;
        const current = power / voltage;
        const now = new Date();
        const recordedAt = now.toISOString();
        const nextSoc = Math.max(25, Math.min(98, socRef.current + (power > 1500 ? 0.08 : -0.11)));
        const nextTemperature = 29 + Math.random() * 3.5;
        socRef.current = round(nextSoc);
        setSoc(socRef.current);
        setTemperature(round(nextTemperature));
        setWeather({ temperature_c: round(28 + Math.random() * 3), humidity_pct: round(63 + Math.random() * 10, 0), cloud_cover_pct: round(Math.max(5, Math.min(75, 26 + (Math.random() - 0.5) * 24)), 0), wind_speed_ms: round(2 + Math.random() * 3), irradiance_wm2: round(Math.max(350, Math.min(980, power / 3.4))), recorded_at: recordedAt });
        setRows((oldRows) => [
          { id: Date.now() + 1, metric: "puissance", value: round(power, 0), unit: "W", recorded_at: recordedAt },
          { id: Date.now() + 2, metric: "tension", value: round(voltage), unit: "V", recorded_at: recordedAt },
          { id: Date.now() + 3, metric: "courant", value: round(current), unit: "A", recorded_at: recordedAt },
          { id: Date.now() + 4, metric: "soc", value: round(nextSoc), unit: "%", recorded_at: recordedAt },
          { id: Date.now() + 5, metric: "temperature", value: round(nextTemperature), unit: "°C", recorded_at: recordedAt },
          ...oldRows,
        ].slice(0, 50));
        return [...previous.slice(-23), { time: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), solaire: round(power, 0) }];
      });
    };
    tick();
    const interval = window.setInterval(tick, 2_000);
    return () => window.clearInterval(interval);
  }, [running]);

  const currentPower = useMemo(() => history.at(-1)?.solaire ?? 0, [history]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-energy"><Radio className="h-4 w-4" /> MODE DEMONSTRATION</div>
          <h1 className="text-xl font-semibold">Monitoring temps reel</h1>
          <p className="text-sm text-muted">Donnees simulees localement pour la presentation, actualisees toutes les 2 secondes.</p>
        </div>
        <button onClick={() => setRunning((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-white hover:bg-white/5">
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Mettre en pause" : "Reprendre la simulation"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-muted">Puissance instantanee</p><p className="mt-1 text-3xl font-semibold text-solar">{currentPower.toLocaleString("fr-FR")} <span className="text-base">W</span></p></Card>
        <Card><p className="text-sm text-muted">Etat du systeme</p><p className="mt-1 text-xl font-semibold text-energy">{running ? "Production stable" : "Simulation en pause"}</p></Card>
        <Card><p className="text-sm text-muted">Derniere mise a jour</p><p className="mt-1 text-xl font-semibold">{new Date(weather.recorded_at).toLocaleTimeString("fr-FR")}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Puissance solaire simulee</CardTitle></CardHeader><ProductionChart data={history} /></Card>
        <Card><CardHeader><CardTitle>Batterie</CardTitle></CardHeader><BatteryGauge soc={soc} soh={96} temperature={temperature} /></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Flux de telemetrie</CardTitle></CardHeader><LiveTelemetryTable siteIds={[]} initialRows={[]} rows={rows} demoMode /></Card>
        <WeatherCard weather={weather} />
      </div>
    </div>
  );
}
