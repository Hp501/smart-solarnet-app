import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";

export default async function AdminStatisticsPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalSites },
    { count: totalDevices },
    { count: onlineDevices },
    { count: unresolvedAlerts },
    { count: openTickets },
    { data: sites },
    { data: usersByRole },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("sites").select("*", { count: "exact", head: true }),
    supabase.from("devices").select("*", { count: "exact", head: true }),
    supabase.from("devices").select("*", { count: "exact", head: true }).eq("status", "en_ligne"),
    supabase.from("alerts").select("*", { count: "exact", head: true }).eq("is_resolved", false),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "ouvert"),
    supabase.from("sites").select("installed_capacity_kw, city"),
    supabase.from("users").select("role"),
  ]);

  const totalCapacityKw = (sites ?? []).reduce((sum, s) => sum + (s.installed_capacity_kw ?? 0), 0);

  const roleCounts = (usersByRole ?? []).reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  const cityCounts = (sites ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.city] = (acc[s.city] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Statistiques globales</h1>
        <p className="text-sm text-muted">Vue d&apos;ensemble de la plateforme Smart SolarNet</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Utilisateurs" value={totalUsers ?? 0} accent="primary" />
        <MetricCard label="Sites" value={totalSites ?? 0} accent="energy" />
        <MetricCard label="Puissance installée totale" value={totalCapacityKw.toFixed(1)} unit="kW" accent="solar" />
        <MetricCard
          label="Devices en ligne"
          value={`${onlineDevices ?? 0}/${totalDevices ?? 0}`}
          accent={onlineDevices === totalDevices ? "energy" : "danger"}
        />
        <MetricCard label="Alertes non résolues" value={unresolvedAlerts ?? 0} accent={unresolvedAlerts ? "danger" : "primary"} />
        <MetricCard label="Tickets support ouverts" value={openTickets ?? 0} accent="solar" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des utilisateurs par rôle</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {Object.entries(roleCounts).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between text-sm">
                <span className="capitalize text-white/80">{role}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sites par ville</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {Object.entries(cityCounts).map(([city, count]) => (
              <div key={city} className="flex items-center justify-between text-sm">
                <span className="text-white/80">{city}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(cityCounts).length === 0 && <p className="text-sm text-muted">Aucun site pour l&apos;instant.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
