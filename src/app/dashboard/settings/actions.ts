"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const language = String(formData.get("language") ?? "fr");

  if (fullName.length < 2) return { error: "Le nom complet est trop court." };

  const { error } = await supabase
    .from("users")
    .update({ full_name: fullName, phone: phone || null, language })
    .eq("id", user.id);

  if (error) return { error: "Erreur lors de la mise à jour du profil." };

  revalidatePath("/dashboard/settings");
  return { success: true };
}
