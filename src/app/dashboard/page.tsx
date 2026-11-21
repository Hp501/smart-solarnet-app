import { createClient } from "@/lib/supabase/server";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TechnicianDashboard } from "@/components/dashboard/technician-dashboard";
import { SupportDashboard } from "@/components/dashboard/support-dashboard";
import { Card } from "@/components/ui/card";
import type { ProductionPoint } from "@/components/charts/production-chart";
import type { ConsumptionPoint } from "@/components/charts/consumption-chart";

/**
 * Point d'entrée unique du dashboard. Le rôle détermine entièrement quelles
 * requêtes Supabase sont exécutées et quel composant est rendu — RLS filtre
 * de toute façon les données côté base, mais on évite ici de charger des
 * données inutiles au rôle courant.
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null; // le middleware a déjà redirigé, filet de sécurité

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  const role = profile?.role ?? "client";

  // ------------------------------------------------------------------
  // ADMIN / SUPER_ADMIN — vue globale de la plateforme
  // ------------------------------------------------------------------
  if (role === "admin" || role === "super_admin") {
    const [{ data: sites }, { count: totalUsers }, { data: unresolvedAlerts }, { data: recentUsers }] =
      await Promise.all([
        supabase.from("sites").select("*"),
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("alerts").select("id").eq("is_resolved", false),
        supabase
          .from("users")
          .select("id, full_name, email, role")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    const totalProductionKw = (sites ?? []).reduce((sum, s) => sum + (s.installed_capacity_kw ?? 0), 0);

    return (
      <AdminDashboard
        sites={sites ?? []}
        totalUsers={totalUsers ?? 0}
        totalProductionKw={totalProductionKw}
        unresolvedAlertsCount={unresolvedAlerts?.length ?? 0}
        recentUsers={recentUsers ?? []}
      />
    );
  }

  // ------------------------------------------------------------------
  // TECHNICIEN — sites assignés + diagnostics devices
  // ------------------------------------------------------------------
  if (role === "technicien") {
    const { data: assignments } = await supabase
      .from("site_technicians")
      .select("site_id")
      .eq("technician_id", user.id);

    const siteIds = (assignments ?? []).map((a) => a.site_id);

    const [{ data: sites }, { data: devices }] = await Promise.all([
      supabase.from("sites").select("*").in("id", siteIds.length ? siteIds : ["00000000-0000-0000-0000-000000000000"]),
      supabase
        .from("devices")
        .select("id, name, status, rssi, firmware_version, last_seen_at, site_id")
        .in("site_id", siteIds.length ? siteIds : ["00000000-0000-0000-0000-000000000000"]),
    ]);

    return <TechnicianDashboard sites={sites ?? []} devices={devices ?? []} />;
  }

  // ------------------------------------------------------------------
  // SUPPORT — conversations + alertes à traiter
  // ------------------------------------------------------------------
  if (role === "support") {
    const [{ data: conversations }, { data: unresolvedAlerts }, { count: openTickets }] = await Promise.all([
      supabase
        .from("conversations")
        .select("id, subject, last_message_at, is_closed, client:users!conversations_client_id_fkey(full_name)")
        .order("last_message_at", { ascending: false })
        .limit(10),
      supabase.from("alerts").select("*").eq("is_resolved", false).order("created_at", { ascending: false }).limit(10),
      supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "ouvert"),
    ]);

    const conversationPreviews = (conversations ?? []).map((c: any) => ({
      id: c.id,
      subject: c.subject,
      client_name: c.client?.full_name ?? null,
      last_message_at: c.last_message_at,
      is_closed: c.is_closed,
    }));

    return (
      <SupportDashboard
        conversations={conversationPreviews}
        unresolvedAlerts={unresolvedAlerts ?? []}
        openTicketsCount={openTickets ?? 0}
      />
    );
  }

  // ------------------------------------------------------------------
  // CLIENT / PME / INSTALLATEUR (par défaut) — vue de son propre microgrid
  // ------------------------------------------------------------------
  const { data: sites } = await supabase.from("sites").select("*");

  if (!sites || sites.length === 0) {
    return (
      <Card className="text-center">
        <p className="mb-2 text-lg font-medium">Aucun site configuré</p>
        <p className="text-sm text-muted">
          Ajoute ton premier microgrid pour commencer à voir tes données en temps réel.
        </p>
      </Card>
    );
  }

  const siteIds = sites.map((s) => s.id);
  const totalCapacityKw = sites.reduce((sum, s) => sum + (s.installed_capacity_kw ?? 0), 0);

  const [{ data: batteries }, { data: alerts }, { data: loads }, { data: telemetry }] = await Promise.all([
    supabase.from("batteries").select("*").in("site_id", siteIds).limit(1),
    supabase.from("alerts").select("*").in("site_id", siteIds).eq("is_resolved", false).order("created_at", { ascending: false }).limit(5),
    supabase.from("loads").select("*").in("site_id", siteIds),
    supabase
      .from("telemetry")
      .select("metric, value, recorded_at")
      .in("site_id", siteIds)
      .eq("metric", "puissance")
      .order("recorded_at", { ascending: true })
      .limit(48),
  ]);

  const productionData: ProductionPoint[] = (telemetry ?? []).map((t) => ({
    time: new Date(t.recorded_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    solaire: Number(t.value),
  }));

  // Placeholder simple pour la consommation hebdo — à remplacer par une
  // vraie agrégation SQL (vue matérialisée) une fois le volume de données réel.
  const consumptionData: ConsumptionPoint[] = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => ({
    day,
    consommation_kwh: 0,
  }));

  return (
    <ClientDashboard
      sites={sites}
      battery={batteries?.[0] ?? null}
      alerts={alerts ?? []}
      loads={loads ?? []}
      productionData={productionData}
      consumptionData={consumptionData}
      totalCapacityKw={totalCapacityKw}
    />
  );
}
