-- KAIROS · Migración inicial (Paso 2 del README)
-- Pégalo entero en Supabase → SQL Editor → Run.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  track text not null default 'CF' check (track in ('CF','HX')),
  level text not null default 'RX',
  pending_track text,
  stripe_customer_id text,
  sub_status text default 'trialing',
  current_period_end timestamptz,
  created_at timestamptz default now()
);

create table cycles (
  id uuid primary key default gen_random_uuid(),
  track text not null check (track in ('CF','HX')),
  name text not null,
  week_count int not null,
  goal text
);

create table weeks (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid references cycles on delete cascade,
  number int not null,
  status text default 'draft' check (status in ('draft','published'))
);

create table days (
  id uuid primary key default gen_random_uuid(),
  week_id uuid references weeks on delete cascade,
  dow int not null check (dow between 1 and 6),
  focus text,
  why text
);

create table blocks (
  id uuid primary key default gen_random_uuid(),
  day_id uuid references days on delete cascade,
  position int not null,
  tag text not null check (tag in ('NUCLEO','COMPLEMENTARIO','EXTRA')),
  format text not null,
  name text,
  scheme text,
  note text,
  log_type text check (log_type in ('peso','tiempo','rondas'))
);

create table block_lines (
  id uuid primary key default gen_random_uuid(),
  block_id uuid references blocks on delete cascade,
  position int not null,
  content jsonb not null,
  patterns text[] default '{}'
);

create table substitution_rules (
  id uuid primary key default gen_random_uuid(),
  pattern text not null,
  zone text not null,
  severity text not null check (severity in ('final','carga')),
  substitute text not null,
  note text
);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  day_id uuid references days,
  duration text not null check (duration in ('1h','2h')),
  pains jsonb default '[]',
  created_at timestamptz default now()
);

create table session_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  block_id uuid references blocks on delete cascade,
  done boolean default false,
  value text,
  comment text,
  created_at timestamptz default now(),
  unique (user_id, block_id)
);

-- RLS
alter table profiles enable row level security;
alter table checkins enable row level security;
alter table session_logs enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own checkins" on checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own logs" on session_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- La programación publicada y las reglas son de lectura para usuarios autenticados
alter table cycles enable row level security;
alter table weeks enable row level security;
alter table days enable row level security;
alter table blocks enable row level security;
alter table block_lines enable row level security;
alter table substitution_rules enable row level security;

create policy "read cycles" on cycles for select using (auth.role() = 'authenticated');
create policy "read published weeks" on weeks for select using (status = 'published');
create policy "read days" on days for select using (auth.role() = 'authenticated');
create policy "read blocks" on blocks for select using (auth.role() = 'authenticated');
create policy "read lines" on block_lines for select using (auth.role() = 'authenticated');
create policy "read rules" on substitution_rules for select using (auth.role() = 'authenticated');
