-- Final sync for end-to-end migration
-- Align preferences and jobs with real schema requirements

DO $$ 
BEGIN
  -- 1. Preferences table updates
  -- target_roles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'target_roles') THEN
    ALTER TABLE public.preferences ADD COLUMN target_roles text[] NOT NULL DEFAULT '{}';
    -- Copy data if possible
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'preferred_roles') THEN
      UPDATE public.preferences SET target_roles = preferred_roles;
    END IF;
  END IF;

  -- target_skills
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'target_skills') THEN
    ALTER TABLE public.preferences ADD COLUMN target_skills text[] NOT NULL DEFAULT '{}';
  END IF;

  -- preferred_sources
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'preferred_sources') THEN
    ALTER TABLE public.preferences ADD COLUMN preferred_sources text[] NOT NULL DEFAULT '{}';
    -- Copy data if possible
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'preferred_platforms') THEN
      UPDATE public.preferences SET preferred_sources = preferred_platforms;
    END IF;
  END IF;

  -- remote_ok, onsite_ok, hybrid_ok
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'remote_ok') THEN
    ALTER TABLE public.preferences ADD COLUMN remote_ok boolean NOT NULL DEFAULT true;
    ALTER TABLE public.preferences ADD COLUMN onsite_ok boolean NOT NULL DEFAULT false;
    ALTER TABLE public.preferences ADD COLUMN hybrid_ok boolean NOT NULL DEFAULT false;
  END IF;

  -- job_types, internship_types
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'job_types') THEN
    ALTER TABLE public.preferences ADD COLUMN job_types text[] NOT NULL DEFAULT '{"full-time"}';
    ALTER TABLE public.preferences ADD COLUMN internship_types text[] NOT NULL DEFAULT '{}';
  END IF;

  -- account_required_ok
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'account_required_ok') THEN
    ALTER TABLE public.preferences ADD COLUMN account_required_ok boolean NOT NULL DEFAULT true;
  END IF;

  -- 2. Cleanup old columns in preferences (Careful: only if they exist)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'preferred_roles') THEN
    ALTER TABLE public.preferences DROP COLUMN preferred_roles;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'preferred_platforms') THEN
    ALTER TABLE public.preferences DROP COLUMN preferred_platforms;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'work_modes') THEN
    ALTER TABLE public.preferences DROP COLUMN work_modes;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'daily_apply_limit') THEN
    ALTER TABLE public.preferences DROP COLUMN daily_apply_limit;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'opportunity_type') THEN
    ALTER TABLE public.preferences DROP COLUMN opportunity_type;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'experience_level') THEN
    ALTER TABLE public.preferences DROP COLUMN experience_level;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preferences' AND column_name = 'blacklisted_companies') THEN
    ALTER TABLE public.preferences DROP COLUMN blacklisted_companies;
  END IF;

  -- 3. Sync source_name in jobs (Already handled by 006 but ensuring uniqueness)
  -- Ensure unique constraint is using source_name
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'source_name') THEN
     -- Drop old constraint if it exists with old name
     ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_source_external_unique;
     -- Ensure new constraint
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_source_name_external_unique') THEN
        ALTER TABLE public.jobs ADD CONSTRAINT jobs_source_name_external_unique UNIQUE (source_name, external_job_id);
     END IF;
  END IF;

END $$;
