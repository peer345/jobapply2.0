-- Rename source to source_name in jobs table and related tables for consistency
DO $$ 
BEGIN
  -- 1. Rename in jobs table
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'source') THEN
    ALTER TABLE public.jobs RENAME COLUMN source TO source_name;
  END IF;

  -- 2. Rename in source_capabilities table
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'source_capabilities' AND column_name = 'source') THEN
    ALTER TABLE public.source_capabilities RENAME COLUMN source TO source_name;
  END IF;

  -- 3. Rename in connected_sources table
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'connected_sources' AND column_name = 'source') THEN
    ALTER TABLE public.connected_sources RENAME COLUMN source TO source_name;
  END IF;

  -- 4. Update unique constraint on jobs
  -- The constraint jobs_source_external_unique depends on the column name. 
  -- In PostgreSQL, when a column is renamed, the constraint automatically points to the new name.
END $$;
