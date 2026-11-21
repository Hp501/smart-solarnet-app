import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, phone, email, language, role")
    .eq("id", user!.id)
    .single();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Paramètres</h1>
        <p className="text-sm text-muted">Profil et préférences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <ProfileForm
          defaultFullName={profile?.full_name ?? ""}
          defaultPhone={profile?.phone ?? ""}
          email={profile?.email ?? ""}
          defaultLanguage={profile?.language ?? "fr"}
        />
      </Card>
    </div>
  );
}
