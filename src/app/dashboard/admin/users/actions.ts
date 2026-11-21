"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database.types";

const ASSIGNABLE_ROLES: UserRole[] = [
  "client",
  "pme",
  "installateur",
  "technicien",
  "support",
  "admin",
  "super_admin",
];

/**
 * Change le rôle d'un utilisateur. Protégé par la policy RLS
 * `users_admin_full_access` (seul un admin/super_admin peut modifier la
 * ligne d'un autre utilisateur) — cette action ne fait qu'exposer ce
 * pouvoir déjà garanti côté base à l'interface.
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  if (!ASSIGNABLE_ROLES.includes(newRole)) {
    return { error: "Rôle invalide." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié." };

  if (user.id === userId) {
    return { error: "Tu ne peux pas modifier ton propre rôle depuis cette interface." };
  }

  const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId);

  if (error) {
    return { error: "Modification refusée (droits insuffisants ou erreur serveur)." };
  }

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId);

  if (error) return { error: "Modification refusée." };

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}
