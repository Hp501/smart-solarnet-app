import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { NewConversation } from "@/components/messages/new-conversation";

export default async function MessagesPage() {
  const supabase = await createClient();

  // RLS filtre automatiquement : un client ne voit que ses conversations,
  // un agent support/admin voit tout (voir migration 0009, policy conversations_access).
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, subject, last_message_at, is_closed, client:users!conversations_client_id_fkey(full_name, email)")
    .order("last_message_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Messagerie</h1>
        <p className="text-sm text-muted">{conversations?.length ?? 0} conversation(s)</p>
      </div>

      <NewConversation />

      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {conversations?.map((c: any) => (
            <Link
              key={c.id}
              href={`/dashboard/messages/${c.id}`}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm hover:bg-white/5"
            >
              <div>
                <p className="font-medium">{c.client?.full_name ?? c.client?.email ?? "Client"}</p>
                <p className="text-xs text-muted">{c.subject ?? "Sans sujet"}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted">{new Date(c.last_message_at).toLocaleString("fr-FR")}</span>
                {c.is_closed && <p className="text-xs text-muted">Fermée</p>}
              </div>
            </Link>
          ))}
          {(!conversations || conversations.length === 0) && (
            <p className="text-sm text-muted">Aucune conversation pour l&apos;instant.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
