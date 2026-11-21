import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadToggle } from "@/components/loads/load-toggle";
import { PriorityBadge } from "@/components/loads/priority-badge";
import { LoadForm } from "@/components/loads/load-form";

export default async function LoadsPage() {
  const supabase = await createClient();
  const { data: sites } = await supabase.from("sites").select("id, name");
  const siteIds = sites?.map((s) => s.id) ?? [];
  const primarySite = sites?.[0];

  const { data: loads } = await supabase
    .from("loads")
    .select("*")
    .in("site_id", siteIds.length ? siteIds : ["00000000-0000-0000-0000-000000000000"])
    .order("priority");

  const priorityOrder = ["critique", "important", "normal", "secondaire"];
  const sorted = [...(loads ?? [])].sort(
    (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Gestion des charges</h1>
        <p className="text-sm text-muted">
          Active, désactive et priorise tes équipements. Les charges critiques sont maintenues en priorité en cas de délestage automatique.
        </p>
      </div>

      {primarySite && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle charge — {primarySite.name}</CardTitle>
          </CardHeader>
          <LoadForm siteId={primarySite.id} />
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Charges configurées ({sorted.length})</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {sorted.map((load) => (
            <div
              key={load.id}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <LoadToggle loadId={load.id} initialState={load.is_on} />
                <div>
                  <p className="text-sm font-medium">{load.name}</p>
                  <p className="text-xs text-muted">
                    {load.rated_power_w ?? "—"} W
                    {load.relay_channel != null ? ` • canal ${load.relay_channel}` : ""}
                  </p>
                </div>
              </div>
              <PriorityBadge priority={load.priority} />
            </div>
          ))}
          {sorted.length === 0 && (
            <p className="text-sm text-muted">Aucune charge configurée pour l&apos;instant.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
