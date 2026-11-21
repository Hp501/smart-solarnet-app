import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Garde-fou côté Server Component pour toute la section /dashboard/admin/*.
 * Le middleware (src/lib/supabase/middleware.ts) fait déjà cette
 * vérification en amont — cette deuxième couche évite tout rendu de page
 * admin si jamais le middleware était contourné ou modifié par erreur.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    redirect("/dashboard?error=acces_refuse");
  }

  return <>{children}</>;
}
