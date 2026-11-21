"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function resolveAlert(alertId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase
    .from("alerts")
    .update({ is_resolved: true, resolved_by: user.id, resolved_at: new Date().toISOString() })
    .eq("id", alertId);

  if (error) return { error: "Impossible de résoudre cette alerte." };

  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard");
  return { success: true };
}
