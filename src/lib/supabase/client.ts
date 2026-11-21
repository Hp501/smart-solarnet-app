"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase utilisable dans les Client Components ("use client").
 * Utilise la clé anonyme publique — jamais la service_role ici.
 *
 * Note : on n'applique pas le générique <Database> ici. Le fichier
 * src/types/database.types.ts est un stub simplifié écrit à la main (voir
 * son en-tête) — le passer en générique casse l'inférence de types de
 * @supabase/supabase-js sur `.select()` (colonnes typées en `never`).
 * Une fois `npm run db:types` exécuté contre ton vrai projet Supabase,
 * remplace ce fichier par les types générés et réintroduis
 * `createBrowserClient<Database>(...)` pour retrouver l'autocomplétion.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
