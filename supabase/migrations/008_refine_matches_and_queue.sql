-- 008_refine_matches_and_queue.sql
-- Formally confirm schema requirements per user instructions

DO $$ 
BEGIN
  -- 1. Ensure jobs.opportunity_type exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'opportunity_type') THEN
    ALTER TABLE public.jobs ADD COLUMN opportunity_type text NOT NULL DEFAULT 'full-time';
  END IF;

  -- 2. Refine job_matches
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_matches' AND column_name = 'fit_level') THEN
    ALTER TABLE public.job_matches ADD COLUMN fit_level text; -- values: strong, good, fair, low
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_matches' AND column_name = 'status') THEN
    ALTER TABLE public.job_matches ADD COLUMN status text DEFAULT 'pending';
  END IF;

  -- 3. Ensure queue_items table
  CREATE TABLE IF NOT EXISTS public.queue_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    priority int NOT NULL DEFAULT 100,
    status text NOT NULL DEFAULT 'queued',
    scheduled_for timestamptz,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT queue_items_user_job_unique UNIQUE (user_id, job_id)
  );

  -- Ensure RLS on queue_items
  ALTER TABLE public.queue_items ENABLE ROW LEVEL SECURITY;

  -- Ensure policy on queue_items
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'queue_items_crud_own') THEN
    CREATE POLICY queue_items_crud_own ON public.queue_items
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

END $$;
