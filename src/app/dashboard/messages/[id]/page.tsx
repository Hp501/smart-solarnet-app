import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatWindow } from "@/components/messages/chat-window";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, subject, client:users!conversations_client_id_fkey(full_name, email)")
    .eq("id", id)
    .single();

  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  const client = conversation.client as any;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{client?.full_name ?? client?.email ?? "Conversation"}</h1>
        <p className="text-sm text-muted">{conversation.subject ?? "Sans sujet"}</p>
      </div>

      <ChatWindow conversationId={id} initialMessages={messages ?? []} />
    </div>
  );
}
