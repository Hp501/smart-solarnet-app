-- ============================================================
-- Smart SolarNet — Migration 0003
-- Tables énergie
-- ============================================================

-- ------------------------------------------------------------
-- energy_sources
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.energy_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    source_type public.energy_source_type NOT NULL,
    name TEXT NOT NULL,
    rated_power_w NUMERIC(10,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (site_id, source_type, name)
);

CREATE INDEX IF NOT EXISTS idx_energy_sources_site ON public.energy_sources(site_id);
CREATE INDEX IF NOT EXISTS idx_energy_sources_type ON public.energy_sources(source_type);

-- ------------------------------------------------------------
-- batteries
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batteries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    energy_source_id UUID REFERENCES public.energy_sources(id) ON DELETE SET NULL,
    brand TEXT,
    model TEXT,
    
    capacity_kwh NUMERIC(10,2) NOT NULL,
    soc NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (soc BETWEEN 0 AND 100),
    soh NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (soh BETWEEN 0 AND 100),
    temperature_c NUMERIC(5,2),
    charge_power_w NUMERIC(10,2) DEFAULT 0,
    discharge_power_w NUMERIC(10,2) DEFAULT 0,
    remaining_autonomy_min INTEGER,
    cycle_count INTEGER NOT NULL DEFAULT 0,
    installed_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batteries_site ON public.batteries(site_id);

-- ------------------------------------------------------------
-- devices
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    device_uid TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    device_type TEXT NOT NULL DEFAULT 'esp32',
    firmware_version TEXT,
    status public.device_status NOT NULL DEFAULT 'hors_ligne',
    rssi INTEGER,
    ip_address INET,
    last_seen_at TIMESTAMPTZ,
    api_key_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devices_site ON public.devices(site_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON public.devices(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_uid ON public.devices(device_uid);

-- ------------------------------------------------------------
-- sensors
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    energy_source_id UUID REFERENCES public.energy_sources(id) ON DELETE SET NULL,
    sensor_type TEXT NOT NULL,
    unit TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sensors_device ON public.sensors(device_id);
CREATE INDEX IF NOT EXISTS idx_sensors_source ON public.sensors(energy_source_id);

-- ------------------------------------------------------------
-- telemetry
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telemetry (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    sensor_id UUID REFERENCES public.sensors(id) ON DELETE SET NULL,
    energy_source_id UUID REFERENCES public.energy_sources(id) ON DELETE SET NULL,
    metric TEXT NOT NULL,
    value NUMERIC(14,4) NOT NULL,
    unit TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS public.telemetry_default 
PARTITION OF public.telemetry DEFAULT;

CREATE INDEX IF NOT EXISTS idx_telemetry_site_time ON public.telemetry(site_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_metric ON public.telemetry(metric);
CREATE INDEX IF NOT EXISTS idx_telemetry_source ON public.telemetry(energy_source_id);

-- ------------------------------------------------------------
-- loads
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    relay_channel INTEGER,
    name TEXT NOT NULL,
    priority public.load_priority NOT NULL DEFAULT 'normal',
    rated_power_w NUMERIC(10,2),
    is_on BOOLEAN NOT NULL DEFAULT false,
    is_auto BOOLEAN NOT NULL DEFAULT true,
    schedule JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loads_site ON public.loads(site_id);
CREATE INDEX IF NOT EXISTS idx_loads_priority ON public.loads(priority);

-- ------------------------------------------------------------
-- relay_states
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.relay_states (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    previous_state BOOLEAN,
    new_state BOOLEAN NOT NULL,
    triggered_by TEXT NOT NULL DEFAULT 'system',
    triggered_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_relay_states_load ON public.relay_states(load_id, changed_at DESC);

-- ------------------------------------------------------------
-- Triggers
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_energy_sources_updated_at ON public.energy_sources;
CREATE TRIGGER trg_energy_sources_updated_at 
    BEFORE UPDATE ON public.energy_sources
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_batteries_updated_at ON public.batteries;
CREATE TRIGGER trg_batteries_updated_at 
    BEFORE UPDATE ON public.batteries
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_devices_updated_at ON public.devices;
CREATE TRIGGER trg_devices_updated_at 
    BEFORE UPDATE ON public.devices
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_loads_updated_at ON public.loads;
CREATE TRIGGER trg_loads_updated_at 
    BEFORE UPDATE ON public.loads
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();