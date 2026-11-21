import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SitesMap } from "@/components/dashboard/sites-map";

export default async function LocationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: sites }, { data: unresolvedAlerts }] = await Promise.all([
    supabase.from("sites").select("*").order("city"),
    supabase.from("alerts").select("site_id, title").eq("is_resolved", false),
  ]);
  const faultSiteIds = [...new Set((unresolvedAlerts ?? []).map((alert) => alert.site_id))];
  const alertsBySite = new Map((unresolvedAlerts ?? []).map((alert) => [alert.site_id, alert]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Geolocalisation des interventions</h1>
        <p className="mt-1 text-sm text-muted">Les marqueurs rouges signalent les sites ayant une panne ou une alerte non resolue.</p>
      </div>
      <SitesMap sites={sites ?? []} faultSiteIds={faultSiteIds} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sites?.map((site) => {
          const alert = alertsBySite.get(site.id);
          const directionsUrl = site.latitude != null && site.longitude != null
            ? `https://www.google.com/maps/dir/?api=1&destination=${site.latitude},${site.longitude}`
            : null;
          return (
            <div key={site.id} className={`rounded-2xl border bg-surface p-4 ${alert ? "border-danger/60" : "border-border"}`}>
              <p className="font-medium">{site.name}</p>
              <p className="mt-1 text-sm text-muted">{site.city} - {site.address || "Adresse non renseignee"}</p>
              {alert && <p className="mt-2 text-sm text-danger">Intervention requise : {alert.title}</p>}
              <p className="mt-3 text-xs text-solar">{site.latitude != null ? `${site.latitude.toFixed(5)}, ${site.longitude?.toFixed(5)}` : "Position a completer"}</p>
              {directionsUrl && <a href={directionsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-primary hover:underline">Itineraire vers le site -&gt;</a>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
