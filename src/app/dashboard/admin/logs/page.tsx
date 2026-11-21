import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const ACTION_LABELS: Record<string, string> = {
  signup: "Inscription",
  login: "Connexion",
  logout: "Déconnexion",
  delete_account: "Suppression de compte",
  update_load: "Modification de charge",
  create_user: "Création d'utilisateur",
  delete_site: "Suppression de site",
};

export default async function AdminLogsPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("logs")
    .select("id, action, entity_type, entity_id, created_at, user:users(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Journal d&apos;audit</h1>
        <p className="text-sm text-muted">Les 100 derniers événements enregistrés sur la plateforme.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Événements récents</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="pb-2">Action</th>
                <th className="pb-2">Utilisateur</th>
                <th className="pb-2">Entité</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((log: any) => (
                <tr key={log.id} className="border-t border-border">
                  <td className="py-2">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td className="py-2 text-muted">{log.user?.full_name ?? log.user?.email ?? "Système"}</td>
                  <td className="py-2 text-muted">{log.entity_type ?? "—"}</td>
                  <td className="py-2 text-muted">{new Date(log.created_at).toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!logs || logs.length === 0) && <p className="mt-3 text-sm text-muted">Aucun événement enregistré.</p>}
        </div>
      </Card>
    </div>
  );
}
