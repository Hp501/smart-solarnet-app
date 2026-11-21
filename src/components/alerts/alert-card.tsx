"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { resolveAlert } from "@/app/dashboard/alerts/actions";
import { Button } from "@/components/ui/button";
import type { AlertRow } from "@/types/database.types";

const SEVERITY_STYLES: Record<string, string> = {
  info: "border-primary/30 bg-primary/5",
  avertissement: "border-solar/30 bg-solar/5",
  critique: "border-danger/30 bg-danger/5",
  urgence: "border-danger/50 bg-danger/10",
};

export function AlertCard({ alert }: { alert: AlertRow }) {
  const [isPending, startTransition] = useTransition();

  function handleResolve() {
    startTransition(async () => {
      const result = await resolveAlert(alert.id);
      if (result.error) toast.error(result.error);
      else toast.success("Alerte résolue");
    });
  }

  return (
    <div className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 ${SEVERITY_STYLES[alert.severity]}`}>
      <div>
        <p className="text-sm font-medium">{alert.title}</p>
        <p className="text-sm text-white/70">{alert.message ?? "Aucun détail supplémentaire."}</p>
        <p className="mt-1 text-xs text-muted">
          {alert.created_at ? new Date(alert.created_at).toLocaleString("fr-FR") : "Date inconnue"}
        </p>
      </div>
      <Button variant="secondary" onClick={handleResolve} isLoading={isPending} className="shrink-0">
        Résoudre
      </Button>
    </div>
  );
}
