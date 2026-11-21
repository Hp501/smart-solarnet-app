export function BatteryGauge({ soc, soh, temperature }: { soc: number; soh: number; temperature?: number | null }) {
  const color = soc < 20 ? "bg-danger" : soc < 50 ? "bg-solar" : "bg-energy";

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <span className="text-3xl font-semibold">{soc}%</span>
        <span className="text-xs text-muted">SOH {soh}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${soc}%` }} />
      </div>
      {temperature != null && (
        <p className="mt-2 text-xs text-muted">Température : {temperature}°C</p>
      )}
    </div>
  );
}
