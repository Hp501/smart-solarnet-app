-- ============================================================
-- Smart SolarNet — Migration 0008
-- settings : paramètres utilisateur, site, API keys
-- ============================================================

CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
    scope TEXT NOT NULL DEFAULT 'user',
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_settings_scope CHECK (
        (scope = 'user' AND user_id IS NOT NULL AND site_id IS NULL) OR
        (scope = 'site' AND site_id IS NOT NULL)
    ),
    UNIQUE (scope, user_id, site_id, key)
);

CREATE INDEX IF NOT EXISTS idx_settings_user ON public.settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_site ON public.settings(site_id);

-- ------------------------------------------------------------
-- api_keys (clés API pour intégrations tierces / accès développeur)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{read}',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(key_prefix);

DROP TRIGGER IF EXISTS trg_settings_updated_at ON public.settings;
CREATE TRIGGER trg_settings_updated_at 
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();