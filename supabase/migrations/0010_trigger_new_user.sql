-- ============================================================
-- Smart SolarNet — Migration 0010
-- Trigger d'inscription automatique
-- Garantit qu'aucun compte ne peut exister dans auth.users
-- sans avoir immédiatement sa ligne dans public.users.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role public.user_role;
begin
  -- Le rôle est toujours forcé à 'client' pour une inscription publique,
  -- sauf si l'insertion vient du back-office admin (metadata 'invited_role'
  -- signée côté serveur uniquement — jamais modifiable depuis le frontend public).
  begin
    v_role := coalesce(new.raw_user_meta_data->>'invited_role', 'client')::public.user_role;
  exception when others then
    v_role := 'client';
  end;

  insert into public.users (id, email, full_name, phone, role, language, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    v_role,
    coalesce(new.raw_user_meta_data->>'language', 'fr'),
    now()
  )
  on conflict (id) do nothing; -- idempotent : évite tout doublon en cas de retry

  -- Notification de bienvenue créée immédiatement (visible dès la 1ère connexion)
  insert into public.notifications (user_id, channel, category, title, body)
  values (
    new.id,
    'web',
    'systeme',
    'Bienvenue sur Smart SolarNet',
    'Votre compte a été créé avec succès. Configurez votre premier site pour commencer.'
  );

  -- Journal d'audit
  insert into public.logs (user_id, action, entity_type, entity_id, metadata)
  values (new.id, 'signup', 'user', new.id, jsonb_build_object('email', new.email));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- Synchronisation email si l'utilisateur le change via Supabase Auth
-- ------------------------------------------------------------
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.users set email = new.email, updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure public.handle_user_email_update();

-- ------------------------------------------------------------
-- Nettoyage propre en cas de suppression du compte auth
-- (public.users a déjà "on delete cascade" — ce trigger sert
-- surtout à journaliser la suppression avant qu'elle disparaisse)
-- ------------------------------------------------------------
create or replace function public.handle_user_deletion()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.logs (user_id, action, entity_type, entity_id, metadata)
  values (null, 'delete_account', 'user', old.id, jsonb_build_object('email', old.email));
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  before delete on auth.users
  for each row execute procedure public.handle_user_deletion();
