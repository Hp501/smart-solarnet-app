import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const labels: Record<string, string> = { en_attente: "En attente", confirmee: "Confirmée", en_preparation: "En préparation", expediee: "Expédiée", livree: "Livrée", annulee: "Annulée" };
export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  const isTeam = ["admin", "super_admin", "support", "technicien"].includes(profile?.role ?? "client");
  const { data: orders } = await supabase.from("marketplace_orders").select("id, order_number, total_fcfa, status, shipping_address, notes, created_at, client:users!marketplace_orders_user_id_fkey(full_name, email), order_items(quantity, unit_price_fcfa, product:products(name), service:services(name))").order("created_at", { ascending: false });
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">{isTeam ? "Commandes clients" : "Mes commandes"}</h1><p className="mt-1 text-sm text-muted">{isTeam ? "Suivez les demandes, le paiement et la livraison." : "Retrouvez l’état de vos achats Smart SolarNet."}</p></div><div className="space-y-3">{orders?.map((order: any) => <article key={order.id} className="rounded-2xl border border-border bg-surface p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{order.order_number}</p>{isTeam && <p className="mt-1 text-sm text-muted">{order.client?.full_name ?? order.client?.email ?? "Client"}</p>}<p className="mt-2 text-sm text-muted">{order.order_items?.map((item: any) => `${item.quantity}× ${item.product?.name ?? item.service?.name ?? "Article"}`).join(" · ")}</p></div><div className="text-right"><span className="rounded-full bg-solar/15 px-3 py-1 text-xs font-medium text-solar">{labels[order.status] ?? order.status}</span><p className="mt-3 font-semibold text-primary">{Number(order.total_fcfa).toLocaleString("fr-FR")} FCFA</p></div></div>{isTeam && <div className="mt-4 border-t border-border pt-3 text-xs text-muted"><p>Livraison : {order.shipping_address || "À confirmer"}</p><p className="mt-1">{order.notes || "Aucune note de paiement"}</p></div>}</article>)}{(!orders || orders.length === 0) && <p className="rounded-2xl border border-border p-6 text-sm text-muted">Aucune commande pour l’instant.</p>}</div></div>;
}
