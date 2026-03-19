-- Patch migration: run this if you already applied 001_init.sql and need to align
-- the existing schema with the corrected column names.

-- 1. Rename file_url → file_path in resumes table
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'resumes'
      and column_name = 'file_url'
  ) then
    alter table public.resumes rename column file_url to file_path;
  end if;
end $$;

-- 2. Add experience_level to preferences table if missing
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'preferences'
      and column_name = 'experience_level'
  ) then
    alter table public.preferences
      add column experience_level text not null default 'Junior';
  end if;
end $$;
