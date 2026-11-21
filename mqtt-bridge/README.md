# Smart SolarNet — Pont MQTT ↔ Supabase

Service Node autonome (à héberger à côté de ton broker Mosquitto, ou sur un
petit VPS) qui relie ton firmware ESP32 à la base Supabase.

## Pourquoi un service séparé ?

Next.js / Vercel ne peut pas maintenir une connexion MQTT persistante
(fonctions serverless = pas de process long-running). Ce petit service Node
tourne en continu, lui, et fait le pont.

## Installation

```bash
cd mqtt-bridge
npm install
cp .env.example .env
# remplir MQTT_BROKER_URL, MQTT_USERNAME/PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm start
```

Pour le faire tourner en permanence : `pm2 start index.js --name ssn-bridge`
ou un service systemd.

## Convention de topics attendue côté firmware ESP32

| Topic | Sens | Payload |
|---|---|---|
| `smartsolarnet/<device_uid>/telemetry` | device → app | `{"readings":[{"metric":"tension","value":231.2,"unit":"V","source":"solaire"}], "rssi": -58}` |
| `smartsolarnet/<device_uid>/status` | device → app (LWT) | `"online"` ou `"offline"` |
| `smartsolarnet/<device_uid>/relay/set` | app → device | `{"channel":1,"state":true}` |
| `smartsolarnet/<device_uid>/relay/state` | device → app (ack) | `{"channel":1,"state":true}` |

`source` correspond au `source_type` Supabase (`solaire`, `eolienne`, `eneo`,
`groupe_electrogene`, `batterie`). Omets-le pour les mesures ambiantes
(température/humidité DHT11).

**Important — LWT (Last Will and Testament)** : configure dans le firmware
(`esp_mqtt_client_config_t.session.last_will` ou équivalent Arduino
`PubSubClient::connect(..., willTopic, willQos, willRetain, "offline")`) le
topic `smartsolarnet/<device_uid>/status` avec le message `"offline"`. Ainsi,
si l'ESP32 perd sa connexion brutalement (coupure secteur, crash), Mosquitto
publie automatiquement `"offline"` à ta place — le dashboard le détecte
immédiatement, sans attendre le timeout de la migration 0012.

## Relation avec le mode REST de secours

Le firmware garde son store-and-forward LittleFS : si MQTT est indisponible,
il bufferise localement puis rejoue les mesures via
`POST /api/ingest/telemetry` (Next.js) dès que la connexion revient — les
deux chemins écrivent dans la même table `telemetry`, donc pas de perte ni
de doublon logique côté dashboard.
