alter table public.profiles
  add column if not exists height numeric,
  add column if not exists weight numeric,
  add column if not exists target_weight numeric,
  add column if not exists age integer,
  add column if not exists gender text check (gender is null or gender in ('male', 'female', 'other'));
