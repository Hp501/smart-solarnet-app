import { createClient } from "@/lib/supabase/server";
import { MarketplaceClient } from "@/components/marketplace/marketplace-client";

export default async function MarketplacePage() {
  const supabase = await createClient();
  const [{ data: products }, { data: services }] = await Promise.all([
    supabase.from("products").select("*").eq("is_active", true).order("category"),
    supabase.from("services").select("*").eq("is_active", true).order("category"),
  ]);
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Boutique Smart SolarNet</h1><p className="mt-1 text-sm text-muted">Équipements solaires, électriques et IoT, avec commande depuis le Cameroun.</p></div><MarketplaceClient products={(products ?? []) as any} services={(services ?? []) as any} /></div>;
}
