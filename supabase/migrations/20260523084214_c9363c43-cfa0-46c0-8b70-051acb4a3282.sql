
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "Profiles insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "Profiles update own" on public.profiles for update using (auth.uid() = id);

-- Habits
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  emoji text not null default '✨',
  color text not null default '#10b981',
  category text not null default 'General',
  frequency text not null default 'daily',
  weekly_target int not null default 7,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.habits enable row level security;
create policy "Habits own all" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.habits(user_id);

-- Habit completions
create table public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  status text not null default 'done', -- 'done' | 'skipped'
  note text,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);
alter table public.habit_completions enable row level security;
create policy "Completions own all" on public.habit_completions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.habit_completions(user_id, date);

-- Notes
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  tags text[] not null default '{}',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.notes enable row level security;
create policy "Notes own all" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.notes(user_id);

-- Skating sessions
create table public.skating_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null default current_date,
  duration_min int not null default 60,
  intensity int not null default 3, -- 1..5
  session_type text not null default 'Tecnica',
  notes text,
  created_at timestamptz not null default now()
);
alter table public.skating_sessions enable row level security;
create policy "Skating own all" on public.skating_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.skating_sessions(user_id, date);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
