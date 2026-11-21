"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Bascule l'état ON/OFF d'une charge. Passe par le client Supabase serveur
 * authentifié (pas le client admin) : les policies RLS de `loads` et
 * `relay_states` s'appliquent normalement, donc seul le propriétaire du
 * site, un technicien assigné ou un admin peut réellement changer l'état.
 */
export async function toggleLoad(loadId: string, newState: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié." };
  }

  const { data: load, error: fetchError } = await supabase
    .from("loads")
    .select("id, is_on, site_id")
    .eq("id", loadId)
    .single();

  if (fetchError || !load) {
    return { error: "Charge introuvable ou accès refusé." };
  }

  const { error: updateError } = await supabase.from("loads").update({ is_on: newState }).eq("id", loadId);

  if (updateError) {
    return { error: "Impossible de modifier cette charge (accès refusé par les politiques de sécurité)." };
  }

  await supabase.from("relay_states").insert({
    load_id: loadId,
    previous_state: load.is_on,
    new_state: newState,
    triggered_by: "user",
    triggered_by_user_id: user.id,
    reason: "Basculement manuel depuis le dashboard",
  });

  revalidatePath("/dashboard/loads");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Crée une nouvelle charge sur un site. Réservé (via RLS policy
 * `loads_write`) au propriétaire du site, à un technicien assigné, ou à
 * un admin.
 */
export async function createLoad(input: {
  site_id: string;
  name: string;
  priority: "critique" | "important" | "normal" | "secondaire";
  rated_power_w: number | null;
  relay_channel: number | null;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase.from("loads").insert({
    site_id: input.site_id,
    name: input.name,
    priority: input.priority,
    rated_power_w: input.rated_power_w,
    relay_channel: input.relay_channel,
    is_on: false,
    is_auto: true,
  });

  if (error) {
    return { error: "Impossible de créer cette charge (accès refusé ou données invalides)." };
  }

  revalidatePath("/dashboard/loads");
  return { success: true };
}
