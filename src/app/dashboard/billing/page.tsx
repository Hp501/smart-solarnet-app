import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_STYLES: Record<string, string> = {
  payee: "bg-energy/15 text-energy",
  en_attente: "bg-solar/15 text-solar",
  en_retard: "bg-danger/15 text-danger",
  annulee: "bg-white/10 text-muted",
};

export default async function BillingPage() {
  const supabase = await createClient();

  const [{ data: subscription }, { data: invoices }] = await Promise.all([
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Facturation</h1>
        <p className="text-sm text-muted">Abonnement, factures et historique de paiement.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abonnement actuel</CardTitle>
        </CardHeader>
        {subscription ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold capitalize">{subscription.plan}</p>
              <p className="text-sm text-muted">
                {subscription.price_fcfa.toLocaleString("fr-FR")} FCFA / {subscription.billing_cycle}
              </p>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-xs capitalize text-muted">
              {subscription.status}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted">Aucun abonnement actif — plan Basic par défaut.</p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Factures</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {invoices?.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{inv.invoice_number}</p>
                <p className="text-xs text-muted">
                  {inv.period_start} → {inv.period_end}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span>{inv.amount_fcfa.toLocaleString("fr-FR")} FCFA</span>
                <span className={`rounded-full px-2 py-1 text-xs ${STATUS_STYLES[inv.status]}`}>
                  {inv.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          ))}
          {(!invoices || invoices.length === 0) && <p className="text-sm text-muted">Aucune facture pour l&apos;instant.</p>}
        </div>
      </Card>
    </div>
  );
}
