import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AlertBanner } from "@/components/ui/alert-banner";
import type { AlertRow } from "@/types/database.types";

interface ConversationPreview {
  id: string;
  subject: string | null;
  client_name: string | null;
  last_message_at: string;
  is_closed: boolean;
}

export function SupportDashboard({
  conversations,
  unresolvedAlerts,
  openTicketsCount,
}: {
  conversations: ConversationPreview[];
  unresolvedAlerts: AlertRow[];
  openTicketsCount: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Espace support</h1>
        <p className="text-sm text-muted">Conversations clients et alertes à traiter</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Conversations ouvertes" value={conversations.filter((c) => !c.is_closed).length} accent="primary" />
        <MetricCard label="Tickets ouverts" value={openTicketsCount} accent="solar" />
        <MetricCard
          label="Alertes non résolues"
          value={unresolvedAlerts.length}
          accent={unresolvedAlerts.length > 0 ? "danger" : "primary"}
        />
      </div>

      {unresolvedAlerts.length > 0 && (
        <div className="space-y-2">
          {unresolvedAlerts.slice(0, 5).map((alert) => (
            <AlertBanner
              key={alert.id}
              severity={alert.severity}
              title={alert.title}
              message={alert.message ?? "Aucun détail supplémentaire."}
            />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conversations récentes</CardTitle>
          <Link href="/dashboard/messages" className="text-xs text-primary hover:underline">
            Voir tout →
          </Link>
        </CardHeader>
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/messages/${c.id}`}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm hover:bg-white/5"
            >
              <div>
                <p className="font-medium">{c.client_name ?? "Client"}</p>
                <p className="text-xs text-muted">{c.subject ?? "Sans sujet"}</p>
              </div>
              <span className="text-xs text-muted">{new Date(c.last_message_at).toLocaleString("fr-FR")}</span>
            </Link>
          ))}
          {conversations.length === 0 && (
            <p className="text-sm text-muted">Aucune conversation pour l&apos;instant.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
