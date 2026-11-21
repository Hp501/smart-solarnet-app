"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/role-context";

export function NewConversation() {
  const user = useCurrentUser(); const router = useRouter(); const [subject, setSubject] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); if (!subject.trim() || !message.trim()) return; setSaving(true); setError(""); const supabase = createClient(); const { data, error: conversationError } = await supabase.from("conversations").insert({ client_id: user.id, subject: subject.trim() }).select("id").single(); if (conversationError || !data) { setError("Impossible d’ouvrir la conversation."); setSaving(false); return; } const { error: messageError } = await supabase.from("messages").insert({ conversation_id: data.id, sender_id: user.id, content: message.trim() }); if (messageError) { setError("Conversation créée, mais le premier message n’a pas été envoyé."); setSaving(false); return; } router.push(`/dashboard/messages/${data.id}`); router.refresh(); }
  return <form onSubmit={submit} className="rounded-2xl border border-primary/30 bg-primary/5 p-4"><p className="font-medium">Nouveau message au support</p><div className="mt-3 grid gap-2 sm:grid-cols-[180px_1fr_auto]"><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Objet" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" /><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Décrivez votre besoin ou votre panne…" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" /><button disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "Envoi…" : "Envoyer"}</button></div>{error && <p className="mt-2 text-xs text-danger">{error}</p>}</form>;
}
