import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyDeviceApiKey } from "@/lib/device-auth";

/**
 * POST /api/ingest/heartbeat
 *
 * Ping léger que le firmware peut envoyer toutes les 30-60s (indépendamment
 * de l'envoi des mesures) pour signaler qu'il est vivant. Permet au
 * dashboard de détecter une panne ESP32 même quand il n'y a rien de neuf
 * à mesurer.
 *
 * Body optionnel : { "rssi": -58, "firmware_version": "1.2.0" }
 */
export async function POST(request: Request) {
  const deviceUid = request.headers.get("x-device-uid");
  const apiKey = request.headers.get("x-api-key");

  if (!deviceUid || !apiKey) {
    return NextResponse.json({ error: "Headers x-device-uid et x-api-key requis." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: device } = await admin
    .from("devices")
    .select("id, api_key_hash")
    .eq("device_uid", deviceUid)
    .single();

  if (!device || !verifyDeviceApiKey(apiKey, device.api_key_hash ?? "")) {
    return NextResponse.json({ error: "Authentification device invalide." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  await admin
    .from("devices")
    .update({
      status: "en_ligne",
      last_seen_at: new Date().toISOString(),
      rssi: body?.rssi ?? undefined,
      firmware_version: body?.firmware_version ?? undefined,
    })
    .eq("id", device.id);

  return NextResponse.json({ ok: true });
}
