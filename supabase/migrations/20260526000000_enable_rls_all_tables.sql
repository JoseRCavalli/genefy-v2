-- 1. Add owner_id to farms table
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users ON DELETE SET NULL;

-- 2. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.females ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tank_bulls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_presets ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any to avoid errors when re-running
DROP POLICY IF EXISTS "farms: select policy" ON public.farms;
DROP POLICY IF EXISTS "farms: insert policy" ON public.farms;
DROP POLICY IF EXISTS "farms: update policy" ON public.farms;
DROP POLICY IF EXISTS "farms: delete policy" ON public.farms;

DROP POLICY IF EXISTS "females: select policy" ON public.females;
DROP POLICY IF EXISTS "females: insert policy" ON public.females;
DROP POLICY IF EXISTS "females: update policy" ON public.females;
DROP POLICY IF EXISTS "females: delete policy" ON public.females;

DROP POLICY IF EXISTS "bulls: select policy" ON public.bulls;
DROP POLICY IF EXISTS "bulls: insert policy" ON public.bulls;
DROP POLICY IF EXISTS "bulls: update policy" ON public.bulls;
DROP POLICY IF EXISTS "bulls: delete policy" ON public.bulls;

DROP POLICY IF EXISTS "tank_bulls: select policy" ON public.tank_bulls;
DROP POLICY IF EXISTS "tank_bulls: insert policy" ON public.tank_bulls;
DROP POLICY IF EXISTS "tank_bulls: update policy" ON public.tank_bulls;
DROP POLICY IF EXISTS "tank_bulls: delete policy" ON public.tank_bulls;

DROP POLICY IF EXISTS "matings: select policy" ON public.matings;
DROP POLICY IF EXISTS "matings: insert policy" ON public.matings;
DROP POLICY IF EXISTS "matings: update policy" ON public.matings;
DROP POLICY IF EXISTS "matings: delete policy" ON public.matings;

DROP POLICY IF EXISTS "weight_presets: select policy" ON public.weight_presets;
DROP POLICY IF EXISTS "weight_presets: insert policy" ON public.weight_presets;
DROP POLICY IF EXISTS "weight_presets: update policy" ON public.weight_presets;
DROP POLICY IF EXISTS "weight_presets: delete policy" ON public.weight_presets;

-- 4. Create policies for public.farms
CREATE POLICY "farms: select policy" ON public.farms
  FOR SELECT USING (owner_id IS NULL OR owner_id = auth.uid());

CREATE POLICY "farms: insert policy" ON public.farms
  FOR INSERT WITH CHECK (owner_id IS NULL OR owner_id = auth.uid());

CREATE POLICY "farms: update policy" ON public.farms
  FOR UPDATE USING (owner_id IS NULL OR owner_id = auth.uid()) WITH CHECK (owner_id IS NULL OR owner_id = auth.uid());

CREATE POLICY "farms: delete policy" ON public.farms
  FOR DELETE USING (owner_id IS NULL OR owner_id = auth.uid());

-- 5. Create policies for public.females
CREATE POLICY "females: select policy" ON public.females
  FOR SELECT USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "females: insert policy" ON public.females
  FOR INSERT WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "females: update policy" ON public.females
  FOR UPDATE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "females: delete policy" ON public.females
  FOR DELETE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

-- 6. Create policies for public.bulls
CREATE POLICY "bulls: select policy" ON public.bulls
  FOR SELECT USING (farm_id IS NULL OR farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "bulls: insert policy" ON public.bulls
  FOR INSERT WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "bulls: update policy" ON public.bulls
  FOR UPDATE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "bulls: delete policy" ON public.bulls
  FOR DELETE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

-- 7. Create policies for public.tank_bulls
CREATE POLICY "tank_bulls: select policy" ON public.tank_bulls
  FOR SELECT USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "tank_bulls: insert policy" ON public.tank_bulls
  FOR INSERT WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "tank_bulls: update policy" ON public.tank_bulls
  FOR UPDATE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "tank_bulls: delete policy" ON public.tank_bulls
  FOR DELETE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

-- 8. Create policies for public.matings
CREATE POLICY "matings: select policy" ON public.matings
  FOR SELECT USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "matings: insert policy" ON public.matings
  FOR INSERT WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "matings: update policy" ON public.matings
  FOR UPDATE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "matings: delete policy" ON public.matings
  FOR DELETE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

-- 9. Create policies for public.weight_presets
CREATE POLICY "weight_presets: select policy" ON public.weight_presets
  FOR SELECT USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "weight_presets: insert policy" ON public.weight_presets
  FOR INSERT WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "weight_presets: update policy" ON public.weight_presets
  FOR UPDATE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));

CREATE POLICY "weight_presets: delete policy" ON public.weight_presets
  FOR DELETE USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id IS NULL OR owner_id = auth.uid()));
