-- Genefy v2 — Beef on Dairy Migration
-- Adiciona suporte a touros de corte e estrategia de rebanho

-- 1. Adicionar campos em bulls
ALTER TABLE bulls ADD COLUMN IF NOT EXISTS bull_type TEXT DEFAULT 'dairy';
ALTER TABLE bulls ADD COLUMN IF NOT EXISTS beef_traits JSONB;

-- 2. Atualizar touros existentes em massa
UPDATE bulls SET bull_type = 'dairy' WHERE bull_type IS NULL;

-- 3. Tabela de estrategia de rebanho
CREATE TABLE IF NOT EXISTS herd_strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,

  -- Parametros do rebanho
  total_cows INTEGER NOT NULL DEFAULT 100,
  current_daily_milk_liters NUMERIC NOT NULL DEFAULT 0,
  target_daily_milk_liters NUMERIC NOT NULL DEFAULT 0,
  replacement_rate_pct NUMERIC NOT NULL DEFAULT 30,

  -- Mortalidade
  calf_mortality_pct NUMERIC NOT NULL DEFAULT 5,
  heifer_mortality_pct NUMERIC NOT NULL DEFAULT 3,
  cow_mortality_pct NUMERIC NOT NULL DEFAULT 2,

  -- Reprodutivos
  conception_rate_pct NUMERIC NOT NULL DEFAULT 50,
  calving_interval_days INTEGER NOT NULL DEFAULT 400,
  age_first_calving_months INTEGER NOT NULL DEFAULT 26,

  -- Economicos (BRL)
  milk_price_per_liter NUMERIC NOT NULL DEFAULT 2.80,
  heifer_sale_price NUMERIC NOT NULL DEFAULT 4500,
  beef_calf_sale_price NUMERIC NOT NULL DEFAULT 1200,
  dairy_calf_sale_price NUMERIC NOT NULL DEFAULT 150,
  heifer_raising_cost NUMERIC NOT NULL DEFAULT 3200,

  -- Limiares de merito
  elite_percentile NUMERIC NOT NULL DEFAULT 25,
  mid_percentile NUMERIC NOT NULL DEFAULT 60,
  max_sexed_inseminations INTEGER NOT NULL DEFAULT 3,

  -- Custos de semen (JSONB)
  semen_costs JSONB NOT NULL DEFAULT '{"sexed_premium":85,"sexed_budget":45,"conventional":25,"beef":40}',

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farm_id)
);

-- 4. Tabela de classificacao de femeas
CREATE TABLE IF NOT EXISTS female_semen_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  female_id UUID REFERENCES females(id) ON DELETE CASCADE,

  assignment_group TEXT NOT NULL,
  merit_rank INTEGER,
  merit_percentile NUMERIC,
  composite_merit_score NUMERIC,
  recommended_semen_type TEXT,
  insemination_order INTEGER DEFAULT 1,
  economic_value_brl NUMERIC,

  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farm_id, female_id)
);

-- 5. Indices de performance
CREATE INDEX IF NOT EXISTS idx_herd_strategy_farm_id ON herd_strategy(farm_id);
CREATE INDEX IF NOT EXISTS idx_female_assignments_farm_id ON female_semen_assignments(farm_id);
CREATE INDEX IF NOT EXISTS idx_female_assignments_female_id ON female_semen_assignments(female_id);
CREATE INDEX IF NOT EXISTS idx_bulls_bull_type ON bulls(bull_type);

-- 6. RLS para herd_strategy
ALTER TABLE herd_strategy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "herd_strategy: select policy" ON public.herd_strategy;
DROP POLICY IF EXISTS "herd_strategy: insert policy" ON public.herd_strategy;
DROP POLICY IF EXISTS "herd_strategy: update policy" ON public.herd_strategy;
DROP POLICY IF EXISTS "herd_strategy: delete policy" ON public.herd_strategy;

CREATE POLICY "herd_strategy: select policy" ON public.herd_strategy
  FOR SELECT USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "herd_strategy: insert policy" ON public.herd_strategy
  FOR INSERT WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "herd_strategy: update policy" ON public.herd_strategy
  FOR UPDATE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "herd_strategy: delete policy" ON public.herd_strategy
  FOR DELETE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

-- 7. RLS para female_semen_assignments
ALTER TABLE female_semen_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "female_semen_assignments: select policy" ON public.female_semen_assignments;
DROP POLICY IF EXISTS "female_semen_assignments: insert policy" ON public.female_semen_assignments;
DROP POLICY IF EXISTS "female_semen_assignments: update policy" ON public.female_semen_assignments;
DROP POLICY IF EXISTS "female_semen_assignments: delete policy" ON public.female_semen_assignments;

CREATE POLICY "female_semen_assignments: select policy" ON public.female_semen_assignments
  FOR SELECT USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "female_semen_assignments: insert policy" ON public.female_semen_assignments
  FOR INSERT WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "female_semen_assignments: update policy" ON public.female_semen_assignments
  FOR UPDATE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "female_semen_assignments: delete policy" ON public.female_semen_assignments
  FOR DELETE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));
