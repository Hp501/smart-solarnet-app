import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface WeatherRow {
  temperature_c: number | null;
  humidity_pct: number | null;
  cloud_cover_pct: number | null;
  wind_speed_ms: number | null;
  irradiance_wm2: number | null;
  recorded_at: string;
}

export function WeatherCard({ weather }: { weather: WeatherRow | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Météo locale</CardTitle>
      </CardHeader>
      {weather ? (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted">Température</p>
            <p className="font-medium">{weather.temperature_c ?? "—"}°C</p>
          </div>
          <div>
            <p className="text-muted">Humidité</p>
            <p className="font-medium">{weather.humidity_pct ?? "—"}%</p>
          </div>
          <div>
            <p className="text-muted">Couverture nuageuse</p>
            <p className="font-medium">{weather.cloud_cover_pct ?? "—"}%</p>
          </div>
          <div>
            <p className="text-muted">Vent</p>
            <p className="font-medium">{weather.wind_speed_ms ?? "—"} m/s</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted">Irradiance solaire</p>
            <p className="font-medium">{weather.irradiance_wm2 ?? "—"} W/m²</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Aucune donnée météo pour l&apos;instant.</p>
      )}
    </Card>
  );
}
