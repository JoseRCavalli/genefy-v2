-- Migration: Adicionar observações de fêmeas
ALTER TABLE females ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
