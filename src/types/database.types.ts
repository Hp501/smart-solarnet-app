// types Supabase (adaptés au code frontend)
export interface SiteRow {
  id: string;
  name: string;
  owner_id: string;
  location?: string;
  region?: string;
  country?: string;
  city?: string;                 // ✅ ajouté
  latitude?: number;             // ✅ ajouté
  longitude?: number;            // ✅ ajouté
  is_active?: boolean;
  solar_capacity_w?: number;
  battery_capacity_kwh?: number;
  installed_capacity_kw?: number; // ✅ ajouté
  created_at?: string;
}

export interface DeviceRow {
  id: string;
  device_uid: string;
  site_id: string;
  status?: string;
  last_seen_at?: string;
  rssi?: number;
}

export interface AlertRow {
  id: string;
  site_id: string;
  device_id?: string;
  code: string;
  severity: string;
  title: string;
  message?: string; // peut être undefined
  is_resolved?: boolean;
  created_at?: string; // peut être undefined
}

export interface BatteryRow {
  id: string;
  site_id: string;
  soc?: number;
  soh?: number;                 // ✅ ajouté
  voltage?: number;
  current?: number;
  temperature?: number;         // gardé, mais le code utilise `temperature_c` → on va corriger le code
  temperature_c?: number;       // ✅ ajouté (alias)
  updated_at?: string;
}

export interface LoadRow {
  id: string;
  device_id?: string;
  relay_channel: number;
  name: string;
  is_on?: boolean;
  power_w?: number;
  priority?: LoadPriority;
}

export type LoadPriority = 'critique' | 'important' | 'normal' | 'secondaire';

// ✅ Rôles étendus pour correspondre à ce qui est utilisé dans le code
export type UserRole = 
  | 'client' 
  | 'admin' 
  | 'technician' 
  | 'enterprise'
  | 'pme'           // ajouté
  | 'installateur'  // ajouté
  | 'technicien'    // ajouté
  | 'support'       // ajouté
  | 'super_admin';  // ajouté

export type DeviceStatus = 'en_ligne' | 'hors_ligne' | 'inconnu';
