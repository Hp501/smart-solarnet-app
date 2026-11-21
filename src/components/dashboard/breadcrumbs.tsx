"use client";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";
const names: Record<string, string> = { dashboard: "Tableau de bord", monitoring: "Monitoring", loads: "Charges", alerts: "Alertes", messages: "Messagerie", marketplace: "Boutique", orders: "Commandes", reports: "Rapports", locations: "Géolocalisation", settings: "Paramètres", admin: "Administration", users: "Utilisateurs", statistics: "Statistiques", logs: "Journal" };
export function Breadcrumbs() { const path = usePathname(); const parts = path.split("/").filter(Boolean); return <nav className="hidden items-center gap-1 text-xs text-muted lg:flex"><Link href="/dashboard" className="rounded p-1 hover:text-primary"><Home size={14} /></Link>{parts.slice(1).map((part, index) => <span className="flex items-center gap-1" key={`${part}-${index}`}><ChevronRight size={13} /><span className="capitalize">{names[part] ?? "Détail"}</span></span>)}</nav>; }
