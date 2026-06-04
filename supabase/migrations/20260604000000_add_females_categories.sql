-- Migration: Adicionar categorias manuais de fêmeas
ALTER TABLE females ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
