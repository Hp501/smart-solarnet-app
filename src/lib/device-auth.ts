import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Authentification des devices IoT (ESP32) pour les endpoints d'ingestion.
 *
 * On ne stocke jamais la clé API en clair : seul son hash SHA-256 (salé par
 * un secret serveur) est conservé dans `devices.api_key_hash`. La clé en
 * clair n'est montrée qu'une seule fois, au moment de la création du device
 * (voir /api/admin/devices).
 */

const PEPPER = process.env.DEVICE_KEY_PEPPER ?? "smart-solarnet-dev-pepper";

export function generateDeviceApiKey(): string {
  // Format lisible façon "clé API" : ssn_live_<32 caractères hex>
  return `ssn_live_${randomBytes(24).toString("hex")}`;
}

export function hashDeviceApiKey(plainKey: string): string {
  return createHash("sha256").update(PEPPER + plainKey).digest("hex");
}

export function verifyDeviceApiKey(plainKey: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashDeviceApiKey(plainKey));
  const stored = Buffer.from(storedHash);
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}
