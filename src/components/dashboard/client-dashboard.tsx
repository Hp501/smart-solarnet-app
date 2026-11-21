import { AlertBanner } from "@/components/ui/alert-banner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProductionChart, type ProductionPoint } from "@/components/charts/production-chart";
import { ConsumptionChart, type ConsumptionPoint } from "@/components/charts/consumption-chart";
import { BatteryGauge } from "@/components/charts/battery-gauge";
import type { AlertRow, BatteryRow, LoadRow, SiteRow } from "@/types/database.types";

export function ClientDashboard({
  sites,
  battery,
  alerts,
  loads,
  productionData,
  consumptionData,
  totalCapacityKw,
}: {
  sites: SiteRow[];
  battery: BatteryRow | null;
  alerts: AlertRow[];
  loads: LoadRow[];
  productionData: ProductionPoint[];
  consumptionData: ConsumptionPoint[];
  totalCapacityKw: number;
}) {
  const activeLoads = loads.filter((l) => l.is_on).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mon microgrid</h1>
        <p className="text-sm text-muted">
          {sites[0]?.name} • {sites[0]?.city}
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertBanner
              key={alert.id}
              severity={alert.severity}
              title={alert.title}
              message={alert.message ?? "Aucun détail supplémentaire."}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Puissance installée" value={totalCapacityKw.toFixed(1)} unit="kW" accent="solar" />
        <MetricCard label="Charges actives" value={`${activeLoads}/${loads.length}`} accent="primary" />
        <MetricCard label="Alertes en cours" value={alerts.length} accent={alerts.length > 0 ? "danger" : "primary"} />
        <MetricCard label="Sites" value={sites.length} accent="energy" href="/dashboard/locations" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Production solaire (aujourd&apos;hui)</CardTitle>
          </CardHeader>
          {productionData.length > 0 ? (
            <ProductionChart data={productionData} />
          ) : (
            <p className="py-10 text-center text-sm text-muted">Aucune donnée de production pour l&apos;instant.</p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batterie</CardTitle>
          </CardHeader>
          {battery ? (
            <BatteryGauge soc={battery.soc ?? 0} soh={battery.soh ?? 0} temperature={battery.temperature_c} />
          ) : (
            <p className="text-sm text-muted">Aucune batterie configurée.</p>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consommation (7 derniers jours)</CardTitle>
        </CardHeader>
        {consumptionData.length > 0 ? (
          <ConsumptionChart data={consumptionData} />
        ) : (
          <p className="py-10 text-center text-sm text-muted">Aucune donnée de consommation pour l&apos;instant.</p>
        )}
      </Card>
    </div>
  );
}
