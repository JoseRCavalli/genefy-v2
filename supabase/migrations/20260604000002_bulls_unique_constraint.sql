-- Migration: Atualizar constraint de unicidade dos touros para permitir overrides por fazenda
ALTER TABLE public.bulls DROP CONSTRAINT IF EXISTS bulls_code_key;
ALTER TABLE public.bulls ADD CONSTRAINT bulls_farm_id_code_key UNIQUE (farm_id, code);
