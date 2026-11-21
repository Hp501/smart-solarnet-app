import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleSelect } from "@/components/admin/role-select";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, role, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Gestion des utilisateurs</h1>
        <p className="text-sm text-muted">{users?.length ?? 0} utilisateur(s) inscrits</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tous les utilisateurs</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="pb-2">Nom</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Inscrit le</th>
                <th className="pb-2">Statut</th>
                <th className="pb-2">Rôle</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="py-3">{u.full_name ?? "—"}</td>
                  <td className="py-3 text-muted">{u.email}</td>
                  <td className="py-3 text-muted">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        u.is_active ? "bg-energy/15 text-energy" : "bg-white/10 text-muted"
                      }`}
                    >
                      {u.is_active ? "Actif" : "Suspendu"}
                    </span>
                  </td>
                  <td className="py-3">
                    <RoleSelect userId={u.id} currentRole={u.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
