import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateDeviceApiKey, hashDeviceApiKey } from "@/lib/device-auth";

/**
 * POST /api/admin/devices
 *
 * Enregistre un nouveau device IoT (ex : ton ESP32-S3-DevKit-1) et génère
 * sa clé API. La clé est renvoyée EN CLAIR une seule fois dans cette
 * réponse — copie-la immédiatement dans le firmware / la config de
 * l'appareil, elle ne sera plus jamais récupérable ensuite (seul son hash
 * est stocké).
 *
 * Réservé aux rôles admin / super_admin / propriétaire du site (RLS sur
 * `sites` + vérification explicite ici).
 *
 * Body attendu :
 * {
 *   "site_id": "uuid-du-site",
 *   "device_uid": "ESP32-BASTOS-002",   // identifiant matériel unique
 *   "name": "Passerelle atelier",
 *   "device_type": "esp32"
 * }
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();

  const body = await request.json().catch(() => null);
  if (!body?.site_id || !body?.device_uid || !body?.name) {
    return NextResponse.json(
      { error: "Champs requis : site_id, device_uid, name." },
      { status: 400 }
    );
  }

  // Vérifie que l'utilisateur possède le site (ou est admin) — RLS protège
  // déjà la table `sites`, on double-vérifie ici avant d'écrire un device.
  const { data: site } = await supabase
    .from("sites")
    .select("id, owner_id")
    .eq("id", body.site_id)
    .single();

  const isOwner = site?.owner_id === user.id;
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  if (!site || (!isOwner && !isAdmin)) {
    return NextResponse.json({ error: "Accès refusé à ce site." }, { status: 403 });
  }

  const plainKey = generateDeviceApiKey();
  const keyHash = hashDeviceApiKey(plainKey);

  // Écriture via le client admin (service_role) car `devices` n'a pas de
  // policy INSERT ouverte au client — c'est cette route, contrôlée côté
  // serveur, qui fait autorité.
  const admin = createAdminClient();

  const { data: device, error } = await admin
    .from("devices")
    .insert({
      site_id: body.site_id,
      device_uid: body.device_uid,
      name: body.name,
      device_type: body.device_type ?? "esp32",
      status: "hors_ligne",
      api_key_hash: keyHash,
    })
    .select()
    .single();

  if (error) {
    const message = error.message.includes("duplicate")
      ? "Ce device_uid est déjà enregistré."
      : "Erreur lors de la création du device.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({
    device,
    api_key: plainKey, // ⚠️ affiché une seule fois — à copier immédiatement
    warning:
      "Copiez cette clé maintenant dans le firmware (WiFiManager / config.h). Elle ne sera plus jamais affichée.",
  });
}
