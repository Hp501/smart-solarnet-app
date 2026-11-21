"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface TelemetryRow {
  id: number;
  metric: string;
  value: number;
  unit: string;
  recorded_at: string;
}

const METRIC_LABELS: Record<string, string> = {
  tension: "Tension",
  courant: "Courant",
  puissance: "Puissance",
  energie: "Énergie",
  soc: "SOC batterie",
  temperature: "Température",
  humidite: "Humidité",
  frequence: "Fréquence",
  vitesse_vent: "Vitesse du vent",
};

/**
 * Table de télémétrie qui se met à jour toute seule : abonnement
 * Supabase Realtime sur `public.telemetry` (activé en migration 0013),
 * filtré sur les sites de l'utilisateur. Chaque nouvelle mesure envoyée
 * par l'ESP32 (via MQTT-bridge ou REST) apparaît en haut du tableau sans
 * rechargement de page.
 */
export function LiveTelemetryTable({
  siteIds,
  initialRows,
  rows: controlledRows,
  demoMode = false,
}: {
  siteIds: string[];
  initialRows: TelemetryRow[];
  rows?: TelemetryRow[];
  demoMode?: boolean;
}) {
  const [rows, setRows] = useState<TelemetryRow[]>(initialRows);
  const [isLive, setIsLive] = useState(false);
  const displayedRows = controlledRows ?? rows;

  useEffect(() => {
    if (demoMode || controlledRows || siteIds.length === 0) return;
    const supabase = createClient();

    const channel = supabase
      .channel("telemetry-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "telemetry" },
        (payload) => {
          const row = payload.new as TelemetryRow & { site_id: string };
          if (!siteIds.includes(row.site_id)) return;
          setRows((prev) => [row, ...prev].slice(0, 50));
        }
      )
      .subscribe((status) => setIsLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteIds, demoMode, controlledRows]);

  function exportCsv() {
    const header = "metric,value,unit,recorded_at\n";
    const body = displayedRows.map((r) => `${r.metric},${r.value},${r.unit},${r.recorded_at}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telemetrie_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className={`h-2 w-2 rounded-full ${(demoMode || isLive) ? "bg-energy animate-pulse" : "bg-white/20"}`} />
          {demoMode ? "Simulation temps réel active" : isLive ? "Connecté en temps réel" : "Connexion en cours…"}
        </div>
        <button
          onClick={exportCsv}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"
        >
          Exporter CSV
        </button>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="text-muted">
              <th className="pb-2">Métrique</th>
              <th className="pb-2">Valeur</th>
              <th className="pb-2">Horodatage</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="py-2">{METRIC_LABELS[row.metric] ?? row.metric}</td>
                <td className="py-2">
                  {row.value} {row.unit}
                </td>
                <td className="py-2 text-muted">{new Date(row.recorded_at).toLocaleString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayedRows.length === 0 && <p className="mt-3 text-sm text-muted">Aucune donnée de télémétrie reçue pour l&apos;instant.</p>}
      </div>
    </div>
  );
}
