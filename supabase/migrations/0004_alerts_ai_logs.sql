-- ============================================================
-- Smart SolarNet — Migration 0004
-- Tables : alerts, recommendations_ai, weather, maintenance, logs
-- ============================================================

-- ------------------------------------------------------------
-- alerts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    severity public.alert_severity NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_site ON public.alerts(site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON public.alerts(site_id) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);

-- ------------------------------------------------------------
-- recommendations_ai
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recommendations_ai (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence_score NUMERIC(4,3),
    is_applied BOOLEAN NOT NULL DEFAULT false,
    applied_at TIMESTAMPTZ,
    model_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_site ON public.recommendations_ai(site_id, created_at DESC);

-- ------------------------------------------------------------
-- weather
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weather (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    temperature_c NUMERIC(5,2),
    humidity_pct NUMERIC(5,2),
    cloud_cover_pct NUMERIC(5,2),
    wind_speed_ms NUMERIC(6,2),
    irradiance_wm2 NUMERIC(8,2),
    forecast_source TEXT DEFAULT 'openweathermap',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weather_site_time ON public.weather(site_id, recorded_at DESC);

-- ------------------------------------------------------------
-- maintenance
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'preventive',
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'planifiee',
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    report_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_site ON public.maintenance(site_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tech ON public.maintenance(technician_id);

-- ------------------------------------------------------------
-- logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_user ON public.logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_action ON public.logs(action);

-- ------------------------------------------------------------
-- Triggers
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_maintenance_updated_at ON public.maintenance;
CREATE TRIGGER trg_maintenance_updated_at 
    BEFORE UPDATE ON public.maintenance
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();