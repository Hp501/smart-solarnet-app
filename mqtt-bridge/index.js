import "dotenv/config";
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";

/**
 * Pont MQTT ↔ Supabase pour Smart SolarNet.
 *
 * Convention de topics (à respecter côté firmware ESP32) :
 *
 *   smartsolarnet/<device_uid>/telemetry   (device → bridge, QoS 1)
 *     Payload JSON : { "readings": [{ "metric", "value", "unit", "source"? }], "rssi"? }
 *     (même format que le body de POST /api/ingest/telemetry)
 *
 *   smartsolarnet/<device_uid>/status      (device → bridge, retained + LWT)
 *     Payload : "online" | "offline"
 *     Configurez ce topic comme "Last Will and Testament" dans le firmware
 *     (connect_opts.will) pour que Mosquitto publie "offline" automatiquement
 *     si l'ESP32 perd sa connexion sans clean disconnect.
 *
 *   smartsolarnet/<device_uid>/relay/set   (bridge → device)
 *     Payload JSON : { "channel": 1, "state": true }
 *     Publié automatiquement quand une ligne de `public.loads` change côté
 *     app (toggle manuel ou décision de délestage automatique).
 *
 *   smartsolarnet/<device_uid>/relay/state (device → bridge, ack)
 *     Payload JSON : { "channel": 1, "state": true }
 *     Confirme que le relais a bien changé d'état → écrit dans
 *     `public.relay_states`.
 *
 * Sécurité : le device s'authentifie auprès du broker Mosquitto lui-même
 * (TLS + user/mdp ou certificat client par device — à configurer dans
 * Mosquitto, hors du périmètre de ce script). Le bridge fait ensuite
 * confiance au broker et écrit dans Supabase avec la clé service_role.
 * Ne déployez donc jamais ce bridge sur une machine non maîtrisée.
 */

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clientId: `ssn-bridge-${Math.random().toString(16).slice(2)}`,
  clean: true,
  reconnectPeriod: 5000,
});

const TOPIC_TELEMETRY = "smartsolarnet/+/telemetry";
const TOPIC_STATUS = "smartsolarnet/+/status";
const TOPIC_RELAY_STATE = "smartsolarnet/+/relay/state";

client.on("connect", () => {
  console.log("[mqtt-bridge] connecté au broker Mosquitto");
  client.subscribe([TOPIC_TELEMETRY, TOPIC_STATUS, TOPIC_RELAY_STATE], { qos: 1 }, (err) => {
    if (err) console.error("[mqtt-bridge] erreur d'abonnement", err);
    else console.log("[mqtt-bridge] abonné aux topics telemetry / status / relay/state");
  });

  subscribeToRelayCommands();
});

client.on("error", (err) => console.error("[mqtt-bridge] erreur MQTT", err));
client.on("reconnect", () => console.log("[mqtt-bridge] reconnexion en cours…"));

client.on("message", async (topic, payloadBuf) => {
  const parts = topic.split("/"); // ["smartsolarnet", "<device_uid>", "telemetry"|"status"|"relay","state"]
  const deviceUid = parts[1];
  const kind = parts.slice(2).join("/");
  const payload = payloadBuf.toString();

  try {
    if (kind === "telemetry") await handleTelemetry(deviceUid, payload);
    else if (kind === "status") await handleStatus(deviceUid, payload);
    else if (kind === "relay/state") await handleRelayState(deviceUid, payload);
  } catch (err) {
    console.error(`[mqtt-bridge] erreur traitement ${topic}:`, err.message);
  }
});

async function getDeviceByUid(deviceUid) {
  const { data } = await supabase
    .from("devices")
    .select("id, site_id")
    .eq("device_uid", deviceUid)
    .single();
  return data;
}

async function handleTelemetry(deviceUid, payloadStr) {
  const device = await getDeviceByUid(deviceUid);
  if (!device) {
    console.warn(`[mqtt-bridge] device inconnu: ${deviceUid}`);
    return;
  }

  const body = JSON.parse(payloadStr);
  const readings = body.readings ?? [];
  if (readings.length === 0) return;

  const { data: sources } = await supabase
    .from("energy_sources")
    .select("id, source_type")
    .eq("site_id", device.site_id);
  const sourceIdByType = new Map((sources ?? []).map((s) => [s.source_type, s.id]));

  const rows = readings.map((r) => ({
    site_id: device.site_id,
    device_id: device.id,
    energy_source_id: r.source ? sourceIdByType.get(r.source) ?? null : null,
    metric: r.metric,
    value: r.value,
    unit: r.unit,
    recorded_at: r.recorded_at ?? new Date().toISOString(),
  }));

  await supabase.from("telemetry").insert(rows);
  await supabase
    .from("devices")
    .update({ status: "en_ligne", last_seen_at: new Date().toISOString(), rssi: body.rssi ?? undefined })
    .eq("id", device.id);

  const socReading = readings.find((r) => r.metric === "soc");
  if (socReading) {
    await supabase.from("batteries").update({ soc: socReading.value }).eq("site_id", device.site_id);
  }

  console.log(`[mqtt-bridge] ${readings.length} mesure(s) enregistrée(s) pour ${deviceUid}`);
}

async function handleStatus(deviceUid, payloadStr) {
  const device = await getDeviceByUid(deviceUid);
  if (!device) return;

  const status = payloadStr.trim() === "online" ? "en_ligne" : "hors_ligne";
  await supabase
    .from("devices")
    .update({ status, last_seen_at: new Date().toISOString() })
    .eq("id", device.id);

  if (status === "hors_ligne") {
    await supabase.from("alerts").insert({
      site_id: device.site_id,
      device_id: device.id,
      code: "panne_esp32",
      severity: "critique",
      title: "Device hors ligne",
      message: `Le device ${deviceUid} a signalé une déconnexion (LWT Mosquitto).`,
    });
  }

  console.log(`[mqtt-bridge] statut ${deviceUid} → ${status}`);
}

async function handleRelayState(deviceUid, payloadStr) {
  const device = await getDeviceByUid(deviceUid);
  if (!device) return;

  const { channel, state } = JSON.parse(payloadStr);

  const { data: load } = await supabase
    .from("loads")
    .select("id, is_on")
    .eq("device_id", device.id)
    .eq("relay_channel", channel)
    .single();

  if (!load) return;

  await supabase.from("loads").update({ is_on: state }).eq("id", load.id);
  await supabase.from("relay_states").insert({
    load_id: load.id,
    previous_state: load.is_on,
    new_state: state,
    triggered_by: "device",
    reason: "ack matériel du relais",
  });

  console.log(`[mqtt-bridge] relais confirmé — ${deviceUid} canal ${channel} → ${state}`);
}

/**
 * Écoute les changements sur `public.loads` côté Supabase (Realtime) et
 * publie une commande MQTT vers le device concerné dès qu'un relais doit
 * changer d'état (toggle manuel depuis le dashboard, ou décision prise par
 * le module IA / la logique de délestage automatique).
 */
function subscribeToRelayCommands() {
  supabase
    .channel("loads-changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "loads" },
      async (payload) => {
        const load = payload.new;
        if (!load.device_id || load.relay_channel == null) return;

        const { data: device } = await supabase
          .from("devices")
          .select("device_uid")
          .eq("id", load.device_id)
          .single();

        if (!device) return;

        client.publish(
          `smartsolarnet/${device.device_uid}/relay/set`,
          JSON.stringify({ channel: load.relay_channel, state: load.is_on }),
          { qos: 1 }
        );

        console.log(`[mqtt-bridge] commande relais envoyée → ${device.device_uid} canal ${load.relay_channel}`);
      }
    )
    .subscribe();
}
