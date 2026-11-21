-- ============================================================
-- Smart SolarNet — Migration 0002
-- Tables core : users, companies, sites
-- ============================================================

-- ------------------------------------------------------------
-- users (miroir de auth.users, alimenté par trigger — voir 0010)
-- ------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  avatar_url text,
  role public.user_role not null default 'client',
  language text not null default 'fr' check (language in ('fr', 'en')),
  mfa_enabled boolean not null default false,
  company_id uuid, -- FK ajoutée après création de companies
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_role on public.users(role);
create index idx_users_company on public.users(company_id);

-- ------------------------------------------------------------
-- companies
-- ------------------------------------------------------------
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  registration_number text,
  tax_id text,
  address text,
  city text,
  phone text,
  email text,
  logo_url text,
  owner_id uuid references public.users(id) on delete set null,
  subscription_plan public.subscription_plan not null default 'basic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add constraint fk_users_company foreign key (company_id) references public.companies(id) on delete set null;

create index idx_companies_owner on public.companies(owner_id);

-- ------------------------------------------------------------
-- sites (un client/entreprise peut avoir plusieurs microgrids)
-- ------------------------------------------------------------
create table public.sites (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  site_type public.site_type not null default 'residentiel',
  address text,
  city text not null default 'Yaoundé',
  latitude double precision,
  longitude double precision,
  installed_capacity_kw numeric(10,2),
  timezone text not null default 'Africa/Douala',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sites_owner on public.sites(owner_id);
create index idx_sites_company on public.sites(company_id);
create index idx_sites_location on public.sites(latitude, longitude);

-- ------------------------------------------------------------
-- site_technicians (assignation technicien <-> site, table de jointure)
-- ------------------------------------------------------------
create table public.site_technicians (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid not null references public.sites(id) on delete cascade,
  technician_id uuid not null references public.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (site_id, technician_id)
);

create index idx_site_technicians_site on public.site_technicians(site_id);
create index idx_site_technicians_tech on public.site_technicians(technician_id);

-- trigger générique updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at before update on public.users
  for each row execute procedure public.set_updated_at();
create trigger trg_companies_updated_at before update on public.companies
  for each row execute procedure public.set_updated_at();
create trigger trg_sites_updated_at before update on public.sites
  for each row execute procedure public.set_updated_at();
