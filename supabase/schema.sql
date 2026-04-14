-- Genefy v2 — Schema Supabase
-- Execute no SQL Editor do Supabase Dashboard

-- Fazendas
create table if not exists farms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  owner_name text,
  created_at timestamptz default now()
);

-- Touros (catálogo sistema + manuais)
create table if not exists bulls (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id),        -- null = touro CDCB do sistema
  code text not null,
  short_name text,
  full_name text,
  gtpi integer,
  net_merit numeric,
  gfi numeric,
  reliability numeric,
  milk numeric, protein numeric, fat numeric,
  productive_life numeric,
  scs numeric, dpr numeric, hcr numeric, ccr numeric,
  fertility_index numeric,
  ptat numeric, udc numeric, flc numeric,
  feed_saved numeric, cow_livability numeric,
  sire_calving_ease numeric,
  beta_casein text, kappa_casein text,
  hh1 text default 'Free',
  hh2 text default 'Free',
  hh3 text default 'Free',
  hh4 text default 'Free',
  hh5 text default 'Free',
  hh6 text default 'Free',
  price_per_dose numeric,
  is_custom boolean default false,
  source text default 'CDCB',
  created_at timestamptz default now(),
  unique(code)
);

-- Fêmeas do rebanho
create table if not exists females (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) not null,
  animal_id text not null,
  name text,
  breed text default 'HO',
  lact integer default 0,
  ginb numeric,
  net_merit numeric, milk numeric, protein numeric,
  fat numeric, productive_life numeric,
  dpr numeric, fertility_index numeric,
  udc numeric, flc numeric, scs numeric,
  sire_naab text, mgs_naab text, mmgs_naab text,
  dam_id uuid references females(id),
  bdate date,
  genomic boolean default false,
  age integer,
  is_primiparous boolean default false,
  notes text,
  created_at timestamptz default now(),
  unique(farm_id, animal_id)
);

-- Botijão da fazenda
create table if not exists tank_bulls (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) not null,
  bull_id uuid references bulls(id) not null,
  doses integer,
  price_per_dose numeric,
  created_at timestamptz default now(),
  unique(farm_id, bull_id)
);

-- Acasalamentos (histórico)
create table if not exists matings (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) not null,
  female_id uuid references females(id) not null,
  bull_id uuid references bulls(id) not null,
  option_rank integer default 1,
  score numeric,
  inbreeding_pct numeric,
  is_sexed_semen boolean default false,
  status text default 'planned'
    check (status in ('planned','executed','confirmed_pregnant','failed')),
  mating_date date,
  notes text,
  created_at timestamptz default now()
);

-- Presets de pesos
create table if not exists weight_presets (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) not null,
  name text not null,
  weights jsonb not null,
  created_at timestamptz default now(),
  unique(farm_id, name)
);

-- Índices para performance
create index if not exists idx_females_farm_id on females(farm_id);
create index if not exists idx_bulls_farm_id on bulls(farm_id);
create index if not exists idx_matings_farm_id on matings(farm_id);
create index if not exists idx_matings_female_id on matings(female_id);
create index if not exists idx_tank_bulls_farm_id on tank_bulls(farm_id);

-- RLS (Row Level Security) — habilitar para produção
-- alter table farms enable row level security;
-- alter table females enable row level security;
-- alter table bulls enable row level security;
-- alter table tank_bulls enable row level security;
-- alter table matings enable row level security;
-- alter table weight_presets enable row level security;
