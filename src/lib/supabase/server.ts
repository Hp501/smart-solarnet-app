import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pour Server Components / Route Handlers / Server Actions.
 * Lit et écrit les cookies de session via l'API `cookies()` de Next.js.
 *
 * Note : pas de générique <Database> ici — voir l'explication dans
 * src/lib/supabase/client.ts. Réintroduis-le une fois les types régénérés
 * avec `npm run db:types`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component : ignoré si le middleware
            // rafraîchit déjà la session à chaque requête.
          }
        },
      },
    }
  );
}

/**
 * Client "admin" avec la clé service_role — bypass RLS.
 * À utiliser UNIQUEMENT côté serveur (Route Handlers / Edge Functions),
 * jamais importé dans un fichier "use client".
 * Exemple d'usage légitime : ingestion de télémétrie ESP32, invitation
 * d'un utilisateur avec un rôle élevé (technicien, support, admin).
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}
