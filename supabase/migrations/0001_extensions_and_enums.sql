-- ============================================================
-- Smart SolarNet — Migration 0001
-- Extensions PostgreSQL + types énumérés
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "postgis"; -- pour la carte multi-sites (lat/lng, distances)

-- Rôles utilisateurs
create type public.user_role as enum (
  'client',
  'pme',
  'installateur',
  'technicien',
  'support',
  'admin',
  'super_admin'
);

-- Types de sites
create type public.site_type as enum (
  'residentiel',
  'pme',
  'ecole',
  'centre_sante',
  'collectivite',
  'entreprise',
  'autre'
);

-- Sources d'énergie
create type public.energy_source_type as enum (
  'solaire',
  'eolienne',
  'eneo',
  'groupe_electrogene',
  'batterie',
  'hydraulique',
  'biomasse'
);

-- Niveaux de priorité des charges
create type public.load_priority as enum (
  'critique',
  'important',
  'normal',
  'secondaire'
);

-- Sévérité des alertes
create type public.alert_severity as enum (
  'info',
  'avertissement',
  'critique',
  'urgence'
);

-- Statuts génériques
create type public.subscription_plan as enum ('basic', 'pro', 'enterprise');
create type public.subscription_status as enum ('actif', 'suspendu', 'resilie', 'essai');
create type public.invoice_status as enum ('en_attente', 'payee', 'en_retard', 'annulee');
create type public.payment_method as enum ('mtn_momo', 'orange_money', 'carte_bancaire', 'virement');
create type public.payment_status as enum ('en_attente', 'reussi', 'echoue', 'rembourse');
create type public.order_status as enum ('en_attente', 'confirmee', 'expediee', 'livree', 'annulee');
create type public.ticket_status as enum ('ouvert', 'en_cours', 'resolu', 'ferme');
create type public.ticket_priority as enum ('basse', 'normale', 'haute', 'urgente');
create type public.device_status as enum ('en_ligne', 'hors_ligne', 'en_panne', 'maintenance');
