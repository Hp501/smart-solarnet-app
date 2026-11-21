import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCard } from "@/components/alerts/alert-card";

export default async function AlertsPage() {
  const supabase = await createClient();
  const { data: sites } = await supabase.from("sites").select("id");
  const siteIds = sites?.map((s) => s.id) ?? [];

  const emptyGuard = siteIds.length ? siteIds : ["00000000-0000-0000-0000-000000000000"];

  const [{ data: unresolved }, { data: resolved }] = await Promise.all([
    supabase.from("alerts").select("*").in("site_id", emptyGuard).eq("is_resolved", false).order("created_at", { ascending: false }),
    supabase.from("alerts").select("*").in("site_id", emptyGuard).eq("is_resolved", true).order("created_at", { ascending: false }).limit(20),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Alertes</h1>
        <p className="text-sm text-muted">{unresolved?.length ?? 0} alerte(s) non résolue(s)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>À traiter</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {unresolved?.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
          {(!unresolved || unresolved.length === 0) && (
            <p className="text-sm text-muted">Aucune alerte en attente 🎉</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique (20 dernières résolues)</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {resolved?.map((alert) => (
            <div key={alert.id} className="rounded-xl border border-border px-4 py-3 text-sm opacity-60">
              <p className="font-medium">{alert.title}</p>
              <p className="text-xs text-muted">{new Date(alert.created_at).toLocaleString("fr-FR")}</p>
            </div>
          ))}
          {(!resolved || resolved.length === 0) && (
            <p className="text-sm text-muted">Aucun historique pour l&apos;instant.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
