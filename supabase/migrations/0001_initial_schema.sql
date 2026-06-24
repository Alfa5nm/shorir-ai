create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  display_name text,
  language text not null default 'mixed' check (language in ('bn', 'en', 'mixed')),
  goal text not null,
  fitness_level text not null check (fitness_level in ('beginner', 'returning', 'intermediate')),
  equipment text[] not null default '{}',
  weekly_schedule text[] not null default '{}',
  safety jsonb not null default '{"hasPain": false, "painAreas": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  exercise text not null check (exercise in ('squat', 'push-up', 'lunge')),
  duration_seconds integer not null check (duration_seconds >= 0),
  reps_completed integer not null check (reps_completed >= 0),
  confidence_avg numeric not null check (confidence_avg >= 0 and confidence_avg <= 1),
  completion_status text not null check (completion_status in ('completed', 'partial', 'abandoned')),
  safety_flag boolean not null default false,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pose_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.workout_sessions(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'session_started',
      'rep_completed',
      'feedback_given',
      'low_confidence',
      'pain_reported',
      'session_completed'
    )
  ),
  feedback_code text,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.coach_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  summary_bn text not null,
  summary_en text not null,
  next_action text not null,
  form_focus text[] not null default '{}',
  safety_note text not null,
  confidence_level text not null check (confidence_level in ('low', 'medium', 'high')),
  encouragement text not null,
  limitations text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.image_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'uploaded', 'processed', 'expired')),
  upload_url text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.meal_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  image_session_id uuid references public.image_sessions(id) on delete set null,
  probable_dishes text[] not null default '{}',
  confidence_level text not null check (confidence_level in ('low', 'medium', 'high')),
  portion_questions text[] not null default '{}',
  calorie_range text,
  macro_notes text[] not null default '{}',
  profile_signals text[] not null default '{}',
  limitations text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists workout_sessions_profile_id_created_at_idx on public.workout_sessions(profile_id, created_at desc);
create index if not exists pose_events_profile_id_created_at_idx on public.pose_events(profile_id, created_at desc);
create index if not exists pose_events_session_id_idx on public.pose_events(session_id);
create index if not exists coach_reviews_profile_id_created_at_idx on public.coach_reviews(profile_id, created_at desc);
create index if not exists image_sessions_profile_id_created_at_idx on public.image_sessions(profile_id, created_at desc);
create index if not exists meal_reviews_profile_id_created_at_idx on public.meal_reviews(profile_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.pose_events enable row level security;
alter table public.coach_reviews enable row level security;
alter table public.image_sessions enable row level security;
alter table public.meal_reviews enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own workout sessions" on public.workout_sessions;
create policy "Users can read own workout sessions"
on public.workout_sessions
for select
to authenticated
using (exists (select 1 from public.profiles where profiles.id = workout_sessions.profile_id and profiles.user_id = auth.uid()));

drop policy if exists "Users can read own pose events" on public.pose_events;
create policy "Users can read own pose events"
on public.pose_events
for select
to authenticated
using (exists (select 1 from public.profiles where profiles.id = pose_events.profile_id and profiles.user_id = auth.uid()));

drop policy if exists "Users can read own coach reviews" on public.coach_reviews;
create policy "Users can read own coach reviews"
on public.coach_reviews
for select
to authenticated
using (exists (select 1 from public.profiles where profiles.id = coach_reviews.profile_id and profiles.user_id = auth.uid()));

drop policy if exists "Users can read own image sessions" on public.image_sessions;
create policy "Users can read own image sessions"
on public.image_sessions
for select
to authenticated
using (exists (select 1 from public.profiles where profiles.id = image_sessions.profile_id and profiles.user_id = auth.uid()));

drop policy if exists "Users can read own meal reviews" on public.meal_reviews;
create policy "Users can read own meal reviews"
on public.meal_reviews
for select
to authenticated
using (exists (select 1 from public.profiles where profiles.id = meal_reviews.profile_id and profiles.user_id = auth.uid()));
