"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateUserRole } from "@/app/dashboard/admin/users/actions";
import type { UserRole } from "@/types/database.types";

const ROLES: UserRole[] = ["client", "pme", "installateur", "technicien", "support", "admin", "super_admin"];

export function RoleSelect({ userId, currentRole }: { userId: string; currentRole: UserRole }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as UserRole;
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.error) toast.error(result.error);
      else toast.success("Rôle mis à jour");
    });
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs capitalize text-white disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
