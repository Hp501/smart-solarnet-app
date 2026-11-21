-- ============================================================
-- Smart SolarNet — Migration 0009
-- Row Level Security (RLS) — toutes les tables
-- ============================================================

-- ------------------------------------------------------------
-- Fonctions helper
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT COALESCE((SELECT role IN ('admin','super_admin') FROM public.users WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_support()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT COALESCE((SELECT role IN ('support','admin','super_admin') FROM public.users WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.owns_site(p_site_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.sites WHERE id = p_site_id AND owner_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_technician(p_site_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.site_technicians
        WHERE site_id = p_site_id AND technician_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_site(p_site_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.is_admin()
        OR public.owns_site(p_site_id)
        OR public.is_assigned_technician(p_site_id);
$$;

-- ------------------------------------------------------------
-- Activation RLS
-- ------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations_ai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Politiques RLS - users
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "users_select_own_or_admin" ON public.users;
CREATE POLICY "users_select_own_or_admin" ON public.users FOR SELECT
    USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE
    USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users_admin_full_access" ON public.users;
CREATE POLICY "users_admin_full_access" ON public.users FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- Politiques RLS - companies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies FOR SELECT
    USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "companies_manage_own" ON public.companies;
CREATE POLICY "companies_manage_own" ON public.companies FOR INSERT
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "companies_update_own" ON public.companies;
CREATE POLICY "companies_update_own" ON public.companies FOR UPDATE
    USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "companies_admin_delete" ON public.companies;
CREATE POLICY "companies_admin_delete" ON public.companies FOR DELETE
    USING (public.is_admin());

-- ------------------------------------------------------------
-- Politiques RLS - sites
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "sites_select" ON public.sites;
CREATE POLICY "sites_select" ON public.sites FOR SELECT
    USING (public.can_access_site(id));

DROP POLICY IF EXISTS "sites_insert_own" ON public.sites;
CREATE POLICY "sites_insert_own" ON public.sites FOR INSERT
    WITH CHECK (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "sites_update" ON public.sites;
CREATE POLICY "sites_update" ON public.sites FOR UPDATE
    USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "sites_delete" ON public.sites;
CREATE POLICY "sites_delete" ON public.sites FOR DELETE
    USING (owner_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------
-- Politiques RLS - site_technicians
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "site_technicians_select" ON public.site_technicians;
CREATE POLICY "site_technicians_select" ON public.site_technicians FOR SELECT
    USING (technician_id = auth.uid() OR public.owns_site(site_id) OR public.is_admin());

DROP POLICY IF EXISTS "site_technicians_admin_manage" ON public.site_technicians;
CREATE POLICY "site_technicians_admin_manage" ON public.site_technicians FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- Politiques RLS - energy_sources
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "energy_sources_access" ON public.energy_sources;
CREATE POLICY "energy_sources_access" ON public.energy_sources FOR SELECT
    USING (public.can_access_site(site_id));

DROP POLICY IF EXISTS "energy_sources_write" ON public.energy_sources;
CREATE POLICY "energy_sources_write" ON public.energy_sources FOR ALL
    USING (public.owns_site(site_id) OR public.is_admin())
    WITH CHECK (public.owns_site(site_id) OR public.is_admin());

-- ------------------------------------------------------------
-- Politiques RLS - batteries
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "batteries_access" ON public.batteries;
CREATE POLICY "batteries_access" ON public.batteries FOR SELECT
    USING (public.can_access_site(site_id));

DROP POLICY IF EXISTS "batteries_write" ON public.batteries;
CREATE POLICY "batteries_write" ON public.batteries FOR ALL
    USING (public.owns_site(site_id) OR public.is_admin() OR public.is_assigned_technician(site_id))
    WITH CHECK (public.owns_site(site_id) OR public.is_admin() OR public.is_assigned_technician(site_id));

-- ------------------------------------------------------------
-- Politiques RLS - devices
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "devices_access" ON public.devices;
CREATE POLICY "devices_access" ON public.devices FOR SELECT
    USING (public.can_access_site(site_id));

DROP POLICY IF EXISTS "devices_write" ON public.devices;
CREATE POLICY "devices_write" ON public.devices FOR ALL
    USING (public.owns_site(site_id) OR public.is_admin() OR public.is_assigned_technician(site_id))
    WITH CHECK (public.owns_site(site_id) OR public.is_admin() OR public.is_assigned_technician(site_id));

-- ------------------------------------------------------------
-- Politiques RLS - sensors
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "sensors_access" ON public.sensors;
CREATE POLICY "sensors_access" ON public.sensors FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.devices d WHERE d.id = device_id AND public.can_access_site(d.site_id)));

DROP POLICY IF EXISTS "sensors_write" ON public.sensors;
CREATE POLICY "sensors_write" ON public.sensors FOR ALL
    USING (EXISTS (SELECT 1 FROM public.devices d WHERE d.id = device_id AND (public.owns_site(d.site_id) OR public.is_admin())));

-- ------------------------------------------------------------
-- Politiques RLS - telemetry
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "telemetry_access" ON public.telemetry;
CREATE POLICY "telemetry_access" ON public.telemetry FOR SELECT
    USING (public.can_access_site(site_id));

-- ------------------------------------------------------------
-- Politiques RLS - loads
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "loads_access" ON public.loads;
CREATE POLICY "loads_access" ON public.loads FOR SELECT
    USING (public.can_access_site(site_id));

DROP POLICY IF EXISTS "loads_write" ON public.loads;
CREATE POLICY "loads_write" ON public.loads FOR ALL
    USING (public.owns_site(site_id) OR public.is_admin() OR public.is_assigned_technician(site_id))
    WITH CHECK (public.owns_site(site_id) OR public.is_admin() OR public.is_assigned_technician(site_id));

-- ------------------------------------------------------------
-- Politiques RLS - relay_states
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "relay_states_access" ON public.relay_states;
CREATE POLICY "relay_states_access" ON public.relay_states FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.loads l WHERE l.id = load_id AND public.can_access_site(l.site_id)));

DROP POLICY IF EXISTS "relay_states_insert" ON public.relay_states;
CREATE POLICY "relay_states_insert" ON public.relay_states FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.loads l WHERE l.id = load_id AND public.can_access_site(l.site_id)));

-- ------------------------------------------------------------
-- Politiques RLS - alerts
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "alerts_access" ON public.alerts;
CREATE POLICY "alerts_access" ON public.alerts FOR SELECT
    USING (public.can_access_site(site_id));

DROP POLICY IF EXISTS "alerts_update" ON public.alerts;
CREATE POLICY "alerts_update" ON public.alerts FOR UPDATE
    USING (public.can_access_site(site_id));

-- ------------------------------------------------------------
-- Politiques RLS - recommendations_ai
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "recommendations_access" ON public.recommendations_ai;
CREATE POLICY "recommendations_access" ON public.recommendations_ai FOR SELECT
    USING (public.can_access_site(site_id));

-- ------------------------------------------------------------
-- Politiques RLS - weather
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "weather_access" ON public.weather;
CREATE POLICY "weather_access" ON public.weather FOR SELECT
    USING (public.can_access_site(site_id));

-- ------------------------------------------------------------
-- Politiques RLS - maintenance
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "maintenance_access" ON public.maintenance;
CREATE POLICY "maintenance_access" ON public.maintenance FOR SELECT
    USING (public.can_access_site(site_id) OR technician_id = auth.uid());

DROP POLICY IF EXISTS "maintenance_write" ON public.maintenance;
CREATE POLICY "maintenance_write" ON public.maintenance FOR ALL
    USING (public.is_admin() OR public.is_support() OR technician_id = auth.uid())
    WITH CHECK (public.is_admin() OR public.is_support() OR technician_id = auth.uid());

-- ------------------------------------------------------------
-- Politiques RLS - logs
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "logs_admin_select" ON public.logs;
CREATE POLICY "logs_admin_select" ON public.logs FOR SELECT
    USING (public.is_admin());

-- ------------------------------------------------------------
-- Politiques RLS - subscriptions
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "subscriptions_own_or_admin" ON public.subscriptions;
CREATE POLICY "subscriptions_own_or_admin" ON public.subscriptions FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "subscriptions_admin_write" ON public.subscriptions;
CREATE POLICY "subscriptions_admin_write" ON public.subscriptions FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- Politiques RLS - invoices
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "invoices_own_or_admin" ON public.invoices;
CREATE POLICY "invoices_own_or_admin" ON public.invoices FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------
-- Politiques RLS - payments
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "payments_own_or_admin" ON public.payments;
CREATE POLICY "payments_own_or_admin" ON public.payments FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "payments_own_insert" ON public.payments;
CREATE POLICY "payments_own_insert" ON public.payments FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------
-- Politiques RLS - products
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products FOR SELECT
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "products_admin_write" ON public.products;
CREATE POLICY "products_admin_write" ON public.products FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- Politiques RLS - services
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "services_public_read" ON public.services;
CREATE POLICY "services_public_read" ON public.services FOR SELECT
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "services_admin_write" ON public.services;
CREATE POLICY "services_admin_write" ON public.services FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- Politiques RLS - marketplace_orders
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "orders_own_or_admin" ON public.marketplace_orders;
CREATE POLICY "orders_own_or_admin" ON public.marketplace_orders FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "orders_own_insert" ON public.marketplace_orders;
CREATE POLICY "orders_own_insert" ON public.marketplace_orders FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "orders_admin_update" ON public.marketplace_orders;
CREATE POLICY "orders_admin_update" ON public.marketplace_orders FOR UPDATE
    USING (public.is_admin() OR user_id = auth.uid());

-- ------------------------------------------------------------
-- Politiques RLS - order_items
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "order_items_access" ON public.order_items;
CREATE POLICY "order_items_access" ON public.order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.marketplace_orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())));

DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.marketplace_orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- ------------------------------------------------------------
-- Politiques RLS - product_reviews
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "reviews_public_read" ON public.product_reviews;
CREATE POLICY "reviews_public_read" ON public.product_reviews FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "reviews_own_write" ON public.product_reviews;
CREATE POLICY "reviews_own_write" ON public.product_reviews FOR ALL
    USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------
-- Politiques RLS - conversations
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "conversations_access" ON public.conversations;
CREATE POLICY "conversations_access" ON public.conversations FOR SELECT
    USING (client_id = auth.uid() OR support_agent_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "conversations_client_insert" ON public.conversations;
CREATE POLICY "conversations_client_insert" ON public.conversations FOR INSERT
    WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "conversations_support_update" ON public.conversations;
CREATE POLICY "conversations_support_update" ON public.conversations FOR UPDATE
    USING (support_agent_id = auth.uid() OR public.is_support() OR client_id = auth.uid());

-- ------------------------------------------------------------
-- Politiques RLS - messages
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "messages_access" ON public.messages;
CREATE POLICY "messages_access" ON public.messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.client_id = auth.uid() OR c.support_agent_id = auth.uid() OR public.is_admin())));

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
    WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.client_id = auth.uid() OR c.support_agent_id = auth.uid() OR public.is_support())));

-- ------------------------------------------------------------
-- Politiques RLS - support_tickets
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "tickets_access" ON public.support_tickets;
CREATE POLICY "tickets_access" ON public.support_tickets FOR SELECT
    USING (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_support());

DROP POLICY IF EXISTS "tickets_insert" ON public.support_tickets;
CREATE POLICY "tickets_insert" ON public.support_tickets FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "tickets_update" ON public.support_tickets;
CREATE POLICY "tickets_update" ON public.support_tickets FOR UPDATE
    USING (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_support());

-- ------------------------------------------------------------
-- Politiques RLS - notifications
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_own_update" ON public.notifications;
CREATE POLICY "notifications_own_update" ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- Politiques RLS - settings
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "settings_user_scope" ON public.settings;
CREATE POLICY "settings_user_scope" ON public.settings FOR ALL
    USING ((scope = 'user' AND user_id = auth.uid()) OR (scope = 'site' AND public.can_access_site(site_id)))
    WITH CHECK ((scope = 'user' AND user_id = auth.uid()) OR (scope = 'site' AND (public.owns_site(site_id) OR public.is_admin())));

-- ------------------------------------------------------------
-- Politiques RLS - api_keys
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "api_keys_own" ON public.api_keys;
CREATE POLICY "api_keys_own" ON public.api_keys FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());