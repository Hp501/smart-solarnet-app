import { createClient } from "@/lib/supabase/server";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";

export default async function ReportsPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: sites }] = await Promise.all([supabase.from("users").select("role").eq("id", user!.id).single(), supabase.from("sites").select("id, name")]);
  const siteIds = (sites ?? []).map((site) => site.id);
  const { data: metrics } = await supabase.from("site_daily_metrics").select("site_id, metric_date, solar_production_kwh, wind_production_kwh, battery_discharge_kwh, consumption_kwh, grid_import_kwh, grid_export_kwh, self_consumption_kwh, availability_pct, co2_avoided_kg, savings_fcfa").in("site_id", siteIds.length ? siteIds : ["00000000-0000-0000-0000-000000000000"]).order("metric_date", { ascending: true });
  return <ReportsDashboard metrics={(metrics ?? []) as any} sites={sites ?? []} role={profile?.role ?? "client"} />;
}
