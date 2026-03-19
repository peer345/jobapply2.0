-- Seed source_capabilities for JobMatch AI

insert into public.source_capabilities
  (source, fetch_supported, auto_apply_supported, requires_connected_account, apply_method, category, supports_opportunity_type, description)
values
  -- Direct Auto Apply
  ('Lever', true, true, false, 'direct', 'Direct Apply', 'both', 'Direct auto-apply supported for Lever-hosted opportunities.'),
  ('Greenhouse', true, true, false, 'direct', 'Direct Apply', 'both', 'Direct auto-apply supported for Greenhouse-hosted opportunities.'),

  -- Partial / Later
  ('Ashby', true, false, false, 'partial', 'Coming Soon', 'both', 'Fetch supported; auto-apply coming later.'),
  ('SmartRecruiters', true, false, false, 'partial', 'Coming Soon', 'both', 'Fetch supported; auto-apply coming later.'),
  ('Workable', true, false, false, 'partial', 'Coming Soon', 'both', 'Fetch supported; auto-apply coming later.'),

  -- Account Required / Fetch Only
  ('LinkedIn', true, false, true, 'account_required', 'Account Required', 'both', 'Requires connected account; fetch-only for now.'),
  ('Internshala', true, false, true, 'account_required', 'Account Required', 'internship', 'Requires connected account; internships focused.'),
  ('Naukri', true, false, true, 'account_required', 'Account Required', 'full-time', 'Requires connected account; jobs focused.'),
  ('Foundit', true, false, true, 'account_required', 'Account Required', 'both', 'Requires connected account; fetch-only for now.'),
  ('Jobvite', true, false, true, 'account_required', 'Account Required', 'both', 'Requires connected account; fetch-only for now.'),
  ('iCIMS', true, false, true, 'account_required', 'Account Required', 'both', 'Requires connected account; fetch-only for now.')
on conflict (source) do update set
  fetch_supported = excluded.fetch_supported,
  auto_apply_supported = excluded.auto_apply_supported,
  requires_connected_account = excluded.requires_connected_account,
  apply_method = excluded.apply_method,
  category = excluded.category,
  supports_opportunity_type = excluded.supports_opportunity_type,
  description = excluded.description,
  updated_at = now();

