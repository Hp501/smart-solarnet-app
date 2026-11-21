-- Parcours client : l'équipe support/technique accède aux commandes,
-- conversations et positions nécessaires à une intervention.
create or replace function public.can_access_site(p_site_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_support() or public.owns_site(p_site_id) or public.is_assigned_technician(p_site_id);
$$;

drop policy if exists "orders_own_or_admin" on public.marketplace_orders;
create policy "orders_customer_or_support_read" on public.marketplace_orders for select
  using (user_id = auth.uid() or public.is_support() or public.current_user_role() = 'technicien');
drop policy if exists "order_items_access" on public.order_items;
create policy "order_items_customer_or_support_read" on public.order_items for select using (
  exists (select 1 from public.marketplace_orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_support() or public.current_user_role() = 'technicien'))
);
drop policy if exists "conversations_access" on public.conversations;
create policy "conversations_customer_or_support_read" on public.conversations for select
  using (client_id = auth.uid() or support_agent_id = auth.uid() or public.is_support());

drop policy if exists "messages_access" on public.messages;
create policy "messages_customer_or_support_read" on public.messages for select using (
  exists (select 1 from public.conversations c where c.id = conversation_id and (c.client_id = auth.uid() or c.support_agent_id = auth.uid() or public.is_support()))
);

create or replace function public.assign_support_agent_on_reply()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_support() then update public.conversations set support_agent_id = auth.uid() where id = new.conversation_id and support_agent_id is null; end if;
  return new;
end;
$$;
drop trigger if exists trg_assign_support_agent_on_reply on public.messages;
create trigger trg_assign_support_agent_on_reply before insert on public.messages for each row execute procedure public.assign_support_agent_on_reply();
