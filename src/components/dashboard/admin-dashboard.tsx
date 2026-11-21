import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SitesMap } from "@/components/dashboard/sites-map";
import type { SiteRow } from "@/types/database.types";

export function AdminDashboard({
  sites,
  totalUsers,
  totalProductionKw,
  unresolvedAlertsCount,
  recentUsers,
}: {
  sites: SiteRow[];
  totalUsers: number;
  totalProductionKw: number;
  unresolvedAlertsCount: number;
  recentUsers: { id: string; full_name: string | null; email: string; role: string }[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Vue d&apos;ensemble plateforme</h1>
        <p className="text-sm text-muted">Toutes les installations Smart SolarNet au Cameroun</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Sites actifs" value={sites.length} accent="primary" href="/dashboard/locations" />
        <MetricCard label="Utilisateurs" value={totalUsers} accent="energy" />
        <MetricCard label="Puissance installée totale" value={totalProductionKw.toFixed(1)} unit="kW" accent="solar" />
        <MetricCard
          label="Alertes non résolues"
          value={unresolvedAlertsCount}
          accent={unresolvedAlertsCount > 0 ? "danger" : "primary"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carte des installations</CardTitle>
        </CardHeader>
        <SitesMap sites={sites} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Derniers utilisateurs inscrits</CardTitle>
          <Link href="/dashboard/admin/users" className="text-xs text-primary hover:underline">
            Voir tout →
          </Link>
        </CardHeader>
        <div className="space-y-2">
          {recentUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{u.full_name ?? "—"}</p>
                <p className="text-xs text-muted">{u.email}</p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs capitalize text-muted">
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
