-- =============================================================================
-- Fennec Club - Database Schema (self-hosted PostgreSQL)
-- Run this file once against your own PostgreSQL database, e.g.:
--   psql "$DATABASE_URL" -f database/schema.sql
--
-- This schema is fully self-contained: authentication (password hashes, JWTs)
-- is handled entirely by the Express backend, not by any external service.
-- Safe to re-run: uses IF NOT EXISTS / DROP ... IF EXISTS guards where useful.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions (gen_random_uuid())
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'coach', 'parent');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'gender_type') then
    create type gender_type as enum ('male', 'female');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type attendance_status as enum ('present', 'absent');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- profiles
-- One row per login account (both admins and coaches), including the
-- password hash. Role-specific detail lives in admins / coaches.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  role user_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_is_active on public.profiles(is_active);

-- -----------------------------------------------------------------------------
-- admins
-- -----------------------------------------------------------------------------
create table if not exists public.admins (
  id uuid primary key references public.profiles(id) on delete cascade,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- coaches
-- -----------------------------------------------------------------------------
create table if not exists public.coaches (
  id uuid primary key references public.profiles(id) on delete cascade,
  phone text,
  specialty text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- parents
-- Portal accounts for a child's parent/guardian. Created by an admin, same
-- as coaches - no self-registration.
-- -----------------------------------------------------------------------------
create table if not exists public.parents (
  id uuid primary key references public.profiles(id) on delete cascade,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- coach_categories
-- -----------------------------------------------------------------------------
create table if not exists public.coach_categories (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (coach_id, category_id)
);

create index if not exists idx_coach_categories_coach on public.coach_categories(coach_id);
create index if not exists idx_coach_categories_category on public.coach_categories(category_id);

-- -----------------------------------------------------------------------------
-- athletes
-- -----------------------------------------------------------------------------
create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  gender gender_type not null,
  phone_number text,
  guardian_name text not null,
  guardian_phone text not null,
  address text,
  registration_date date not null default current_date,
  category_id uuid references public.categories(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_athlete_dob check (date_of_birth <= current_date),
  constraint chk_guardian_phone_format check (guardian_phone ~ '^[0-9]{10}$'),
  constraint chk_athlete_phone_format check (phone_number is null or phone_number ~ '^[0-9]{10}$')
);

create index if not exists idx_athletes_category on public.athletes(category_id);
create index if not exists idx_athletes_is_active on public.athletes(is_active);
create index if not exists idx_athletes_last_name on public.athletes(last_name);

-- -----------------------------------------------------------------------------
-- parent_athletes
-- Many-to-many: a parent can be linked to more than one athlete (siblings in
-- the same club), and an athlete can have more than one linked parent
-- (e.g. both mother and father).
-- -----------------------------------------------------------------------------
create table if not exists public.parent_athletes (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, athlete_id)
);

create index if not exists idx_parent_athletes_parent on public.parent_athletes(parent_id);
create index if not exists idx_parent_athletes_athlete on public.parent_athletes(athlete_id);


-- -----------------------------------------------------------------------------
-- session_types
-- Managed entirely by the admin, same pattern as categories - not hard-coded,
-- so new types (beyond the starter set) can be added without a code change.
-- -----------------------------------------------------------------------------
create table if not exists public.session_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_session_types_order on public.session_types(display_order);

-- -----------------------------------------------------------------------------
-- attendance_sessions
-- -----------------------------------------------------------------------------
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  session_date date not null default current_date,
  coach_id uuid not null references public.coaches(id) on delete restrict,
  -- Nullable so existing sessions created before this feature don't break;
  -- the application layer requires it for newly created sessions.
  session_type_id uuid references public.session_types(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_attendance_sessions_category on public.attendance_sessions(category_id);
create index if not exists idx_attendance_sessions_coach on public.attendance_sessions(coach_id);
create index if not exists idx_attendance_sessions_date on public.attendance_sessions(session_date);
create index if not exists idx_attendance_sessions_type on public.attendance_sessions(session_type_id);

-- -----------------------------------------------------------------------------
-- attendance_session_coaches
-- Records additional coaches present for a session beyond the one who
-- created it (attendance_sessions.coach_id). Purely a record of who was
-- there - it does not grant additional coaches edit rights over the session;
-- only the creating coach and admins can edit, same as before.
-- -----------------------------------------------------------------------------
create table if not exists public.attendance_session_coaches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (session_id, coach_id)
);

create index if not exists idx_session_coaches_session on public.attendance_session_coaches(session_id);
create index if not exists idx_session_coaches_coach on public.attendance_session_coaches(coach_id);

-- -----------------------------------------------------------------------------
-- attendance_records
-- -----------------------------------------------------------------------------
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  status attendance_status not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, athlete_id)
);

create index if not exists idx_attendance_records_session on public.attendance_records(session_id);
create index if not exists idx_attendance_records_athlete on public.attendance_records(athlete_id);

-- -----------------------------------------------------------------------------
-- document_folders
-- -----------------------------------------------------------------------------
create table if not exists public.document_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_document_folders_order on public.document_folders(display_order);

-- -----------------------------------------------------------------------------
-- document_requirements
-- -----------------------------------------------------------------------------
create table if not exists public.document_requirements (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.document_folders(id) on delete cascade,
  name text not null,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (folder_id, name)
);

create index if not exists idx_document_requirements_folder on public.document_requirements(folder_id);
create index if not exists idx_document_requirements_order on public.document_requirements(display_order);

-- -----------------------------------------------------------------------------
-- athlete_document_status
-- -----------------------------------------------------------------------------
create table if not exists public.athlete_document_status (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  document_requirement_id uuid not null references public.document_requirements(id) on delete cascade,
  is_received boolean not null default false,
  marked_by uuid references public.coaches(id) on delete set null,
  marked_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, document_requirement_id)
);

create index if not exists idx_ads_athlete on public.athlete_document_status(athlete_id);
create index if not exists idx_ads_document on public.athlete_document_status(document_requirement_id);
create index if not exists idx_ads_is_received on public.athlete_document_status(is_received);

-- =============================================================================
-- updated_at auto-update trigger
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles','admins','coaches','parents','categories','athletes',
      'attendance_sessions','attendance_records','session_types',
      'document_folders','document_requirements','athlete_document_status'
    ])
  loop
    execute format(
      'drop trigger if exists trg_set_updated_at on public.%I;
       create trigger trg_set_updated_at
       before update on public.%I
       for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- =============================================================================
-- Access control note
-- =============================================================================
-- This schema intentionally has NO Row Level Security policies. Unlike a
-- Supabase/PostgREST setup where the database is queried directly from the
-- browser, this app's Express backend is the only thing that ever talks to
-- Postgres (using a single trusted connection from DATABASE_URL). Every
-- authentication check and role-based access rule lives in the Express
-- middleware and services (see server/src/middleware/auth.js and the
-- server/src/services/*.js files) rather than in the database itself.
--
-- No seed rows are inserted for categories, folders, or documents: the admin
-- creates these through the application, per the "do not hard-code" requirement.
--
-- To create the FIRST admin account, run from the server/ directory:
--   npm run create-admin -- --email=admin@example.com --password=YourStrongPassword --name="Head Admin"
-- See README.md for details.

-- =============================================================================
-- End of schema
-- =============================================================================
