-- ============================================================
-- Smart SolarNet — Migration 0012
-- Détection automatique de panne ESP32 (device silencieux)
-- ============================================================

-- Marque hors ligne tout device qui n'a pas donné signe de vie
-- (télémétrie OU heartbeat) depuis plus de `p_timeout_minutes`,
-- et crée une alerte "panne ESP32" si ce n'est pas déjà fait.
create or replace function public.mark_stale_devices_offline(p_timeout_minutes integer default 5)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_count integer := 0;
  v_device record;
begin
  for v_device in
    select id, site_id, name
    from public.devices
    where status = 'en_ligne'
      and (last_seen_at is null or last_seen_at < now() - (p_timeout_minutes || ' minutes')::interval)
  loop
    update public.devices set status = 'hors_ligne' where id = v_device.id;

    insert into public.alerts (site_id, device_id, code, severity, title, message)
    values (
      v_device.site_id,
      v_device.id,
      'panne_esp32',
      'critique',
      'Device hors ligne',
      format('Le device "%s" ne répond plus depuis plus de %s minutes.', v_device.name, p_timeout_minutes)
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ------------------------------------------------------------
-- Planification (pg_cron) — décommentez si l'extension pg_cron
-- est activée sur votre projet Supabase (Database → Extensions).
-- Exécute la vérification toutes les 5 minutes.
-- ------------------------------------------------------------
-- select cron.schedule(
--   'check-devices-offline',
--   '*/5 * * * *',
--   $$select public.mark_stale_devices_offline(5);$$
-- );

-- Alternative sans pg_cron : créez une Supabase Scheduled Edge Function
-- (Dashboard → Edge Functions → Schedules) qui appelle simplement :
--   select public.mark_stale_devices_offline(5);
-- via le client admin, toutes les 5 minutes.
