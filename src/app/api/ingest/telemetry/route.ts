import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyDeviceApiKey } from "@/lib/device-auth";

/**
 * POST /api/ingest/telemetry
 *
 * Point d'entrée REST pour l'ESP32 — utilisé en secours si la connexion
 * MQTT tombe (le firmware bufferise alors en LittleFS et rejoue via cette
 * route dès que le WiFi/GSM revient), ou comme chemin principal si tu ne
 * veux pas déployer de broker MQTT.
 *
 * Authentification : headers `x-device-uid` + `x-api-key` (clé générée
 * via POST /api/admin/devices). Pas de session Supabase ici — c'est le
 * device lui-même qui s'authentifie, pas un utilisateur.
 *
 * Body attendu — un ou plusieurs points de mesure (batch pour le
 * rattrapage après coupure réseau) :
 * {
 *   "readings": [
 *     { "metric": "tension",     "value": 231.2, "unit": "V", "source": "solaire", "recorded_at": "2026-07-26T10:00:00Z" },
 *     { "metric": "courant",     "value": 10.16, "unit": "A", "source": "solaire" },
 *     { "metric": "puissance",   "value": 2350.5,"unit": "W", "source": "solaire" },
 *     { "metric": "temperature", "value": 29.5,  "unit": "°C" },
 *     { "metric": "humidite",    "value": 68,    "unit": "%" },
 *     { "metric": "soc",         "value": 76,    "unit": "%", "source": "batterie" }
 *   ],
 *   "rssi": -58
 * }
 *
 * `source` correspond au `source_type` d'une ligne dans `energy_sources`
 * pour ce site (solaire, eolienne, eneo, groupe_electrogene, batterie...).
 * Si omis, la mesure est enregistrée sans energy_source_id (ex : capteurs
 * ambiants température/humidité du DHT11 qui ne sont pas liés à une source).
 */
export async function POST(request: Request) {
  const deviceUid = request.headers.get("x-device-uid");
  const apiKey = request.headers.get("x-api-key");

  if (!deviceUid || !apiKey) {
    return NextResponse.json(
      { error: "Headers x-device-uid et x-api-key requis." },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  const { data: device, error: deviceError } = await admin
    .from("devices")
    .select("id, site_id, api_key_hash")
    .eq("device_uid", deviceUid)
    .single();

  if (deviceError || !device || !device.api_key_hash) {
    return NextResponse.json({ error: "Device inconnu." }, { status: 404 });
  }

  if (!verifyDeviceApiKey(apiKey, device.api_key_hash)) {
    return NextResponse.json({ error: "Clé API invalide." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const readings = body?.readings;

  if (!Array.isArray(readings) || readings.length === 0) {
    return NextResponse.json({ error: "Le champ 'readings' doit être un tableau non vide." }, { status: 400 });
  }

  // Résout les energy_source_id du site une seule fois pour tout le batch.
  const { data: sources } = await admin
    .from("energy_sources")
    .select("id, source_type")
    .eq("site_id", device.site_id);

  const sourceIdByType = new Map((sources ?? []).map((s) => [s.source_type, s.id]));

  const rows = readings.map((r: any) => ({
    site_id: device.site_id,
    device_id: device.id,
    energy_source_id: r.source ? sourceIdByType.get(r.source) ?? null : null,
    metric: r.metric,
    value: r.value,
    unit: r.unit,
    recorded_at: r.recorded_at ?? new Date().toISOString(),
  }));

  const { error: insertError } = await admin.from("telemetry").insert(rows);

  if (insertError) {
    return NextResponse.json({ error: "Erreur d'enregistrement de la télémétrie." }, { status: 500 });
  }

  // Met à jour le statut "en ligne" du device + force le suivi de la batterie
  // si une lecture de SOC est présente dans ce batch.
  await admin
    .from("devices")
    .update({
      status: "en_ligne",
      last_seen_at: new Date().toISOString(),
      rssi: body?.rssi ?? undefined,
    })
    .eq("id", device.id);

  const socReading = readings.find((r: any) => r.metric === "soc");
  if (socReading) {
    await admin
      .from("batteries")
      .update({ soc: socReading.value })
      .eq("site_id", device.site_id);
  }

  return NextResponse.json({ inserted: rows.length });
}
