import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import type { DeviceStatus, SiteRow } from "@/types/database.types";

interface DeviceInfo {
  id: string;
  name: string;
  status: DeviceStatus;
  rssi: number | null;
  firmware_version: string | null;
  last_seen_at: string | null;
  site_id: string;
}

export function TechnicianDashboard({
  sites,
  devices,
}: {
  sites: SiteRow[];
  devices: DeviceInfo[];
}) {
  const onlineCount = devices.filter((d) => d.status === "en_ligne").length;
  const offlineCount = devices.filter((d) => d.status !== "en_ligne").length;
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mes sites assignés</h1>
        <p className="text-sm text-muted">{sites.length} site(s) sous ta responsabilité</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Devices en ligne" value={onlineCount} accent="energy" />
        <MetricCard label="Devices hors ligne" value={offlineCount} accent={offlineCount > 0 ? "danger" : "primary"} />
        <MetricCard label="Sites assignés" value={sites.length} accent="primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostics devices (ESP32)</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{device.name}</p>
                <p className="text-xs text-muted">
                  {siteName(device.site_id)} • RSSI {device.rssi ?? "—"} dBm • firmware{" "}
                  {device.firmware_version ?? "—"}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  device.status === "en_ligne" ? "bg-energy/15 text-energy" : "bg-danger/15 text-danger"
                }`}
              >
                {device.status === "en_ligne" ? "En ligne" : "Hors ligne"}
              </span>
            </div>
          ))}
          {devices.length === 0 && (
            <p className="text-sm text-muted">Aucun device sur tes sites assignés pour l&apos;instant.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
