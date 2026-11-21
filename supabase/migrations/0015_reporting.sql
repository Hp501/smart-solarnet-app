-- ============================================================
-- Smart SolarNet — Migration 0015
-- Reporting : Tables d'agrégation pour rapports
-- ============================================================

-- ============================================================
-- site_daily_metrics (données journalières agrégées)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    solar_production_kwh NUMERIC(14,3) NOT NULL DEFAULT 0,
    wind_production_kwh NUMERIC(14,3) NOT NULL DEFAULT 0,
    battery_charge_kwh NUMERIC(14,3) NOT NULL DEFAULT 0,
    battery_discharge_kwh NUMERIC(14,3) NOT NULL DEFAULT 0,
    consumption_kwh NUMERIC(14,3) NOT NULL DEFAULT 0,
    grid_import_kwh NUMERIC(14,3) NOT NULL DEFAULT 0,
    grid_export_kwh NUMERIC(14,3) NOT NULL DEFAULT 0,
    self_consumption_kwh NUMERIC(14,3) NOT NULL DEFAULT 0,
    availability_pct NUMERIC(5,2),
    co2_avoided_kg NUMERIC(14,3) NOT NULL DEFAULT 0,
    savings_fcfa NUMERIC(14,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(site_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_site_daily_metrics_site_date ON public.site_daily_metrics(site_id, metric_date DESC);

-- ============================================================
-- report_schedules (programmation des rapports)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL DEFAULT 'energie',
    frequency TEXT NOT NULL CHECK (frequency IN ('quotidien','hebdomadaire','mensuel','trimestriel')),
    delivery_channel TEXT NOT NULL DEFAULT 'email' CHECK (delivery_channel IN ('email','web')),
    recipient_email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    next_send_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_due ON public.report_schedules(next_send_at) WHERE is_active = true;

-- ============================================================
-- report_exports (exports de rapports)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('csv','pdf')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE public.site_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

-- site_daily_metrics
DROP POLICY IF EXISTS "daily_metrics_site_access" ON public.site_daily_metrics;
CREATE POLICY "daily_metrics_site_access" ON public.site_daily_metrics FOR SELECT
    USING (public.can_access_site(site_id));

DROP POLICY IF EXISTS "daily_metrics_admin_write" ON public.site_daily_metrics;
CREATE POLICY "daily_metrics_admin_write" ON public.site_daily_metrics FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- report_schedules
DROP POLICY IF EXISTS "report_schedules_own" ON public.report_schedules;
CREATE POLICY "report_schedules_own" ON public.report_schedules FOR ALL
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- report_exports
DROP POLICY IF EXISTS "report_exports_own" ON public.report_exports;
CREATE POLICY "report_exports_own" ON public.report_exports FOR SELECT
    USING (requested_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "report_exports_own_insert" ON public.report_exports;
CREATE POLICY "report_exports_own_insert" ON public.report_exports FOR INSERT
    WITH CHECK (requested_by = auth.uid());

-- ============================================================
-- Vérification
-- ============================================================
SELECT 
    tablename,
    '✅ Table créée' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('site_daily_metrics', 'report_schedules', 'report_exports')
ORDER BY tablename;