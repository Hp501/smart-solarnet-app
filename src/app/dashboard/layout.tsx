import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { RoleProvider } from "@/lib/role-context";
import { PageTransition } from "@/components/dashboard/page-transition";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Le profil existe garanti dès l'inscription (trigger handle_new_user).
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const currentUser = {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    role: profile?.role ?? "client",
  };

  return (
    <RoleProvider user={currentUser}>
      <div className="flex min-h-screen bg-background">
        <Sidebar role={currentUser.role} />
        <div className="flex-1">
          <Topbar fullName={currentUser.fullName} role={currentUser.role} />
          <main className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8"><PageTransition>{children}</PageTransition></main>
        </div>
      </div>
    </RoleProvider>
  );
}
