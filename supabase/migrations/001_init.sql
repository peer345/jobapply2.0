-- JobMatch AI - initial schema (tables + RLS + seed-safe helpers)
-- Apply in Supabase SQL editor or via Supabase CLI migrations.

create extension if not exists "pgcrypto";

-- ===== helpers =====
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===== 1) profiles =====
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  current_city text,
  preferred_city text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  experience_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

-- ===== 2) resumes =====
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  original_text text,
  resume_meta jsonb,
  is_primary boolean not null default false,
  ats_score int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists resumes_user_id_idx on public.resumes(user_id);

drop trigger if exists resumes_updated_at on public.resumes;
create trigger resumes_updated_at
before update on public.resumes
for each row execute function public.handle_updated_at();

-- ensure at most one active resume per user
create unique index if not exists resumes_one_active_per_user
on public.resumes(user_id)
where (is_primary);

-- ===== 3) preferences =====
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preferred_roles text[] not null default '{}',
  preferred_locations text[] not null default '{}',
  work_modes text[] not null default '{}',
  min_match_score int not null default 60,
  daily_apply_limit int not null default 25,
  preferred_platforms text[] not null default '{}',
  blacklisted_companies text[] not null default '{}',
  automation_enabled boolean not null default true,
  direct_apply_only boolean not null default false,
  opportunity_type text not null default 'both',
  experience_level text not null default 'Junior',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists preferences_user_id_idx on public.preferences(user_id);

drop trigger if exists preferences_updated_at on public.preferences;
create trigger preferences_updated_at
before update on public.preferences
for each row execute function public.handle_updated_at();

-- ===== 4) answer_bank =====
create table if not exists public.answer_bank (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notice_period text,
  work_authorization text,
  sponsorship_needed text,
  willing_to_relocate text,
  expected_salary text,
  expected_stipend text,
  years_of_experience text,
  portfolio_link text,
  linkedin_url text,
  github_url text,
  current_city text,
  preferred_city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists answer_bank_user_id_idx on public.answer_bank(user_id);

drop trigger if exists answer_bank_updated_at on public.answer_bank;
create trigger answer_bank_updated_at
before update on public.answer_bank
for each row execute function public.handle_updated_at();

-- ===== 5) jobs =====
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_job_id text,
  title text not null,
  company text not null,
  location text,
  work_mode text,
  description text,
  apply_url text,
  posted_at timestamptz,
  opportunity_type text not null default 'full-time',
  source_capabilities jsonb,
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_source_external_unique unique (source, external_job_id)
);
create index if not exists jobs_source_idx on public.jobs(source);
create index if not exists jobs_posted_at_idx on public.jobs(posted_at desc);
create index if not exists jobs_opportunity_type_idx on public.jobs(opportunity_type);

drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at
before update on public.jobs
for each row execute function public.handle_updated_at();

-- ===== 6) job_matches =====
create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  match_score int not null,
  score_breakdown jsonb,
  missing_skills text[] not null default '{}',
  missing_keywords text[] not null default '{}',
  reasons text[] not null default '{}',
  compatibility_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_matches_user_job_unique unique (user_id, job_id)
);
create index if not exists job_matches_user_id_idx on public.job_matches(user_id);
create index if not exists job_matches_job_id_idx on public.job_matches(job_id);
create index if not exists job_matches_score_idx on public.job_matches(match_score desc);

drop trigger if exists job_matches_updated_at on public.job_matches;
create trigger job_matches_updated_at
before update on public.job_matches
for each row execute function public.handle_updated_at();

-- ===== 7) applications =====
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  status text not null default 'applied',
  platform text,
  applied_at timestamptz,
  failure_reason text,
  attempt_count int not null default 1,
  result_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists applications_user_id_idx on public.applications(user_id);
create index if not exists applications_job_id_idx on public.applications(job_id);

drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at
before update on public.applications
for each row execute function public.handle_updated_at();

-- ===== 8) queue_items =====
create table if not exists public.queue_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  priority int not null default 100,
  status text not null default 'queued',
  scheduled_for timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint queue_items_user_job_unique unique (user_id, job_id)
);
create index if not exists queue_items_user_id_idx on public.queue_items(user_id);
create index if not exists queue_items_status_idx on public.queue_items(status);

drop trigger if exists queue_items_updated_at on public.queue_items;
create trigger queue_items_updated_at
before update on public.queue_items
for each row execute function public.handle_updated_at();

-- ===== 9) connected_sources =====
create table if not exists public.connected_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  is_connected boolean not null default false,
  last_synced_at timestamptz,
  connection_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connected_sources_user_source_unique unique (user_id, source)
);
create index if not exists connected_sources_user_id_idx on public.connected_sources(user_id);

drop trigger if exists connected_sources_updated_at on public.connected_sources;
create trigger connected_sources_updated_at
before update on public.connected_sources
for each row execute function public.handle_updated_at();

-- ===== 10) automation_logs =====
create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  stage text,
  level text not null default 'info',
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists automation_logs_user_id_idx on public.automation_logs(user_id);
create index if not exists automation_logs_created_at_idx on public.automation_logs(created_at desc);

-- ===== 11) source_capabilities =====
create table if not exists public.source_capabilities (
  id uuid primary key default gen_random_uuid(),
  source text not null unique,
  fetch_supported boolean not null default false,
  auto_apply_supported boolean not null default false,
  requires_connected_account boolean not null default false,
  apply_method text,
  description text,
  category text,
  supports_opportunity_type text not null default 'both',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists source_capabilities_updated_at on public.source_capabilities;
create trigger source_capabilities_updated_at
before update on public.source_capabilities
for each row execute function public.handle_updated_at();

-- ===== 12) ats_reports =====
create table if not exists public.ats_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  overall_score int not null,
  formatting_score int,
  keyword_score int,
  readability_score int,
  section_completeness_score int,
  role_relevance_score int,
  issues jsonb,
  suggestions jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ats_reports_user_id_idx on public.ats_reports(user_id);
create index if not exists ats_reports_resume_id_idx on public.ats_reports(resume_id);

drop trigger if exists ats_reports_updated_at on public.ats_reports;
create trigger ats_reports_updated_at
before update on public.ats_reports
for each row execute function public.handle_updated_at();

-- ===== 13) resume_optimizations =====
create table if not exists public.resume_optimizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  optimized_summary text,
  missing_keywords text[] not null default '{}',
  rewritten_bullets jsonb,
  section_suggestions jsonb,
  improvement_tips jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists resume_optimizations_user_id_idx on public.resume_optimizations(user_id);
create index if not exists resume_optimizations_resume_id_idx on public.resume_optimizations(resume_id);
create index if not exists resume_optimizations_job_id_idx on public.resume_optimizations(job_id);

drop trigger if exists resume_optimizations_updated_at on public.resume_optimizations;
create trigger resume_optimizations_updated_at
before update on public.resume_optimizations
for each row execute function public.handle_updated_at();

-- ===== automatic profile bootstrap on signup =====
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email)
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ===== RLS =====
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.preferences enable row level security;
alter table public.answer_bank enable row level security;
alter table public.job_matches enable row level security;
alter table public.applications enable row level security;
alter table public.queue_items enable row level security;
alter table public.connected_sources enable row level security;
alter table public.automation_logs enable row level security;
alter table public.ats_reports enable row level security;
alter table public.resume_optimizations enable row level security;

-- jobs + source_capabilities are global read (not user-specific)
alter table public.jobs enable row level security;
alter table public.source_capabilities enable row level security;

-- ===== policies (user-scoped tables) =====
-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- resumes
drop policy if exists "resumes_crud_own" on public.resumes;
create policy "resumes_crud_own"
on public.resumes
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- preferences
drop policy if exists "preferences_crud_own" on public.preferences;
create policy "preferences_crud_own"
on public.preferences
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- answer_bank
drop policy if exists "answer_bank_crud_own" on public.answer_bank;
create policy "answer_bank_crud_own"
on public.answer_bank
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- job_matches
drop policy if exists "job_matches_crud_own" on public.job_matches;
create policy "job_matches_crud_own"
on public.job_matches
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- applications
drop policy if exists "applications_crud_own" on public.applications;
create policy "applications_crud_own"
on public.applications
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- queue_items
drop policy if exists "queue_items_crud_own" on public.queue_items;
create policy "queue_items_crud_own"
on public.queue_items
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- connected_sources
drop policy if exists "connected_sources_crud_own" on public.connected_sources;
create policy "connected_sources_crud_own"
on public.connected_sources
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- automation_logs
drop policy if exists "automation_logs_crud_own" on public.automation_logs;
create policy "automation_logs_crud_own"
on public.automation_logs
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ats_reports
drop policy if exists "ats_reports_crud_own" on public.ats_reports;
create policy "ats_reports_crud_own"
on public.ats_reports
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- resume_optimizations
drop policy if exists "resume_optimizations_crud_own" on public.resume_optimizations;
create policy "resume_optimizations_crud_own"
on public.resume_optimizations
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ===== policies (global tables) =====
-- jobs: authenticated read, service-role write via Edge Functions
drop policy if exists "jobs_read_auth" on public.jobs;
create policy "jobs_read_auth"
on public.jobs for select
to authenticated
using (true);

-- source_capabilities: public read
drop policy if exists "source_capabilities_read_all" on public.source_capabilities;
create policy "source_capabilities_read_all"
on public.source_capabilities for select
using (true);

