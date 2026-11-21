"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/role-context";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  is_bot: boolean;
  created_at: string;
}

export function ChatWindow({ conversationId, initialMessages }: { conversationId: string; initialMessages: Message[] }) {
  const currentUser = useCurrentUser();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Abonnement Supabase Realtime : tout nouveau message inséré dans cette
  // conversation (par n'importe quel participant) apparaît instantanément,
  // sans rechargement de page.
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || isSending) return;

    setIsSending(true);
    const supabase = createClient();

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: draft.trim(),
    });

    setIsSending(false);
    if (!error) setDraft("");
  }

  return (
    <div className="flex h-[600px] flex-col rounded-2xl border border-border bg-surface">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMine ? "bg-primary text-white" : "bg-white/5 text-white"
                }`}
              >
                <p>{msg.content}</p>
                <p className="mt-1 text-[10px] opacity-60">
                  {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">Aucun message pour l&apos;instant — écris le premier !</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Écris un message…"
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
