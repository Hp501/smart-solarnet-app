"use client";

import { createContext, useContext } from "react";
import type { UserRole } from "@/types/database.types";

/**
 * Contexte du rôle utilisateur — évite de re-fetcher `public.users` dans
 * chaque composant client. La valeur est injectée une seule fois par
 * `RoleProvider`, lui-même alimenté par un Server Component (le rôle vient
 * donc toujours de la base, jamais du localStorage ni d'un cookie modifiable).
 */

export interface CurrentUser {
  id: string;
  fullName: string | null;
  role: UserRole;
  email: string;
}

const RoleContext = createContext<CurrentUser | null>(null);

export function RoleProvider({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return <RoleContext.Provider value={user}>{children}</RoleContext.Provider>;
}

export function useCurrentUser(): CurrentUser {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useCurrentUser() doit être utilisé sous <RoleProvider>.");
  }
  return ctx;
}

/** Helpers de rôle — pratiques pour les rendus conditionnels dans le JSX. */
export function isAdminRole(role: UserRole) {
  return role === "admin" || role === "super_admin";
}
export function isSupportRole(role: UserRole) {
  return role === "support" || isAdminRole(role);
}
export function isTechnicianRole(role: UserRole) {
  return role === "technicien" || isAdminRole(role);
}
